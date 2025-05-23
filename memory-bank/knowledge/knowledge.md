## WebhookController 責務分離リファクタ（2025-05-05）

### 設計意図・分離理由

- コントローラ層はルーティングとリクエスト/レスポンスの受け渡しに専念し、業務ロジックやバリデーション、ロギング等の副次的責務を分離することで、可読性・保守性・テスト容易性を向上。
- バリデーション（Bot 判定・必須パラメータ）は validators ディレクトリに集約。
- ロギング処理は utils ディレクトリに集約。
- PR 差分生成ロジックも utils ディレクトリに分離。
- これにより、各責務の単体テストや将来的な拡張・再利用が容易になる。

### 今後の注意点

- 新たな責務追加時は必ず既存の分離方針に従い、コントローラ肥大化を防ぐこと。
- 共通化可能な処理は validators/utils 等に集約し、重複実装を避ける。

## AICommentService: プロンプト・テンプレート定数化方針（2025-05-08）

- PR 生成用プロンプトや diff サマリー等のテンプレート文字列は、`functions/src/constants/AICommentService.constants.ts` に定数として切り出す。
- 命名・配置は `BotPersona.constants.ts` など既存の定数ファイルに準拠。
- 今後、他サービスやユースケースで同様のテンプレート利用が増える場合は、共通テンプレートユーティリティや型安全なテンプレート関数への昇華を検討。
- テンプレート文字列の型安全性・テスト容易性向上も今後の改善候補。
