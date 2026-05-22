# runn Scenario Runner (VS Code Extension)

`runn-scenario-runner` is a VS Code extension to discover, run, and manage scenario tests using **`runn`** (by k1LoW) directly inside VS Code's native Testing UI (Test Explorer).

---

> 🇯🇵 **[日本語の説明はこちら](#日本語-japanese)** (Japanese documentation is available below)

---

## 🚀 Features

1. **Auto-Discovery**
   - Automatically scans your workspace for `**/*.run.yml` and `**/runbook.yml` files and lists them in the Testing sidebar.
   - Refreshes in real-time when files are added, changed, or deleted.
   - Parses the scenario file's root `desc` field and displays it next to the file name in the Test Explorer tree.

2. **Integration with Test Explorer**
   - Run individual scenarios or a whole folder of tests with a single click.
   - Test results (success/fail) are displayed directly in the editor gutter (left margin of the YAML files).

3. **Real-time Color Logs (ANSI Colors)**
   - Streams `runn` CLI stdout/stderr output in real-time to the "Test Results" panel.
   - Fully supports ANSI escape codes for clean, colorized terminal outputs.

4. **Test Cancellation**
   - Safely stop active test runs and kill the underlying `runn` processes by clicking the stop button.

---

## 🛠 Configurations

You can customize the extension via VS Code settings:

| Setting Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `runn.path` | `string` | `"runn"` | Path to the `runn` CLI binary. Supports absolute paths, relative paths, and `${workspaceFolder}` variables. (e.g., `${workspaceFolder}/bin/runn`) |
| `runn.extraArgs` | `array` | `[]` | Extra arguments to pass to the `runn run` command. (e.g., `["--debug", "--verbose"]`) |

---

## 📋 Prerequisites

You need the `runn` CLI installed on your machine.

### Installation (macOS):
```bash
brew install k1low/tap/runn
```

---

## 📖 Usage

1. Click the **Flask (Testing)** icon in the Activity Bar on the left side of VS Code.
2. Select and run your test scenarios.
3. To view logs, double-click a test item or click "Show Output" in the editor.

---

## 📝 License

[MIT License](LICENSE)

---

# 日本語 (Japanese)

`runn-scenario-runner` は、YAML でシナリオテストを記述できるツール **`runn`** (k1LoW氏作) を VS Code の標準テストインターフェース (Testing API) から直接実行・管理するための拡張機能です。

## 🚀 主な機能

1. **テストの自動検出 (Auto-Discovery)**
   - ワークスペース内の `**/*.run.yml` および `**/runbook.yml` ファイルを自動的にスキャンし、VS Code の「テスト」サイドバーに階層表示します。
   - ファイルの追加・削除・変更もリアルタイムに反映されます。
   - シナリオファイルの `desc` フィールドを解析し、ツリー表示のラベルの横にわかりやすく表示します。

2. **テストエクスプローラーとの統合 (Testing UI)**
   - 再生ボタンをクリックするだけで、単一のシナリオまたはフォルダ全体のテストを一括実行できます。
   - エディタの行の左側（ガター）にテスト結果（成功：緑のチェック、失敗：赤のバツ）が視覚的に表示されます。

3. **リアルタイムカラーログ出力 (ANSI Color Logs)**
   - テストの出力（標準出力/標準エラー）を、ターミナルと同じ下部パネルの「テスト結果」にリアルタイムでストリーミング表示します。
   - ANSIカラーに対応しているため、エラーメッセージやデバッグ情報が綺麗に色付けされて表示されます。

4. **テストのキャンセル・停止 (Cancellation)**
   - 実行中に VS Code の停止ボタンを押すことで、現在実行中の `runn` プロセスを安全に終了させることができます。

## 🛠 設定項目 (Configurations)

VS Code の設定画面から以下のオプションをカスタマイズできます：

| 設定キー | 型 | デフォルト値 | 説明 |
| :--- | :--- | :--- | :--- |
| `runn.path` | `string` | `"runn"` | `runn` 実行バイナリへのパス。絶対パス、相対パス、および `${workspaceFolder}` 変数が使用可能です。（例: `${workspaceFolder}/bin/runn`） |
| `runn.extraArgs` | `array` | `[]` | `runn run` コマンドに渡す追加の引数のリスト。（例: `["--debug", "--verbose"]`） |

## 📋 前提条件 (Prerequisites)

ローカルマシンに `runn` コマンドラインツールがインストールされている必要があります。

### インストール方法 (macOS):
```bash
brew install k1low/tap/runn
```

## 📖 使い方 (Usage)

1. アクティビティバー（左端）の「フラスコ (Testing)」アイコンをクリックします。
2. 検出されたテストシナリオが表示されます。
3. 再生アイコンをクリックして実行します。
4. テストログを見るには、テストアイテムをダブルクリックするか、エディタに表示される「Show Output」をクリックします。

## 📝 ライセンス (License)

[MIT License](LICENSE)
