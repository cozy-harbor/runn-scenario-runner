import * as vscode from 'vscode';
import { TestDiscoverer } from './testDiscoverer';
import { TestRunner } from './testRunner';

let discoverer: TestDiscoverer | undefined;

/**
 * 拡張機能のアクティベーション時の処理
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('runn-scenario-runner 拡張機能が有効化されました。');

  // 1. TestController を作成する (拡張機能ID、表示ラベル)
  const controller = vscode.tests.createTestController(
    'runnTests',
    'runn シナリオテスト'
  );
  context.subscriptions.push(controller);

  // 2. テストの検出クラス (TestDiscoverer) を作成して開始
  discoverer = new TestDiscoverer(controller);
  discoverer.activate();

  // 3. テストの実行クラス (TestRunner) を作成
  const runner = new TestRunner(controller);

  // 4. テスト実行プロファイル (Run Profile) を登録
  // これによりユーザーが「Run」ボタンを押したときの動作を定義する
  const runProfile = controller.createRunProfile(
    '実行 (runn run)',
    vscode.TestRunProfileKind.Run,
    (request, token) => runner.runHandler(request, token),
    true // デフォルトのプロファイルとして設定
  );
  context.subscriptions.push(runProfile);

  // 手動有効化用のコマンド登録
  const activateCmd = vscode.commands.registerCommand('runn-scenario-runner.activate', () => {
    vscode.window.showInformationMessage('runn Test Explorer がアクティベートされました！');
  });
  context.subscriptions.push(activateCmd);
}

/**
 * 拡張機能の非アクティベーション時の処理
 */
export function deactivate() {
  if (discoverer) {
    discoverer.deactivate();
  }
}
