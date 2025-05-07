import { Router, Request, Response } from "express";
import { GitHubCommentUseCase } from "../../application/GitHubCommentUseCase";
import { GeminiClient } from "../../infrastructure/gemini/GeminiClient";
import { GitHubClient } from "../../infrastructure/github/GitHubClient";
import { AICommentService } from "../../domain/service/AICommentService";
import { HttpsError } from "firebase-functions/v2/https";
import {
  isBotPost,
  validateGitHubWebhookPayload,
} from "./validators/githubWebhookValidator";
import {
  logWebhookRequest,
  logBotPostIgnored,
  logRepositoryInfo,
} from "./utils/githubWebhookLogger";
import { buildPrDiffPrompt } from "./utils/prDiffBuilder";
import { CreatePullRequestUseCase } from "../../application/CreatePullRequestUseCase";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    logWebhookRequest(payload);

    // Bot本人の投稿を除外
    if (isBotPost(payload)) {
      logBotPostIgnored(payload);
      res.status(200).send("Bot post ignored");
      return;
    }

    if (
      payload.action === "created" &&
      payload.comment?.body?.toLowerCase().includes("pr作って") &&
      payload.issue?.pull_request
    ) {
      const owner = payload.repository.owner.login;
      const repo = payload.repository.name;
      const issueNumber = payload.issue.number;

      const githubClient = new GitHubClient();
      const geminiClient = new GeminiClient(process.env.GEMINI_API_KEY!);
      const aiService = new AICommentService(geminiClient);
      const prUseCase = new CreatePullRequestUseCase(aiService, githubClient);

      try {
        const prUrl = payload.issue.pull_request.url;
        const pr = await githubClient.getPullRequestFromUrl(prUrl);
        const sourceBranch = pr.head.ref;

        await prUseCase.handle({ owner, repo, issueNumber, sourceBranch });
        return res.status(200).send("PR created via Gemini");
      } catch (err) {
        console.error("[Webhook Error]", err);
        return res.status(500).send("Failed to create PR");
      }
    }

    const { issueNumber, content } = validateGitHubWebhookPayload(payload);
    const repo = payload.repository;

    logRepositoryInfo(repo);

    const githubClient = new GitHubClient();
    const geminiClient = new GeminiClient(process.env.GEMINI_API_KEY!);
    const aiService = new AICommentService(geminiClient);
    const useCase = new GitHubCommentUseCase(aiService, githubClient);

    let prompt = content;

    // PRの場合はファイル差分をプロンプトに追加
    if (payload.pull_request) {
      const prFiles = await githubClient.getPullRequestFiles(
        repo.owner.login,
        repo.name,
        issueNumber
      );
      prompt += buildPrDiffPrompt(prFiles);
    }

    await useCase.handle({
      owner: repo.owner.login,
      repo: repo.name,
      issueNumber,
      prompt,
    });

    res.status(200).send("Comment posted");
  } catch (error) {
    throw new HttpsError("internal", `Internal Server Error: ${error}`);
  }
});

export default router;
