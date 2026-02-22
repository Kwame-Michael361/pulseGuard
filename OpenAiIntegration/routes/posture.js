// routes/posture.js
import express from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60, // posture data sent frequently, higher limit
  message: { success: false, error: "Too many requests" },
});

router.post("/", limiter, async (req, res) => {
  const requestId = crypto.randomUUID();

  try {
    const { postureScore, postureStatus, landmarks, timestamp } = req.body;

    if (postureScore === undefined || postureScore === null) {
      return res.status(400).json({
        success: false,
        error: "postureScore is required",
        requestId,
      });
    }

    if (postureScore < 0 || postureScore > 100) {
      return res.status(400).json({
        success: false,
        error: "postureScore must be between 0 and 100",
        requestId,
      });
    }

    // Log for demo purposes — swap with DB write in production
    console.log(`[${requestId}] Posture update: score=${postureScore}, status=${postureStatus}`);

    res.json({
      success: true,
      received: {
        postureScore,
        postureStatus,
        timestamp: timestamp ?? new Date().toISOString(),
      },
      requestId,
    });

  } catch (error) {
    console.error(`[${requestId}] Posture route error:`, error);
    res.status(500).json({
      success: false,
      error: "Failed to process posture data",
      requestId,
    });
  }
});

export default router;