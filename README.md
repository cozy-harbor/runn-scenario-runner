# runn Scenario Runner (VS Code Extension)

`runn-scenario-runner` is a VS Code extension to discover, run, and manage scenario tests using **`runn`** (by k1LoW) directly inside VS Code's native Testing UI (Test Explorer).

Available on [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=cozy-harbor.runn-scenario-runner) and [Open VSX Registry](https://open-vsx.org/extension/cozy-harbor/runn-scenario-runner).

---

> 🇯🇵 **[日本語の説明はこちら](#日本語-japanese)** (Japanese documentation is available below)

---

## 🚀 Features

1. **Auto-Discovery & Tree View**
   - Automatically scans your workspace for `**/*.run.yml` and `**/runbook.yml` files and displays them in the Testing sidebar in a folder-based tree structure.
   - Refreshes in real-time when files are added, changed, or deleted.
   - Parses the scenario file's root `desc` field and displays it next to the file name.

2. **Integration with Test Explorer**
   - Run individual scenarios or a whole folder of tests with a single click.
   - Test results (success/fail) are displayed directly in the editor gutter (left margin of the YAML files).

3. **Real-time Color Logs (ANSI Colors)**
   - Streams `runn` CLI stdout/stderr output in real-time to the "Test Results" panel.
   - Fully supports ANSI escape codes for clean, colorized terminal outputs.

4. **Test Cancellation**
   - Safely stop active test runs and kill the underlying `runn` processes by clicking the stop button.

5. **Editor Integrations (YAML Files)**
   - **CodeLens**: Renders a clickable `▶ Run Scenario` link at the top (line 0) of any YAML file to execute it immediately.
   - **Editor Title Button**: Adds a play icon button at the top-right toolbar of the editor when editing a YAML file.
   - **Context Menu**: Adds `runn: Run Current Scenario` to the right-click context menu of YAML editors.
   - **Keyboard Shortcut**: Run the active scenario with `cmd+alt+r` (macOS) or `ctrl+alt+r` (Windows/Linux).

---

## 🛠 Configurations

You can customize the extension via VS Code settings:

| Setting Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `runn.path` | `string` | `"runn"` | Path to the `runn` CLI binary. Supports absolute paths, relative paths, and `${workspaceFolder}` variables. Can also accept wrapper commands like `docker container run`. (e.g., `docker container run --rm -v ${workspaceFolder}:/books -w /books ghcr.io/k1low/runn:latest`) |
| `runn.extraArgs` | `array` | `[]` | Extra arguments to pass to the `runn run` command. (e.g., `["--debug", "--verbose"]`) |
| `runn.testDirectory` | `string` | `""` | Subdirectory containing scenario files (e.g., `"test"`). If specified, all `.yml` and `.yaml` files inside this directory will be scanned as tests. Use `"."` to target the workspace root. |
| `runn.testFilePattern` | `string` | `**/{*.run.yml,runbook.yml}` | Glob pattern to discover test files when `runn.testDirectory` is empty. |

### 🐳 Running via Docker
If you want to run `runn` using a Docker container, you can configure the `runn.path` setting with your Docker run command chain.

Here is a recommended configuration in `.vscode/settings.json` (assuming you mount your workspace directory):
```json
{
    "runn.path": "docker container run --rm -v ${workspaceFolder}:/books -w /books ghcr.io/k1low/runn:latest",
    "runn.testDirectory": "."
}
```
- **`-v ${workspaceFolder}:/books`**: Mounts your local workspace directory to `/books` inside the container.
- **`-w /books`**: Sets the working directory inside the container to `/books`.
- **`"runn.testDirectory": "."`**: Targets `.yml` / `.yaml` files from the workspace root.

*Note: Since the extension executes scenarios using relative paths, the mounted workspace files inside the container will align perfectly.*

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

## ☕ Support

If you find this extension helpful, please consider supporting its development!

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Donate-ffdd00?style=flat-square&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/cozy_harbor)

---

## 📝 License

[MIT License](LICENSE)

---

# 日本語 (Japanese)

`runn-scenario-runner` は、YAML でシナリオテストを記述できるツール **`runn`** (k1LoW氏作) を VS Code の標準テストインターフェース (Testing API) から直接実行・管理するための拡張機能です。

[Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=cozy-harbor.runn-scenario-runner) および [Open VSX Registry](https://open-vsx.org/extension/cozy-harbor/runn-scenario-runner) からインストールしてご利用いただけます。

## 🚀 主な機能

1. **テストの自動検出とツリー表示 (Auto-Discovery & Tree View)**
   - ワークスペース内の `**/*.run.yml` および `**/runbook.yml` ファイルを自動的にスキャンし、実際のフォルダ・ディレクトリ構造をそのまま反映したツリー形式で VS Code の「テスト」サイドバーに表示します。
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

5. **エディタ連携機能 (YAML ファイル)**
   - **CodeLens**: YAML ファイルの最上部（0行目）に `▶ Run Scenario` リンクを表示し、ワンクリックでそのシナリオを実行できます。
   - **エディタタイトルボタン**: YAML ファイルを編集している際、エディタ右上のツールバーに「再生」アイコンボタンが表示されます。
   - **コンテキストメニュー**: エディタ内を右クリックした際のメニューに `runn: Run Current Scenario` が追加されます。
   - **キーボードショートカット**: `cmd+alt+r` (macOS) / `ctrl+alt+r` (Windows/Linux) で、現在開いているエディタのシナリオテストを即座に実行できます。

## 🛠 設定項目 (Configurations)

VS Code の設定画面から以下のオプションをカスタマイズできます：

| 設定キー | 型 | デフォルト値 | 説明 |
| :--- | :--- | :--- | :--- |
| `runn.path` | `string` | `"runn"` | `runn` 実行バイナリへのパス。絶対パス、相対パス、および `${workspaceFolder}` 変数が使用可能です。また、`docker container run` のような起動コマンドをそのまま記述することも可能です。（例: `docker container run --rm -v ${workspaceFolder}:/books -w /books ghcr.io/k1low/runn:latest`） |
| `runn.extraArgs` | `array` | `[]` | `runn run` コマンドに渡す追加の引数のリスト。（例: `["--debug", "--verbose"]`） |
| `runn.testDirectory` | `string` | `""` | シナリオファイルを格納する特定のサブディレクトリ（例: `"test"`）。指定すると、そのフォルダ内のすべての `.yml`, `.yaml` ファイルがテストとして自動検出されます。ワークスペース直下を対象にする場合は `"."` を指定します。 |
| `runn.testFilePattern` | `string` | `**/{*.run.yml,runbook.yml}` | `runn.testDirectory` が未指定の場合に、テストファイルを自動検出するための glob パターン。 |

### 🐳 Docker 経由での実行
Docker コンテナ内の `runn` を使用してテストを実行したい場合は、`runn.path` に Docker の起動コマンドを設定することができます。

推奨される設定例（`.vscode/settings.json`）：
```json
{
    "runn.path": "docker container run --rm -v ${workspaceFolder}:/books -w /books ghcr.io/k1low/runn:latest",
    "runn.testDirectory": "."
}
```
- **`-v ${workspaceFolder}:/books`**: ローカルのワークスペースフォルダをコンテナ内の `/books` にマウントします。
- **`-w /books`**: コンテナ内の作業ディレクトリを `/books` に指定します。
- **`"runn.testDirectory": "."`**: ワークスペース直下の `.yml` / `.yaml` ファイルをテスト対象にします。

*※拡張機能が自動でパスを相対パス（例: `success.yml`）に解決してコンテナに引き渡すため、マウントされた環境でも矛盾なく正常にテストが実行されます。*

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

## ☕ 開発の支援 (Support)

もしこの拡張機能がお役に立ちましたら、継続的な開発支援をご検討いただけますと幸いです！

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Donate-ffdd00?style=flat-square&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/cozy_harbor)

## 📝 ライセンス (License)

[MIT License](LICENSE)
