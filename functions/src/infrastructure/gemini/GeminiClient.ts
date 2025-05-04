import axios from "axios";
import { IAIClient } from "../../interface/service/IAIClient";

export class GeminiClient implements IAIClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateComment(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`;
    const res = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
    });

    return (
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "コメントの生成に失敗しました"
    );
  }
}
