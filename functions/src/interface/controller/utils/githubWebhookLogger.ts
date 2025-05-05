import { logger } from "firebase-functions/v2";

export function logWebhookRequest(payload: any) {
  logger.info("requested github webhook", `${JSON.stringify(payload)}`);
}

export function logBotPostIgnored(payload: any) {
  logger.info("Bot post ignored", `${JSON.stringify(payload)}`);
}

export function logRepositoryInfo(repo: any) {
  logger.info("requested github repository", `${JSON.stringify(repo)}`);
}
