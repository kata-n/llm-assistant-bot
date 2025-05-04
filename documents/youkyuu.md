GitHub App を作って GitHub 上に gemini を通して人格を持たせ、issue や PR を作らせる github app を作成してください

参考の URL

https://zenn.dev/hiragram/articles/11aaad83c66bca

TypeScript
必要であれば express
デプロイ環境：cloud Run
AI：gemini

サンプル

import { HttpFunction } from '@google-cloud/functions-framework';
import crypto from 'crypto';
import { AppAuthentication, StrategyOptions } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// --- 環境変数とシークレット名の定義 ---
const GITHUB_APP_ID = process.env.GITHUB_APP_ID!;
const GITHUB_WEBHOOK_SECRET_NAME = process.env.GITHUB_WEBHOOK_SECRET_NAME!; // 例: projects/YOUR_PROJECT_ID/secrets/github-webhook-secret/versions/latest
const GITHUB_PRIVATE_KEY_SECRET_NAME = process.env.GITHUB_PRIVATE_KEY_SECRET_NAME!; // 例: projects/YOUR_PROJECT_ID/secrets/github-app-private-key/versions/latest
const GEMINI_API_KEY_SECRET_NAME = process.env.GEMINI_API_KEY_SECRET_NAME!; // 例: projects/YOUR_PROJECT_ID/secrets/gemini-api-key/versions/latest
const GEMINI_SYSTEM_PROMPT = process.env.GEMINI_SYSTEM_PROMPT || 'You are a helpful AI assistant named Gemini deployed on GitHub.';
const GEMINI_MODEL_NAME = process.env.GEMINI_MODEL_NAME || 'gemini-pro'; // または他の適切なモデル

// --- クライアントの初期化 (非同期で行うため関数内で実施) ---
let secretManagerClient: SecretManagerServiceClient | null = null;
let genAI: GoogleGenerativeAI | null = null;
let webhookSecret: string | null = null;
let privateKey: string | null = null;

// --- Secret Manager から値を取得するヘルパー関数 ---
async function accessSecretVersion(secretName: string): Promise<string> {
if (!secretManagerClient) {
secretManagerClient = new SecretManagerServiceClient();
}
try {
const [version] = await secretManagerClient.accessSecretVersion({
name: secretName,
});
const payload = version.payload?.data?.toString();
if (!payload) {
throw new Error(`Secret payload is empty for ${secretName}`);
}
return payload;
} catch (error) {
console.error(`Error accessing secret ${secretName}:`, error);
throw error; // エラーを再スローして処理を中断
}
}

// --- 初期化処理 (最初のリクエスト時またはコールドスタート時) ---
async function initialize() {
if (!webhookSecret || !privateKey || !genAI) {
console.log('Initializing secrets and clients...');
try {
// 環境変数のチェック
if (!GITHUB_APP_ID || !GITHUB_WEBHOOK_SECRET_NAME || !GITHUB_PRIVATE_KEY_SECRET_NAME || !GEMINI_API_KEY_SECRET_NAME) {
throw new Error('Missing required environment variables for secrets.');
}

            // Secret Managerからシークレットを取得 (並列実行)
            [webhookSecret, privateKey, geminiApiKey] = await Promise.all([
                accessSecretVersion(GITHUB_WEBHOOK_SECRET_NAME),
                accessSecretVersion(GITHUB_PRIVATE_KEY_SECRET_NAME),
                accessSecretVersion(GEMINI_API_KEY_SECRET_NAME),
            ]);

            if (!webhookSecret || !privateKey || !geminiApiKey) {
                 throw new Error('Failed to retrieve one or more secrets.');
            }

            // Geminiクライアント初期化
            genAI = new GoogleGenerativeAI(geminiApiKey);
            console.log('Initialization complete.');

        } catch (error) {
             console.error('Initialization failed:', error);
             // 初期化失敗時は以降の処理ができないため、nullのままにするか、エラー状態を示す
             webhookSecret = null; // エラー発生時は null に戻すなどで後続処理をガード
             privateKey = null;
             genAI = null;
             throw error; // Cloud Runにエラーを通知
        }
    }

}

// --- GitHub App 認証ヘルパー ---
async function getInstallationOctokit(installationId: number): Promise<Octokit> {
if (!privateKey) {
throw new Error("GitHub App private key is not initialized.");
}
const authOptions: StrategyOptions = {
appId: parseInt(GITHUB_APP_ID, 10),
privateKey: privateKey,
installationId: installationId,
};
// Octokit v20 以降では fetch が必須ではなくなった可能性あり、要確認
const auth = await new AppAuthentication(authOptions).hook(fetch) as AppAuthentication;
const { token } = await auth({ type: 'installation' });
return new Octokit({ auth: token });
};

// --- Webhook 署名検証 ---
function verifySignature(rawBody: Buffer, signatureHeader: string): boolean {
if (!webhookSecret) {
console.error("Webhook secret is not initialized. Cannot verify signature.");
return false;
}
if (!signatureHeader) {
console.warn('Signature header missing!');
return false;
}
try {
const hmac = crypto.createHmac('sha256', webhookSecret);
const digest = Buffer.from('sha256=' + hmac.update(rawBody).digest('hex'), 'utf8');
const checksum = Buffer.from(signatureHeader, 'utf8');

        if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
            console.warn('Signature verification failed!');
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error during signature verification:', error);
        return false;
    }

}

// --- メインの HTTP 関数 ---
export const githubWebhookHandler: HttpFunction = async (req, res) => {
// --- 初期化処理 (毎回呼び出すが、実際には初回のみ実行される) ---
try {
await initialize();
// 初期化に失敗していたら処理中断
if (!webhookSecret || !privateKey || !genAI) {
console.error("Service is not properly initialized. Aborting request.");
res.status(500).send("Service Initialization Error");
return;
}
} catch (initError) {
console.error('Failed to initialize during request:', initError);
res.status(500).send('Initialization Failed');
return;
}

    // --- 署名検証 ---
    // functions-framework は rawBody を自動的に提供してくれる
    if (!req.rawBody) {
        console.error('Raw body is missing. Cannot verify signature.');
        res.status(400).send('Bad Request: Raw body missing');
        return;
    }
    const signature = req.headers['x-hub-signature-256'] as string;
    if (!verifySignature(req.rawBody, signature)) {
        res.status(401).send('Unauthorized: Invalid signature');
        return;
    }

    // --- イベント処理 ---
    const eventType = req.headers['x-github-event'] as string;
    const payload = req.body; // functions-frameworkがJSONをパース済み

    console.log(`Received event: ${eventType}`);

    // 例: Issueコメントイベント ("@gemini-bot" へのメンション)
    if (eventType === 'issue_comment' && payload.action === 'created') {
        if (payload.sender?.type === 'Bot') {
            console.log('Skipping bot comment');
            res.status(200).send('Skipped bot comment');
            return;
        }

        const commentBody: string = payload.comment.body;
        // ボットへのメンションを検出 (例: @gemini-bot) - App名に合わせて変更
        const mentionRegex = /@gemini-github-bot/i; // 大文字小文字区別しない
        if (!commentBody || !mentionRegex.test(commentBody)) {
            console.log('Bot mention not found');
            res.status(200).send('Mention not found');
            return;
        }

        const installationId = payload.installation?.id;
        const repository = payload.repository;
        const issue = payload.issue;

        if (!installationId || !repository?.full_name || !issue?.number) {
            console.error('Missing installation ID, repository name, or issue number');
            res.status(400).send('Bad Request: Invalid payload');
            return;
        }

        try {
            const octokit = await getInstallationOctokit(installationId);
            const repoOwner = repository.owner.login;
            const repoName = repository.name;
            const issueNumber = issue.number;

            const userPrompt = commentBody.replace(mentionRegex, '').trim();

            if (!userPrompt) {
                console.log('Empty prompt after removing mention.');
                await octokit.issues.createComment({
                    owner: repoOwner,
                    repo: repoName,
                    issue_number: issueNumber,
                    body: "メンションありがとうございます！何か質問はありますか？"
                });
                res.status(200).send('Prompt required');
                return;
            }

            console.log(`Processing comment for issue ${issueNumber} in ${repository.full_name}`);
            console.log(`User prompt: ${userPrompt}`);

            // --- Gemini API 呼び出し ---
            const model = genAI.getGenerativeModel({
                model: GEMINI_MODEL_NAME,
                systemInstruction: GEMINI_SYSTEM_PROMPT, // System Prompt を設定
            });

            // 必要に応じて過去の会話履歴をコンテキストに追加
            // const chatHistory = [ ... ]; // Issueの過去コメントなどを取得して整形
            // const chat = model.startChat({ history: chatHistory });
            // const result = await chat.sendMessage(userPrompt);

            // シンプルな単発応答の場合
            const result = await model.generateContent(userPrompt);
            const geminiResponse = result.response.text();

            // --- GitHubにコメント投稿 ---
            await octokit.issues.createComment({
                owner: repoOwner,
                repo: repoName,
                issue_number: issueNumber,
                body: geminiResponse,
            });

            console.log(`Successfully posted Gemini's response to issue ${issueNumber}`);
            res.status(200).send('Success');

        } catch (error) {
            console.error('Error processing comment event:', error);
            // エラー通知を試みる
            try {
                 if (installationId && repository?.owner?.login && repository?.name && issue?.number) {
                     const octokit = await getInstallationOctokit(installationId);
                     await octokit.issues.createComment({
                          owner: repository.owner.login,
                          repo: repository.name,
                          issue_number: issue.number,
                          body: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                      });
                 }
             } catch (commentError) {
                  console.error('Failed to post error comment:', commentError);
             }
            res.status(500).send('Internal Server Error');
        }
        return; // 処理完了
    }

    // --- 他のイベントタイプの処理を追加 ---
    // if (eventType === 'pull_request' && ...) { ... }

    console.log(`Event type ${eventType} ignored.`);
    res.status(200).send('Event ignored');

};

サンプルその 2

// index.ts
import express from 'express';
import bodyParser from 'body-parser';
import webhookHandler from './routes/webhook';

const app = express();
app.use(bodyParser.json());
app.use('/webhook', webhookHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
console.log(`Server listening on port ${PORT}`);
});

---

import express from 'express';
import { Octokit } from '@octokit/rest';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;

const octokit = new Octokit({ auth: GITHUB_TOKEN });

router.post('/', async (req, res) => {
const signature = req.headers['x-hub-signature-256'] as string;
const payload = JSON.stringify(req.body);

// HMAC 検証
const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
const digest = 'sha256=' + hmac.update(payload).digest('hex');
if (signature !== digest) return res.status(401).send('Invalid signature');

const event = req.headers['x-github-event'];
if (event === 'issues' || event === 'pull_request') {
const body = event === 'issues'
? req.body.issue.body
: req.body.pull_request.body;

    // Geminiへ問い合わせ
    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: `以下の内容についてコメントして: ${body}` }] }]
      }
    );

    const aiComment = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiComment) return res.status(500).send('Gemini failed');

    const repo = req.body.repository;
    const issueNumber = event === 'issues'
      ? req.body.issue.number
      : req.body.pull_request.number;

    await octokit.issues.createComment({
      owner: repo.owner.login,
      repo: repo.name,
      issue_number: issueNumber,
      body: aiComment
    });

    return res.status(200).send('Comment posted');

}

return res.status(200).send('Event ignored');
});

export default router;
