# WebhookController: PR マージ済み時のコメント投稿抑止

- [x] 既存の PR マージ判定処理の有無を調査
- [x] isPrMerged(payload) を validators に追加
- [x] WebhookController で isPrMerged を利用し、マージ済みならコメント投稿をスキップ
- [x] logger で状況を記録
- [ ] 動作検証・テスト
- [x] タスク記録・完了報告

## 実施日: 2025-05-09 00:22 JST
