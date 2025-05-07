import { Comment } from "../model/Comment";
import { IAIClient } from "../../interface/service/IAIClient";
import { DiffFile, PRInfo } from "../../constants/AICommentService.types";
import {
  PR_DIFF_PROMPT_TEMPLATE,
  DIFF_FILE_SUMMARY_TEMPLATE,
  DIFF_FILE_NO_PATCH_PLACEHOLDER,
} from "../../constants/AICommentService.constants";

export class AICommentService {
  private readonly aiClient: IAIClient;

  constructor(aiClient: IAIClient) {
    this.aiClient = aiClient;
  }

  async createCommentFromPrompt(prompt: string): Promise<Comment> {
    const result = await this.aiClient.generateComment(prompt);
    return new Comment(result);
  }

  async summarizeDiffAndGeneratePR(
    diffFiles: DiffFile[],
    sourceBranch: string
  ): Promise<PRInfo> {
    const fileSummaries = diffFiles
      .map((file) =>
        DIFF_FILE_SUMMARY_TEMPLATE.replace("{filename}", file.filename)
          .replace("{status}", file.status)
          .replace("{patch}", file.patch ?? DIFF_FILE_NO_PATCH_PLACEHOLDER)
      )
      .join("\n\n");

    const prompt = PR_DIFF_PROMPT_TEMPLATE.replace(
      "{sourceBranch}",
      sourceBranch
    ).replace("{fileSummaries}", fileSummaries);

    const response = await this.aiClient.generateComment(prompt);

    try {
      const parsed: PRInfo = JSON.parse(response);
      return parsed;
    } catch (error) {
      console.error("[Gemini JSON Parse Error]", error);
      throw new Error("Geminiからの応答を解析できませんでした");
    }
  }
}
