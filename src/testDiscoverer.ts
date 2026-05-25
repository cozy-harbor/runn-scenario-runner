import * as vscode from 'vscode';
import * as fs from 'fs';

/**
 * ワークスペース内の runn シナリオファイル (*.run.yml, runbook.yml) を検出し、
 * VS Code の TestController に登録・同期するクラス
 */
export class TestDiscoverer {
  private watchers: vscode.FileSystemWatcher[] = [];
  private disposables: vscode.Disposable[] = [];

  constructor(private controller: vscode.TestController) {}

  /**
   * テストの検出処理を開始する
   */
  public async activate() {
    // 1. 初期スキャンを実行して既存のファイルを検出
    await this.discoverAllTests();

    // 2. ファイル変更を監視するウォッチャーを設定 (ワークスペースフォルダーごとに構築)
    if (vscode.workspace.workspaceFolders) {
      for (const folder of vscode.workspace.workspaceFolders) {
        const filePattern = this.getWatcherPattern(folder.uri);
        const relativePattern = new vscode.RelativePattern(folder, filePattern);
        const watcher = vscode.workspace.createFileSystemWatcher(relativePattern);

        watcher.onDidCreate(uri => this.createOrUpdateTest(uri), null, this.disposables);
        watcher.onDidChange(uri => this.createOrUpdateTest(uri), null, this.disposables);
        watcher.onDidDelete(uri => this.deleteTest(uri), null, this.disposables);

        this.watchers.push(watcher);
        this.disposables.push(watcher);
      }
    }

    // 3. 設定変更のイベントも監視する (テストディレクトリ設定が変更されたら再スキャン)
    const configListener = vscode.workspace.onDidChangeConfiguration(async e => {
      if (e.affectsConfiguration('runn.testDirectory') || e.affectsConfiguration('runn.testFilePattern')) {
        this.deactivate();
        this.controller.items.forEach(item => this.controller.items.delete(item.id));
        await this.activate();
      }
    });
    this.disposables.push(configListener);
  }

  /**
   * 検出パターンの取得 (特定リソースのスコープに対応)
   */
  private getWatcherPattern(uri?: vscode.Uri): string {
    const config = vscode.workspace.getConfiguration('runn', uri);
    const testDir = config.get<string>('testDirectory') || '';
    const filePattern = config.get<string>('testFilePattern') || '**/{*.run.yml,runbook.yml}';

    if (testDir) {
      // 行頭の ./ や .\ 、および末尾のスラッシュを削除して glob パターンを形成
      let cleanDir = testDir.trim().replace(/[\\/]$/, '');
      cleanDir = cleanDir.replace(/^\.[\\/]/, '');
      if (cleanDir === '.' || cleanDir === '') {
        return '**/*.{yml,yaml}';
      }
      return `${cleanDir}/**/*.{yml,yaml}`;
    }
    return filePattern;
  }

  /**
   * ウォッチャーのリソースを解放する
   */
  public deactivate() {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.watchers = [];
  }

  /**
   * ワークスペース内を走査してすべてのテストを検出する
   */
  private async discoverAllTests() {
    if (!vscode.workspace.workspaceFolders) {
      return;
    }

    for (const folder of vscode.workspace.workspaceFolders) {
      const filePattern = this.getWatcherPattern(folder.uri);
      // フォルダ内の対象ファイルを検索
      const pattern = new vscode.RelativePattern(folder, filePattern);
      const uris = await vscode.workspace.findFiles(pattern);

      for (const uri of uris) {
        await this.createOrUpdateTest(uri);
      }
    }
  }

  /**
   * YAML ファイルの内容から desc（説明）を抽出する簡易パーサー
   * 大きなファイルをすべてロードしないよう、先頭部分のみ読み込んで正規表現で判定する
   */
  private extractDescription(filePath: string): string | undefined {
    try {
      // パフォーマンスのため、ファイルの最初の 2KB だけ読み込む
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(2048);
      const bytesRead = fs.readSync(fd, buffer, 0, 2048, 0);
      fs.closeSync(fd);

      const content = buffer.toString('utf8', 0, bytesRead);
      // 行頭の `desc: "..."` もしくは `desc: '...'` もしくは `desc: ...` を探す
      // クォートあり・なしの両方に対応
      const match = content.match(/^desc:\s*(["']?)(.*?)\1\s*$/m);
      if (match && match[2]) {
        return match[2].trim();
      }
    } catch (e) {
      // エラーは無視してデフォルト（ファイル名）を使用する
    }
    return undefined;
  }

  /**
   * 指定された URI のファイルを TestItem として登録または更新する
   */
  private async createOrUpdateTest(uri: vscode.Uri) {
    const id = uri.toString();
    const filePath = uri.fsPath;
    const fileBasename = filePath.split(/[\\/]/).pop() || filePath;

    // ファイルから説明を抽出し、見つからなければファイル名を使用
    const desc = this.extractDescription(filePath);
    const label = desc ? `${fileBasename} (${desc})` : fileBasename;

    // すでに登録されているかチェック
    let testItem = this.controller.items.get(id);

    if (testItem) {
      // 存在する場合はラベルとURIを更新
      testItem.label = label;
    } else {
      // 新規作成して TestController に追加
      testItem = this.controller.createTestItem(id, label, uri);
      this.controller.items.add(testItem);
    }
  }

  /**
   * 指定された URI のファイルを TestItem から削除する
   */
  private deleteTest(uri: vscode.Uri) {
    const id = uri.toString();
    this.controller.items.delete(id);
  }
}
