import { Comment } from "../model/Comment";
import { IAIClient } from "../../interface/service/IAIClient";
import { DiffFile, PRInfo } from "../../constants/AICommentService.types";
import {
  PR_DIFF_PROMPT_TEMPLATE,
  DIFF_FILE_SUMMARY_TEMPLATE,
  DIFF_FILE_NO_PATCH_PLACEHOLDER,
  DIFF_FILE_SUMMARY_KEY_FILENAME,
  DIFF_FILE_SUMMARY_KEY_STATUS,
  DIFF_FILE_SUMMARY_KEY_PATCH,
  PR_DIFF_PROMPT_KEY_SOURCE_BRANCH,
  PR_DIFF_PROMPT_KEY_FILE_SUMMARIES,
} from "../../constants/AICommentService.constants";
import { logger } from "firebase-functions/v2";
import { BOT_PERSONAS_ARRAY } from "../../constants/BotPersona.constants";

export class AICommentService {
  private readonly aiClient: IAIClient;

  constructor(aiClient: IAIClient) {
    this.aiClient = aiClient;
  }

  async createCommentFromPrompt(prompt: string): Promise<Comment> {
    const botPersona =
      BOT_PERSONAS_ARRAY[Math.floor(Math.random() * BOT_PERSONAS_ARRAY.length)];

    const result = await this.aiClient.generateComment(
      botPersona.name,
      prompt,
      []
    );
    return new Comment(result.message);
  }

  async summarizeDiffAndGeneratePR(
    diffFiles: DiffFile[],
    sourceBranch: string
  ): Promise<PRInfo> {
    const fileSummaries = diffFiles
      .map((file) =>
        DIFF_FILE_SUMMARY_TEMPLATE.replace(
          DIFF_FILE_SUMMARY_KEY_FILENAME,
          file.filename
        )
          .replace(DIFF_FILE_SUMMARY_KEY_STATUS, file.status)
          .replace(
            DIFF_FILE_SUMMARY_KEY_PATCH,
            file.patch ?? DIFF_FILE_NO_PATCH_PLACEHOLDER
          )
      )
      .join("\n\n");

    const prompt = PR_DIFF_PROMPT_TEMPLATE.replace(
      PR_DIFF_PROMPT_KEY_SOURCE_BRANCH,
      sourceBranch
    ).replace(PR_DIFF_PROMPT_KEY_FILE_SUMMARIES, fileSummaries);

    try {
      const botPersona =
        BOT_PERSONAS_ARRAY[
          Math.floor(Math.random() * BOT_PERSONAS_ARRAY.length)
        ];

      const result = await this.aiClient.generateComment(
        botPersona.name,
        prompt,
        []
      );
      logger.info("[AICommentService] response", JSON.stringify(result));

      const cleaned = extractJsonFromGeminiResponse(result.message);

      logger.info("[AICommentService] cleaned", JSON.stringify(cleaned));

      return JSON.parse(cleaned);
    } catch (error) {
      console.error("[Gemini JSON Parse Error]", error);
      throw new Error("Geminiからの応答を解析できませんでした");
    }
  }
}

function extractJsonFromGeminiResponse(response: string): string {
  const matchJsonBlock = response.match(/```json\s*([\s\S]*?)\s*```/i);
  if (matchJsonBlock) return matchJsonBlock[1].trim();

  const matchCodeBlock = response.match(/```\s*([\s\S]*?)\s*```/);
  if (matchCodeBlock) return matchCodeBlock[1].trim();

  const matchObject = response.match(/\{[\s\S]+?\}/);
  if (matchObject) return matchObject[0].trim();

  return response.trim();
}
