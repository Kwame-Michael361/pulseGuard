import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Custom error classes
class HealthValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "HealthValidationError";
  }
}

class AIResponseError extends Error {
  constructor(message) {
    super(message);
    this.name = "AIResponseError";
  }
}

// Input validation
function validateHealthData(data) {
  if (!data || typeof data !== "object") {
    throw new HealthValidationError("healthData must be a non-null object");
  }

  const required = [
    "age", "weight", "height", "bmi",
    "hydrationLevel", "postureScore", "activityLevel", "healthRiskScore",
  ];

  const missing = required.filter((key) => data[key] === undefined || data[key] === null);
  if (missing.length > 0) {
    throw new HealthValidationError(`Missing required health fields: ${missing.join(", ")}`);
  }

  if (data.age < 0 || data.age > 120) throw new HealthValidationError("Invalid age value");
  if (data.weight <= 0) throw new HealthValidationError("Invalid weight value");
  if (data.height <= 0) throw new HealthValidationError("Invalid height value");
  if (data.postureScore < 0 || data.postureScore > 100)
    throw new HealthValidationError("postureScore must be between 0 and 100");
  if (data.healthRiskScore < 0 || data.healthRiskScore > 100)
    throw new HealthValidationError("healthRiskScore must be between 0 and 100");
}

// BMI computation
function computeBMI(weightKg, heightCm) {
  const heightM = heightCm / 100;
  return +(weightKg / (heightM * heightM)).toFixed(1);
}

// Retry wrapper with abort-aware backoff
async function withRetry(fn, retries = 3, delayMs = 500, signal) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (
        error.name === "AbortError" ||
        error.constructor?.name === "APIUserAbortError"
      ) {
        throw error;
      }

      const isRetryable =
        error?.status === 429 || error?.status === 500 || error?.status === 503;

      if (!isRetryable || attempt === retries) throw error;

      const backoff = delayMs * 2 ** (attempt - 1);
      console.warn(`Attempt ${attempt} failed. Retrying in ${backoff}ms...`);

      await new Promise((res, rej) => {
        const t = setTimeout(res, backoff);
        signal?.addEventListener("abort", () => {
          clearTimeout(t);
          rej(new Error("Aborted during retry backoff"));
        }, { once: true });
      });
    }
  }
}

// Output validation
function validateAIResponse(text) {
  const sections = ["Summary", "Recommendations", "Risk Level", "Preventive Actions"];

  for (const section of sections) {
    const regex = new RegExp(`${section}:\\s*([\\s\\S]*?)(?=(Summary|Recommendations|Risk Level|Preventive Actions):|$)`);
    const match = text.match(regex);

    if (!match || !match[1].trim()) {
      throw new AIResponseError(`Malformed AI response: "${section}" section is missing or empty`);
    }
  }

  const validRiskLevels = ["Low", "Moderate", "High"];
  const riskMatch = text.match(/Risk Level:\s*(\w+)/);
  if (!riskMatch || !validRiskLevels.includes(riskMatch[1])) {
    throw new AIResponseError("Invalid Risk Level value: expected Low, Moderate, or High");
  }
}

export async function generateHealthRecommendations(healthData, timeoutMs = 15000) {
  validateHealthData(healthData);

  const computedBMI = computeBMI(healthData.weight, healthData.height);
  const suppliedBMI = parseFloat(healthData.bmi);
  if (Math.abs(computedBMI - suppliedBMI) > 1) {
    console.warn(`BMI mismatch: supplied ${suppliedBMI}, computed ${computedBMI}. Using computed value.`);
  }
  const bmi = computedBMI;

  const systemPrompt = `
You are PulseGuard, an AI preventive health assistant.
Your job is to analyze user health data and provide:
- Preventive health insights
- Personalized recommendations
- Lifestyle improvements
- Risk warnings (if needed)
Rules:
- Be concise
- Be practical
- Be supportive and encouraging
- Do NOT diagnose diseases
- Focus on prevention
You MUST respond in exactly this format with no deviations:
Summary:
[2-3 sentences]
Recommendations:
- [recommendation]
- [recommendation]
- [recommendation]
Risk Level:
[Low / Moderate / High]
Preventive Actions:
- [action]
- [action]
- [action]
`.trim();

  const userPrompt = `
User Health Data:
Age: ${healthData.age}
Weight: ${healthData.weight} kg
Height: ${healthData.height} cm
BMI: ${bmi}
Hydration Level: ${healthData.hydrationLevel}
Posture Score: ${healthData.postureScore}/100
Activity Level: ${healthData.activityLevel}
Health Risk Score: ${healthData.healthRiskScore}/100
Provide preventive health recommendations.
`.trim();

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt,
    });

    const result = await withRetry(
      () => model.generateContent({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 600,
        },
      }),
      3,
      500,
      controller.signal
    );

    const text = result.response.text().trim();

    if (!text) {
      throw new AIResponseError("Empty response received from Gemini");
    }

    validateAIResponse(text);

    return text;

  } catch (error) {
    if (
      error.name === "AbortError" ||
      error.message === "Aborted during retry backoff"
    ) {
      throw new Error(`Gemini request timed out after ${timeoutMs}ms`);
    }

    if (error instanceof HealthValidationError || error instanceof AIResponseError) {
      throw error;
    }

    const message = error?.message ?? "Unknown error";
    const status = error?.status ? ` (HTTP ${error.status})` : "";
    throw new Error(`Failed to generate health recommendations${status}: ${message}`);

  } finally {
    clearTimeout(timeoutHandle);
  }
}