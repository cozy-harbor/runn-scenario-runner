# Change Log

All notable changes to the "runn-scenario-runner" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [v0.0.7](https://github.com/cozy-harbor/runn-scenario-runner/compare/v0.0.6...v0.0.7) - 2026-05-26
- fix(ci): use PERSONAL_ACCESS_TOKEN in tagpr to trigger release by @cozy-harbor in https://github.com/cozy-harbor/runn-scenario-runner/pull/18

## [v0.0.6](https://github.com/cozy-harbor/runn-scenario-runner/compare/v0.0.5...v0.0.6) - 2026-05-26
- docs: update CHANGELOG.md for versions 0.0.1 to 0.0.5 by @cozy-harbor in https://github.com/cozy-harbor/runn-scenario-runner/pull/12
- chore: update GEMINI.md rules for release CHANGELOG update by @cozy-harbor in https://github.com/cozy-harbor/runn-scenario-runner/pull/13
- docs: add Buy Me a Coffee support links by @cozy-harbor in https://github.com/cozy-harbor/runn-scenario-runner/pull/14
- ci: automate release and tagging using Songmu/tagpr by @cozy-harbor in https://github.com/cozy-harbor/runn-scenario-runner/pull/16
- feat: support tree view in VS Code Test Explorer by @cozy-harbor in https://github.com/cozy-harbor/runn-scenario-runner/pull/15

## [0.0.5] - 2026-05-25

### Added
- Support resource-scoped configurations (like `runn.path` and `runn.testDirectory`) for multi-root workspaces.
- Support directory-specific `FileSystemWatcher` using `RelativePattern` tied to individual folder configurations.
- Automatic publishing to Visual Studio Marketplace and Open VSX Registry inside the GitHub Actions release workflow.

### Fixed
- Fixed a bug where files were not detected when `runn.testDirectory` was specified with a leading `./` (e.g., `./test`), by automatically stripping leading `./` or `.\` characters from the directory configuration paths.
- Excluded `.antigravitycli/` and `Dockerfile` from the packaged VSIX extension file.

## [0.0.4] - 2026-05-23

### Added
- Editor integrations to run scenario tests directly from the active YAML editor:
  - `▶ Run Scenario` CodeLens on the first line of YAML files.
  - Play button icon in the editor title toolbar.
  - `runn: Run Current Scenario` command in the editor context menu.
- Keyboard shortcuts (`cmd+alt+r` on macOS, `ctrl+alt+r` on Windows/Linux) to run the scenario under the active editor.

## [0.0.3] - 2026-05-23

### Added
- Support for relative path execution and space-separated CLI commands (e.g., `docker container run ...`).
- Added configuration options `runn.testDirectory` and `runn.testFilePattern` to customize test discovery directory and patterns.

## [0.0.2] - 2026-05-22

### Fixed
- Automatically resolve the default `runn` command path on macOS (checking Homebrew and Go binary paths) to prevent launch failures.
- Fixed a process hanging issue by correcting the HTTP request syntax in sample runn scenarios.

## [0.0.1] - 2026-05-22

### Added
- Initial release.
- Auto-discovery of `**/*.run.yml` and `**/runbook.yml` files.
- Integration with VS Code native Testing UI (Test Explorer).
- Streams `runn` CLI output with ANSI color support in real-time to the Test Results panel.
