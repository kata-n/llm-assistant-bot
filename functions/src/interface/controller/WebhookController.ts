import { Router, Request, Response } from "express";
import { GitHubCommentUseCase } from "../../application/GitHubCommentUseCase";
import { GeminiClient } from "../../infrastructure/gemini/GeminiClient";
import { GitHubClient } from "../../infrastructure/github/GitHubClient";
import { AICommentService } from "../../domain/service/AICommentService";
import { HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const event = req.headers["x-github-event"];
    const payload = req.body;

    logger.info("requested github webhook", payload);

    // Bot本人の投稿を除外
    if (
      payload.sender?.type === "Bot" ||
      payload.sender?.login === "gemini-ai-assistant[bot]"
    ) {
      logger.info("Bot post ignored", payload);
      res.status(200).send("Bot post ignored");
      return;
    }

    const issueNumber = payload.issue?.number || payload.pull_request?.number;
    const content = payload.issue?.body || payload.pull_request?.body;
    const repo = payload.repository;

    logger.info("requested github repository", repo);

    if (!issueNumber || !content) {
      throw new HttpsError(
        "invalid-argument",
        `issueNumber or content is not found: ${JSON.stringify(payload)}`
      );
    }

    const githubClient = new GitHubClient();
    const geminiClient = new GeminiClient(process.env.GEMINI_API_KEY!);
    const aiService = new AICommentService(geminiClient);
    const useCase = new GitHubCommentUseCase(aiService, githubClient);

    await useCase.handle({
      owner: repo.owner.login,
      repo: repo.name,
      issueNumber,
      prompt: content,
    });

    res.status(200).send("Comment posted");
  } catch (error) {
    throw new HttpsError("internal", `Internal Server Error: ${error}`);
  }
});

export default router;
