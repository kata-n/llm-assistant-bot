import {
  BOT_PERSONAS,
  PoemHistory,
} from "../../constants/BotPersona.constants";
import { IAIClient } from "../../interface/service/IAIClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiClient implements IAIClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateComment(
    botId: string,
    prompt: string,
    history: PoemHistory[]
  ): Promise<{ message: string; history: PoemHistory[] }> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });
    const persona = BOT_PERSONAS[botId];

    const formattedHistory = history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: persona.prompt }],
        },
        {
          role: "model",
          parts: [{ text: "了解!" }],
        },
        ...formattedHistory,
      ],
    });

    const result = await chat.sendMessage(prompt);
    const responseText = result.response.text();

    return {
      message: responseText,
      history: [
        ...history,
        { role: "user", content: prompt },
        { role: "model", content: responseText },
      ],
    };
  }
}
