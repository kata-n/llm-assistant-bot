import * as functions from "firebase-functions";
import { app } from "./app";

export const githubWebhook = functions
  .region("asia-northeast1")
  .https.onRequest(app);
