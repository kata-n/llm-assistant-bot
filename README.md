# やっほ〜！AI GitHub レビューボットの世界へようこそ 💖

やっば〜！このリポジトリ、マジで最先端の AI×GitHub 自動化プロジェクトだよっ ✨
「PR も Issue も AI でレビュー＆コメントしちゃう」って、天才の発想じゃん！？💖
しかも人格（ギャルとか標準レビュアーとか）まで選べるとか、推せる〜！

## 🌈 これなに？

GitHub App として動く AI レビューボットだよ！
Google Gemini の力で、PR や Issue に自動でコメントしたり、ノリノリでフィードバック返したりできるの。
ギャル口調も標準レビュアーも選べるから、気分で使い分けてね 💅

## 🚀 使い方ざっくり

1. **Cloud Run**にデプロイして、GitHub App として登録！
2. 必要なシークレット（API キーとか）を Google Secret Manager にセット！
3. PR や Issue でボットをメンション（例：`@gemini-github-bot`）すると、AI がコメント返してくれるよ ✨

## 🛠️ 技術スタック

- TypeScript（型安全バッチリ！）
- Express（必要に応じて）
- Google Cloud Functions / Cloud Run
- Google Gemini API（AI の本体！）
- Octokit（GitHub 連携の神ライブラリ）
- DDD/クリーンアーキテクチャでガチ設計
- タスク・ナレッジ管理も memory-bank でしっかり！

## 🏗️ ディレクトリ構成（ざっくり）

- `functions/src/` ... メインのアプリ本体
  - `constants/` ... ボット人格とか定数
  - `application/` ... ユースケース・サービス
  - `interface/` ... コントローラー・API
  - `infrastructure/` ... 外部 API クライアント
  - `domain/` ... ドメインモデル・サービス
- `documents/` ... 仕様・要件ドキュメント
- `memory-bank/` ... タスク＆ナレッジ管理

## 🔑 必要な環境変数・シークレット

- `GITHUB_APP_ID`
- `GITHUB_WEBHOOK_SECRET_NAME`
- `GITHUB_PRIVATE_KEY_SECRET_NAME`
- `GEMINI_API_KEY_SECRET_NAME`
- それぞれ Google Secret Manager で管理してね！

## 💻 セットアップ手順（ざっくり ver.）

1. 必要なシークレットを Google Secret Manager に登録
2. `functions/` ディレクトリで `npm install`
3. Cloud Run にデプロイ or ローカルでテスト
4. GitHub App を作成して Webhook を Cloud Run のエンドポイントに設定
5. PR や Issue でボットをメンションしてみて！

## 💡 ここが推しポイント

- ギャル人格で AI レビュー返せるとか、唯一無二じゃん！？✨
- 設計もガチで、拡張性・保守性もバッチリ
- memory-bank でタスク＆ナレッジも管理できて、運用もラクラク

## ⚠️ 注意・FAQ

- シークレット管理ミスると動かないから気をつけて〜💦
- Gemini API の利用制限や料金も要チェック！
- PR や Issue のイベント以外は今後拡張予定だよ！

## 📝 仕様・詳細

- もっと詳しい仕様は `documents/youkyuu.md` を見てね！
- タスク進捗やナレッジは `memory-bank/` 配下にどんどん追記してるよ！

---

え、ここまで読んでくれたの？天才すぎ！✨
何かあったら Issue で気軽に聞いてね〜！
（たまに鋭い指摘もするけど、愛ゆえだから許してっ 💖）
