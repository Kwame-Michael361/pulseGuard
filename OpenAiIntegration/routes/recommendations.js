import express from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { generateHealthRecommendations } from "../services/openaiService.js";
import { buildHealthData } from "../utils/buildHealthData.js";  // ← add this

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many requests, please slow down" },
});

router.post("/", limiter, async (req, res) => {
  const requestId = crypto.randomUUID();

  try {
    const { age, weight, height, postureScore, activityLevel } = req.body;

    if (!age || !weight || !height || !postureScore || !activityLevel) {
      return res.status(400).json({
        success: false,
        error: "Required fields: age, weight, height, postureScore, activityLevel",
        requestId,
      });
    }

    // ✅ Build the full healthData object from raw inputs
    const healthData = buildHealthData({ age, weight, height, postureScore, activityLevel });

    const recommendations = await generateHealthRecommendations(healthData);

    res.json({
      success: true,
      recommendations,
      healthData,  // ← send back computed values so frontend can display them
      timestamp: new Date().toISOString(),
      requestId,
    });

  } catch (error) {
    console.error(`[${requestId}] Error:`, error);

    if (error.name === "HealthValidationError") {
      return res.status(400).json({ success: false, error: error.message, requestId });
    }
    if (error.name === "AIResponseError") {
      return res.status(502).json({ success: false, error: "Invalid response generated", requestId });
    }

    res.status(500).json({
      success: false,
      error: "Assistant failed to respond. Please try again later.",
      requestId,
    });
  }
});

export default router;