import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import morgan from "morgan";
import mpesaRoutes from "./routes/mpesa.js";
import logger from "./utils/logger.js";
import ngrok from "@ngrok/ngrok";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Routes
app.use("/api/mpesa", mpesaRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("MongoDB Connected"))
  .catch((err) => logger.error("MongoDB Connection Error: %o", err));

app.get("/", (req, res) => {
  res.send("M-Pesa API Backend is running...");
});

app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);

  // Start Ngrok Tunnel if enabled
  if (process.env.USE_NGROK === "true") {
    try {
      const session = await new ngrok.SessionBuilder()
        .authtoken(process.env.NGROK_AUTHTOKEN || "")
        .connect();
      const listener = await session.httpEndpoint().listen();
      const url = listener.url();

      // Set dynamic callback URL for the session
      process.env.MPESA_CALLBACK_URL = `${url}/api/mpesa/callback`;

      logger.info(`Ngrok Tunnel Created: ${url}`);
      logger.info(
        `Dynamic M-Pesa Callback URL: ${process.env.MPESA_CALLBACK_URL}`
      );
    } catch (err) {
      logger.error("Ngrok Error: %o", err);
      logger.info(
        `Falling back to static Callback URL: ${process.env.MPESA_CALLBACK_URL}`
      );
    }
  } else {
    logger.info(
      "Ngrok is disabled. Using static Callback URL: %s",
      process.env.MPESA_CALLBACK_URL
    );
    logger.info(`Server running on port http://localhost:${PORT}`);
  }
});
