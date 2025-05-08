import { Request } from "express";
import { HttpsError } from "firebase-functions/v2/https";

/**
 * Bot投稿かどうか判定
 */
export function isBotPost(payload: any): boolean {
  return (
    payload.sender?.type === "Bot" ||
    payload.sender?.login === "gemini-ai-assistant[bot]"
  );
}

/**
 * 必須パラメータ（issueNumber, content）が存在するかチェック
 * 不足時はHttpsErrorをthrow
 */
export function validateGitHubWebhookPayload(payload: any) {
  const issueNumber = payload.issue?.number || payload.pull_request?.number;
  const content = payload.issue?.body || payload.pull_request?.body;
  if (!issueNumber || !content) {
    throw new HttpsError(
      "invalid-argument",
      `issueNumber or content is not found: ${JSON.stringify(payload)}`
    );
  }
  return { issueNumber, content };
}

/**
 * コメントがPR作成リクエストかどうかをチェック
 */
export function isPrCreateComment(content: string): boolean {
  return /[\s　]*(\S+)[\s　]*に対してpr作って/i.test(content);
}

/**
 * コメントがPR作成リクエストかどうかをチェック
 */
export function getSourceBranch(content: string): string | null {
  const match = content.match(/[\s　]*(\S+)[\s　]*に対してpr作って/i);
  return match?.[1] || null;
}
