import { Comment } from "../model/Comment";
import { IAIClient } from "../../interface/service/IAIClient";

export class AICommentService {
  private readonly aiClient: IAIClient;

  constructor(aiClient: IAIClient) {
    this.aiClient = aiClient;
  }

  async createCommentFromPrompt(prompt: string): Promise<Comment> {
    const result = await this.aiClient.generateComment(prompt);
    return new Comment(result);
  }
}
