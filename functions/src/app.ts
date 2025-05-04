import express from "express";
import bodyParser from "body-parser";
import webhookRouter from "./interface/controller/WebhookController";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use("/", webhookRouter);

export { app };
