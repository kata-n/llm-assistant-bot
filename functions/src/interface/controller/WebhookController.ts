import { Router, Request, Response } from "express";
import { GitHubCommentUseCase } from "../../application/GitHubCommentUseCase";
import { GeminiClient } from "../../infrastructure/gemini/GeminiClient";
import { GitHubClient } from "../../infrastructure/github/GitHubClient";
import { AICommentService } from "../../domain/service/AICommentService";
import { HttpsError } from "firebase-functions/v2/https";
import {
  getSourceBranch,
  isBotPost,
  isPrCreateComment,
  validateGitHubWebhookPayload,
  isPrMerged,
} from "./validators/githubWebhookValidator";
import { buildPrDiffPrompt } from "./utils/prDiffBuilder";
import { CreatePullRequestUseCase } from "../../application/CreatePullRequestUseCase";
import { logger } from "firebase-functions/v2";

const router = Router();
const ACTION_CREATED = "created";

router.post("/", async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    logger.info(
      "requested github-llm-bot webhook start",
      `${JSON.stringify(payload)}`
    );

    // Bot本人の投稿を除外
    if (isBotPost(payload)) {
      logger.info(
        "Stopping processing because it's a bot post",
        `${JSON.stringify(payload)}`
      );
      return;
    }

    if (
      payload.action === ACTION_CREATED &&
      payload.issue?.state !== ACTION_CREATED &&
      isPrCreateComment(payload.comment?.body)
    ) {
      logger.info(
        "Received PR creation request",
        `${JSON.stringify(payload.comment?.body)}`
      );

      const sourceBranch = getSourceBranch(payload.comment.body);

      if (!sourceBranch) {
        throw new HttpsError("invalid-argument", "Source branch not found");
      }

      const owner = payload.repository.owner.login;
      const repo = payload.repository.name;
      const issueNumber = payload.issue.number;

      const githubClient = new GitHubClient();
      const geminiClient = new GeminiClient(process.env.GEMINI_API_KEY!);
      const aiService = new AICommentService(geminiClient);
      const createPullRequestUseCase = new CreatePullRequestUseCase(
        aiService,
        githubClient
      );

      try {
        await createPullRequestUseCase.handle({
          owner,
          repo,
          issueNumber,
          sourceBranch,
        });
        logger.info("Successfully created pull request");
        return;
      } catch (error) {
        throw new HttpsError("internal", `Failed to create PR: ${error}`);
      }
    }

    const { issueNumber, content } = validateGitHubWebhookPayload(payload);
    const repo = payload.repository;

    logger.info("requested github repository", `${JSON.stringify(repo)}`);

    // PRがマージ済みの場合はコメント投稿をスキップ
    if (isPrMerged(payload)) {
      logger.info(
        "Skipping comment post because PR is already merged",
        `${JSON.stringify({ repo: repo.name, issueNumber })}`
      );
      return;
    }

    const githubClient = new GitHubClient();
    const geminiClient = new GeminiClient(process.env.GEMINI_API_KEY!);
    const aiService = new AICommentService(geminiClient);
    const useCase = new GitHubCommentUseCase(aiService, githubClient);

    const prompt = content;

    // PRの場合はファイル差分をプロンプトに追加
    const promptWithDiff = payload.pull_request
      ? prompt +
        buildPrDiffPrompt(
          await githubClient.getPullRequestFiles(
            repo.owner.login,
            repo.name,
            issueNumber
          )
        )
      : prompt;

    await useCase.handle({
      owner: repo.owner.login,
      repo: repo.name,
      issueNumber,
      prompt: promptWithDiff,
    });

    logger.info("Successfully posted comment");
    return;
  } catch (error) {
    throw new HttpsError("internal", `Internal Server Error: ${error}`);
  }
});

export default router;
