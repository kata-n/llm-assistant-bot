import { Comment } from "../model/Comment";
import { IAIClient } from "../../interface/service/IAIClient";
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
}
