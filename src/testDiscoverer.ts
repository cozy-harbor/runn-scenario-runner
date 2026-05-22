import * as vscode from 'vscode';
import * as fs from 'fs';

/**
 * ワークスペース内の runn シナリオファイル (*.run.yml, runbook.yml) を検出し、
 * VS Code の TestController に登録・同期するクラス
 */
export class TestDiscoverer {
  private watcher: vscode.FileSystemWatcher | undefined;

  constructor(private controller: vscode.TestController) {}

  /**
   * テストの検出処理を開始する
   */
  public async activate() {
    // 1. 初期スキャンを実行して既存のファイルを検出
    await this.discoverAllTests();

    // 2. ファイル変更を監視するウォッチャーを設定
    // *.run.yml と runbook.yml を対象にする
    this.watcher = vscode.workspace.createFileSystemWatcher('**/{*.run.yml,runbook.yml}');

    this.watcher.onDidCreate(uri => this.createOrUpdateTest(uri));
    this.watcher.onDidChange(uri => this.createOrUpdateTest(uri));
    this.watcher.onDidDelete(uri => this.deleteTest(uri));
  }

  /**
   * ウォッチャーのリソースを解放する
   */
  public deactivate() {
    if (this.watcher) {
      this.watcher.dispose();
    }
  }

  /**
   * ワークスペース内を走査してすべてのテストを検出する
   */
  private async discoverAllTests() {
    if (!vscode.workspace.workspaceFolders) {
      return;
    }

    for (const folder of vscode.workspace.workspaceFolders) {
      // フォルダ内の対象ファイルを検索
      const pattern = new vscode.RelativePattern(folder, '**/{*.run.yml,runbook.yml}');
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
