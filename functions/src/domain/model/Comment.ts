export class Comment {
  public readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("空のコメントは許可されていません");
    }
    this.value = value;
  }
}
