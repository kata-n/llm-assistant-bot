export interface IAIClient {
  generateComment(prompt: string): Promise<string>;
}
