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

# AICommentService テンプレート置換キー定数化

- [x] 既存のテンプレート置換キー（{filename}、{status}、{patch}、{sourceBranch}、{fileSummaries}）を AICommentService.constants.ts で定数化
- [x] サービス内の該当箇所を定数参照にリファクタ
- [x] 既存定数との重複なし・命名規則統一
- [x] 動作影響範囲確認
- [x] タスク完了

## 実施日

- 2025-05-08 02:09:44 JST

## 分析・実施内容

- 既存のテンプレート置換キーがハードコーディングされていたため、保守性向上のため定数化を実施。
- AICommentService.constants.ts に大文字スネークケースで追加。
- サービス内の replace 箇所を定数参照に修正。
- 他ファイルでの重複利用は現状なし。

## 今後の注意点

- テンプレート追加時は必ず定数化を徹底すること。
