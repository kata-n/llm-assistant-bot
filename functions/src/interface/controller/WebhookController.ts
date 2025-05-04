import { Router, Request, Response } from "express";
import { GitHubCommentUseCase } from "../../application/GitHubCommentUseCase";
import { GeminiClient } from "../../infrastructure/gemini/GeminiClient";
import { GitHubClient } from "../../infrastructure/github/GitHubClient";
import { AICommentService } from "../../domain/service/AICommentService";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const event = req.headers["x-github-event"];
    const payload = req.body;

    const issueNumber = payload.issue?.number || payload.pull_request?.number;
    const content = payload.issue?.body || payload.pull_request?.body;
    const repo = payload.repository;
    if (!issueNumber || !content)
      return res.status(400).send("Invalid payload");

    const githubClient = new GitHubClient(process.env.GITHUB_TOKEN!);
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
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
