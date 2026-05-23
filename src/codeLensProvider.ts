import * as vscode from 'vscode';

/**
 * YAML シナリオエディタの上部に "▶ Run Scenario" リンクを表示する CodeLens プロバイダー
 */
export class RunnCodeLensProvider implements vscode.CodeLensProvider {
  /**
   * エディタのドキュメントに対して CodeLens を生成する
   */
  public provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    // 常にファイルの最上行（0行目）に CodeLens を表示する
    const range = new vscode.Range(0, 0, 0, 0);
    
    const command: vscode.Command = {
      title: '▶ Run Scenario',
      command: 'runn-scenario-runner.runCurrentFile',
      arguments: [document.uri]
    };

    return [new vscode.CodeLens(range, command)];
  }
}
