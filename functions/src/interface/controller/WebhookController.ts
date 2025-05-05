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

    logger.info("requested github webhook", `${JSON.stringify(payload)}`);

    // Bot本人の投稿を除外
    if (
      payload.sender?.type === "Bot" ||
      payload.sender?.login === "gemini-ai-assistant[bot]"
    ) {
      logger.info("Bot post ignored", `${JSON.stringify(payload)}`);
      res.status(200).send("Bot post ignored");
      return;
    }

    const issueNumber = payload.issue?.number || payload.pull_request?.number;
    const content = payload.issue?.body || payload.pull_request?.body;
    const repo = payload.repository;

    logger.info("requested github repository", `${JSON.stringify(repo)}`);

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

    let prompt = content;

    // PRの場合はファイル差分をプロンプトに追加
    if (payload.pull_request) {
      const prFiles = await githubClient.getPullRequestFiles(
        repo.owner.login,
        repo.name,
        issueNumber
      );
      // 差分があるファイルのみ抽出し、patchが存在するものだけを対象
      const diffs = prFiles
        .filter((f) => !!f.patch)
        .map((f) => `--- ${f.filename} ---\n${f.patch}`)
        .join("\n\n");
      if (diffs) {
        prompt += `\n\n--- このPRの変更ファイルと差分 ---\n${diffs}`;
      }
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
