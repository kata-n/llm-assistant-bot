# AICommentService: プロンプト・テンプレート定数化

- [x] 既存の constants ファイル・定数定義の有無を調査（重複防止）
- [x] 切り出すべき文字列（プロンプト、テンプレート等）をリストアップ
- [x] functions/src/constants/AICommentService.constants.ts を新規作成し、定数を定義
- [x] AICommentService.ts で該当箇所を定数参照にリファクタ
- [x] 動作検証・リファクタ後の確認
- [ ] 他箇所で同様の定数利用がないか、今後の共通化候補をナレッジに記録

---

## 日時

- 実施日: 2025-05-08 00:05:29 JST

## 備考

- 命名・配置は BotPersona.constants.ts 等に準拠
- テンプレート文字列の型安全性は今後の改善候補
