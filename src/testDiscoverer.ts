import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

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
   * 指定された URI のファイルを TestItem として登録または更新する (外部呼出用)
   */
  public async discoverTest(uri: vscode.Uri) {
    await this.createOrUpdateTest(uri);
  }

  /**
   * 指定された URI のファイルの親ディレクトリ階層に対応する TestItemCollection を取得または作成する
   */
  private getOrCreateAncestorItems(uri: vscode.Uri): vscode.TestItemCollection {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (!workspaceFolder) {
      return this.controller.items;
    }

    const relativePath = path.relative(workspaceFolder.uri.fsPath, path.dirname(uri.fsPath));
    if (relativePath === '' || relativePath === '.') {
      // ワークスペースフォルダ直下の場合
      if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {
        // マルチフォルダの場合はワークスペースフォルダのノードが親
        const wsItem = this.getOrCreateWorkspaceFolderItem(workspaceFolder);
        return wsItem.children;
      } else {
        // シングルフォルダの場合は controller.items が親
        return this.controller.items;
      }
    }

    // パスを分解
    const parts = relativePath.split(/[\\/]/).filter(p => p !== '' && p !== '.');

    let currentCollection: vscode.TestItemCollection;
    let parentUri: vscode.Uri;

    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {
      const wsItem = this.getOrCreateWorkspaceFolderItem(workspaceFolder);
      currentCollection = wsItem.children;
      parentUri = workspaceFolder.uri;
    } else {
      currentCollection = this.controller.items;
      parentUri = workspaceFolder.uri;
    }

    for (const part of parts) {
      parentUri = vscode.Uri.file(path.join(parentUri.fsPath, part));
      const id = parentUri.toString();
      let item = currentCollection.get(id);
      if (!item) {
        item = this.controller.createTestItem(id, part, parentUri);
        currentCollection.add(item);
      }
      currentCollection = item.children;
    }

    return currentCollection;
  }

  /**
   * ワークスペースフォルダに対応する TestItem を取得または作成する
   */
  private getOrCreateWorkspaceFolderItem(folder: vscode.WorkspaceFolder): vscode.TestItem {
    const id = folder.uri.toString();
    let item = this.controller.items.get(id);
    if (!item) {
      item = this.controller.createTestItem(id, folder.name, folder.uri);
      this.controller.items.add(item);
    }
    return item;
  }

  /**
   * 空になった親フォルダ用の TestItem を再帰的に削除する
   */
  private cleanUpEmptyAncestors(uri: vscode.Uri) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (!workspaceFolder) {
      return;
    }

    const relativePath = path.relative(workspaceFolder.uri.fsPath, path.dirname(uri.fsPath));
    if (relativePath === '' || relativePath === '.') {
      if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {
        const wsId = workspaceFolder.uri.toString();
        const wsItem = this.controller.items.get(wsId);
        if (wsItem && wsItem.children.size === 0) {
          this.controller.items.delete(wsId);
        }
      }
      return;
    }

    const parts = relativePath.split(/[\\/]/).filter(p => p !== '' && p !== '.');
    let currentDirPath = path.dirname(uri.fsPath);

    for (let i = parts.length - 1; i >= 0; i--) {
      const dirUri = vscode.Uri.file(currentDirPath);
      const dirId = dirUri.toString();
      const parentCollection = this.getOrCreateAncestorItems(dirUri);
      
      const item = parentCollection.get(dirId);
      if (item && item.children.size === 0) {
        parentCollection.delete(dirId);
      }

      currentDirPath = path.dirname(currentDirPath);
    }

    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {
      const wsId = workspaceFolder.uri.toString();
      const wsItem = this.controller.items.get(wsId);
      if (wsItem && wsItem.children.size === 0) {
        this.controller.items.delete(wsId);
      }
    }
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

    const parentCollection = this.getOrCreateAncestorItems(uri);
    let testItem = parentCollection.get(id);

    if (testItem) {
      // 存在する場合はラベルとURIを更新
      testItem.label = label;
    } else {
      // 新規作成して親コレクションに追加
      testItem = this.controller.createTestItem(id, label, uri);
      parentCollection.add(testItem);
    }
  }

  /**
   * 指定された URI のファイルを TestItem から削除する
   */
  private deleteTest(uri: vscode.Uri) {
    const id = uri.toString();
    const parentCollection = this.getOrCreateAncestorItems(uri);
    parentCollection.delete(id);
    this.cleanUpEmptyAncestors(uri);
  }
}
