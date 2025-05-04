import { IAIClient } from "../../interface/service/IAIClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiClient implements IAIClient {
  private readonly model;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });
  }

  async generateComment(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("[GeminiClient] Error:", error);
      return "コメントの生成に失敗しました";
    }
  }
}
