import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//health rules
const healthDataPath = resolve(__dirname, "../healthData.json");
const healthRules = JSON.parse(readFileSync(healthDataPath, "utf-8"));

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

//input validation
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

//BMI Computation
function computeBMI(weightKg, heightCm) {
  const heightM = heightCm / 100;
  return +(weightKg / (heightM * heightM)).toFixed(1);
}

function getAgeGroup(age) {
  if (age <= 29) return "young";
  if (age <= 44) return "adult";
  if (age <= 59) return "midlife";
  return "senior";
}

function getBMICategory(bmi) {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

function determineRiskLevel(bmi, healthRiskScore) {
  if (bmi >= 30 || healthRiskScore >= 70) return "High";
  if (bmi >= 25 || healthRiskScore >= 40) return "Moderate";
  return "Low";
}

function determinePostureCategory(score) {
  if (score < 40) return "poor";
  if (score < 70) return "average";
  return "good";
}

//function for building the recommendations
function buildRecommendations(healthData) {
  const bmi = computeBMI(healthData.weight, healthData.height);
  const riskLevel = determineRiskLevel(bmi, healthData.healthRiskScore);
  const ageGroup = getAgeGroup(healthData.age);
  const bmiCategory = getBMICategory(bmi);
  const postureCategory = determinePostureCategory(healthData.postureScore);

  const bmiProfile = healthRules.bmiCategories[bmiCategory];
  const ageProfile = healthRules.ageGroups[ageGroup];
  const riskProfile = healthRules.riskLevels[riskLevel];
  const postureProfile = healthRules.postureAdvice[postureCategory];
  const hydrationProfile = healthRules.hydrationAdvice[healthData.hydrationLevel]
    ?? healthRules.hydrationAdvice["Moderate"];
  const activityProfile = healthRules.activityAdvice[healthData.activityLevel]
    ?? healthRules.activityAdvice["Sedentary"];

  // Combined risk flags
  const flags = [];
  const cf = healthRules.combinedRiskFlags;
  if (riskLevel === "High" && healthData.activityLevel === "Sedentary") flags.push(cf.sedentaryHighRisk);
  if (riskLevel === "High" && ageGroup === "young") flags.push(cf.youngHighRisk);
  if (riskLevel !== "Low" && ageGroup === "senior") flags.push(cf.seniorModerateRisk);
  if (healthData.hydrationLevel === "Low" && riskLevel === "High") flags.push(cf.lowHydrationHighRisk);
  if (postureCategory === "poor" && riskLevel === "High") flags.push(cf.poorPostureHighRisk);

  const recommendations = [
    ...bmiProfile.recommendations,
    ...postureProfile.tips.slice(0, 2),
    hydrationProfile.tips[0],
  ];

  const preventiveActions = [
    ...bmiProfile.preventiveActions,
    ...activityProfile.tips.slice(0, 2),
  ];

  const flagSection = flags.length > 0
    ? `\nImportant Flags:\n${flags.map(f => `- ${f}`).join("\n")}`
    : "";

  return `Summary:
${ageProfile.context} ${bmiProfile.summary} ${riskProfile.description}

Recommendations:
${recommendations.map(r => `- ${r}`).join("\n")}

Risk Level:
${riskLevel} — ${riskProfile.urgency}

Preventive Actions:
${preventiveActions.map(a => `- ${a}`).join("\n")}
${flagSection}`.trim();
}

//main exported function
export async function generateHealthRecommendations(healthData, timeoutMs = 15000) {
  validateHealthData(healthData);

  const computedBMI = computeBMI(healthData.weight, healthData.height);
  const suppliedBMI = parseFloat(healthData.bmi);
  if (Math.abs(computedBMI - suppliedBMI) > 1) {
    console.warn(`BMI mismatch: supplied ${suppliedBMI}, computed ${computedBMI}. Using computed value.`);
  }

  try {
    const result = buildRecommendations(healthData);

    if (!result) {
      throw new AIResponseError("Failed to build recommendations from health data");
    }

    return result;

  } catch (error) {
    if (error instanceof HealthValidationError || error instanceof AIResponseError) {
      throw error;
    }
    throw new Error(`Failed to generate health recommendations: ${error.message}`);
  }
}