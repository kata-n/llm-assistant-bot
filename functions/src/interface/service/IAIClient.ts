import { PoemHistory } from "../../constants/BotPersona.constants";

export interface IAIClient {
  generateComment(
    botId: string,
    prompt: string,
    history: PoemHistory[]
  ): Promise<{ message: string; history: PoemHistory[] }>;
}
