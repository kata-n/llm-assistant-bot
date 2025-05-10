export class Comment {
  public readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("Empty comments are not allowed");
    }
    this.value = value;
  }
}
