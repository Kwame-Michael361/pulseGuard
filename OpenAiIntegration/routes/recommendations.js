import express from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { generateHealthRecommendations } from "../services/openaiService.js";

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many requests, please slow down" },
});

router.post("/", limiter, async (req, res) => {
  const requestId = crypto.randomUUID();

  try {
    const healthData = req.body;

    // Fix #1: Proper empty body check
    if (!healthData || Object.keys(healthData).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Health data is required",
        requestId,
      });
    }

    const recommendations = await generateHealthRecommendations(healthData);

    res.json({
      success: true,
      recommendations,
      timestamp: new Date().toISOString(),
      requestId,
    });

  } catch (error) {
    // Fix #3: Log verbosely, respond minimally
    console.error(`[${requestId}] Error:`, error);

    // Fix #2: Map error types to correct HTTP status codes
    if (error.name === "HealthValidationError") {
      return res.status(400).json({
        success: false,
        error: error.message, // safe to expose — it's our own validation message
        requestId,
      });
    }

    if (error.name === "AIResponseError") {
      return res.status(502).json({
        success: false,
        error: "The AI returned an invalid response. Please try again.",
        requestId,
      });
    }

    if (error.message?.includes("timed out")) {
      return res.status(504).json({
        success: false,
        error: "The request timed out. Please try again.",
        requestId,
      });
    }

    // Genuine unknown failure — don't leak internals
    res.status(500).json({
      success: false,
      error: "Assistant failed to respond. Please try again later.",
      requestId,
    });
  }
});

export default router;