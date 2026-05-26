import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

/**
 * runn シナリオの実行（テスト実行）を担当するクラス
 */
export class TestRunner {
  constructor(private controller: vscode.TestController) {}

  /**
   * テストの実行ハンドラ
   */
  public async runHandler(request: vscode.TestRunRequest, token: vscode.CancellationToken) {
    const run = this.controller.createTestRun(request);
    const queue: vscode.TestItem[] = [];

    // 実行対象のテストを決定する
    if (request.include) {
      request.include.forEach(test => this.collectTests(test, queue));
    } else {
      this.controller.items.forEach(test => this.collectTests(test, queue));
    }

    // 除外対象のテストをフィルタリングする
    const testsToRun = queue.filter(test => {
      if (request.exclude?.includes(test)) {
        return false;
      }
      return true;
    });

    if (testsToRun.length === 0) {
      run.end();
      return;
    }

    // アクティブな子プロセスを追跡して、キャンセル時にキルできるようにする
    let activeProcess: childProcess.ChildProcess | undefined;

    token.onCancellationRequested(() => {
      if (activeProcess) {
        run.appendOutput('\r\n\x1b[33m[runn] 実行がユーザーによってキャンセルされました。\x1b[0m\r\n');
        activeProcess.kill('SIGINT');
      }
    });

    // 各テストを順番に実行
    for (const test of testsToRun) {
      if (token.isCancellationRequested) {
        run.skipped(test);
        continue;
      }

      run.started(test);

      // 設定から runn バイナリのパスと追加引数を取得
      const config = vscode.workspace.getConfiguration('runn', test.uri);
      const runnPath = config.get<string>('path') || 'runn';
      const extraArgs = config.get<string[]>('extraArgs') || [];

      if (!test.uri) {
        run.failed(test, new vscode.TestMessage('テストファイルの URI が見つかりません。'));
        continue;
      }

      const filePath = test.uri.fsPath;
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(test.uri);
      const cwd = workspaceFolder ? workspaceFolder.uri.fsPath : undefined;

      // 1. まず、コマンドパスをスペースでパースしてメインコマンドと引数に分解する
      const runnCommandParts = runnPath.trim().split(/\s+/);
      let mainCommand = runnCommandParts[0] || 'runn';
      const commandArgs = runnCommandParts.slice(1);

      // 2. メインコマンドがデフォルトの "runn" の場合、macOS等の一般的なパスをフォールバックとして検索する
      if (mainCommand === 'runn') {
        const commonPaths = [
          '/opt/homebrew/bin/runn',
          '/usr/local/bin/runn',
          path.join(process.env.HOME || '', 'go/bin/runn')
        ];
        for (const p of commonPaths) {
          if (fs.existsSync(p)) {
            mainCommand = p;
            break;
          }
        }
      }

      // 3. メインコマンドに対するパス解決 (${workspaceFolder} や相対パスへの対応)
      if (mainCommand.includes('${workspaceFolder}') && workspaceFolder) {
        mainCommand = mainCommand.replace(/\$\{workspaceFolder\}/g, workspaceFolder.uri.fsPath);
      }

      if (!path.isAbsolute(mainCommand) && (mainCommand.includes('/') || mainCommand.includes('\\')) && workspaceFolder) {
        mainCommand = path.resolve(workspaceFolder.uri.fsPath, mainCommand);
      }

      // 4. その他の引数に含まれる ${workspaceFolder} も解決する (Docker マウント設定などのため)
      const resolvedCommandArgs = commandArgs.map(arg => {
        if (arg.includes('${workspaceFolder}') && workspaceFolder) {
          return arg.replace(/\$\{workspaceFolder\}/g, workspaceFolder.uri.fsPath);
        }
        return arg;
      });

      // 相対パスへの変換
      let relativeFilePath = filePath;
      if (workspaceFolder) {
        relativeFilePath = path.relative(workspaceFolder.uri.fsPath, filePath);
      }

      // 実行コマンドの引数を組み立てる
      const args = [...resolvedCommandArgs, 'run', relativeFilePath, ...extraArgs];

      // 開始ログを出力 (ANSI エスケープコードでシアン色)
      run.appendOutput(`\r\n\x1b[36m[runn] テストを開始します: ${test.label}\x1b[0m\r\n`);
      run.appendOutput(`\x1b[90m$ ${mainCommand} ${args.join(' ')}\x1b[0m\r\n\r\n`);

      try {
        // 非同期に runn を起動
        const processPromise = new Promise<{ code: number | null; signal: string | null }>((resolve, reject) => {
          activeProcess = childProcess.spawn(mainCommand, args, {
            cwd,
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env, FORCE_COLOR: '1' } // runn にカラー出力を強制する
          });

          activeProcess.stdout?.on('data', data => {
            // 改行コードを \r\n に正規化して出力
            const text = data.toString().replace(/\r?\n/g, '\r\n');
            run.appendOutput(text);
          });

          activeProcess.stderr?.on('data', data => {
            const text = data.toString().replace(/\r?\n/g, '\r\n');
            run.appendOutput(text);
          });

          activeProcess.on('close', (code, signal) => {
            resolve({ code, signal });
          });

          activeProcess.on('error', err => {
            reject(err);
          });
        });

        const { code, signal } = await processPromise;
        activeProcess = undefined;

        if (token.isCancellationRequested || signal === 'SIGINT') {
          run.skipped(test);
        } else if (code === 0) {
          run.passed(test);
          run.appendOutput(`\r\n\x1b[32m✔ [runn] テストが成功しました: ${test.label}\x1b[0m\r\n`);
        } else {
          run.failed(test, new vscode.TestMessage(`runn シナリオの実行がエラーコード ${code} で失敗しました。`));
          run.appendOutput(`\r\n\x1b[31m✘ [runn] テストが失敗しました: ${test.label}\x1b[0m\r\n`);
        }
      } catch (err: any) {
        activeProcess = undefined;
        run.failed(test, new vscode.TestMessage(`runn の起動に失敗しました: ${err.message}`));
        run.appendOutput(`\r\n\x1b[31m✘ [runn] エラー: runn の起動に失敗しました。\x1b[0m\r\n`);
        run.appendOutput(`\x1b[31m${err.message || err}\x1b[0m\r\n`);
        run.appendOutput(`\x1b[33mヒント: VS Code の設定 'runn.path' で正しく runn コマンドのパスが設定されているか確認してください。\x1b[0m\r\n`);
      }
    }

    run.end();
  }

  /**
   * テストアイテムを再帰的に走査し、実行可能なテスト（YAML葉ノード）のみをキューに追加する
   */
  private collectTests(item: vscode.TestItem, queue: vscode.TestItem[]) {
    if (item.children.size > 0) {
      item.children.forEach(child => this.collectTests(child, queue));
    } else {
      if (item.uri && (item.uri.path.endsWith('.yml') || item.uri.path.endsWith('.yaml'))) {
        queue.push(item);
      }
    }
  }
}
