
export function calculateBMI(weight, height) {
  if (!weight || !height) {
    throw new Error("Weight and height are required");
  }
  if (weight <= 0 || height <= 0) {
    throw new Error("Weight and height must be positive values");
  }
  const heightInMeters = height / 100;
  return +(weight / (heightInMeters * heightInMeters)).toFixed(1);
}

// ✅ Risk score now returns a number (0-100) not just a string
// so it maps directly to what openaiService expects
export function calculateHealthRiskScore(bmi, age, activityLevel) {
  let score = 0;

  // BMI contribution (0-50 points)
  if (bmi >= 35) score += 50;
  else if (bmi >= 30) score += 40;
  else if (bmi >= 25) score += 25;
  else if (bmi >= 18.5) score += 10;
  else score += 30; // underweight also carries risk

  // Age contribution (0-30 points)
  if (age >= 60) score += 30;
  else if (age >= 45) score += 20;
  else if (age >= 30) score += 10;

  // Activity level contribution (0-20 points)
  const activityPenalty = {
    "Sedentary": 20,
    "Lightly Active": 10,
    "Moderately Active": 5,
    "Very Active": 0,
  };
  score += activityPenalty[activityLevel] ?? 10;

  return Math.min(score, 100); // cap at 100
}

// ✅ Hydration — returns level string that maps to healthData.json
export function calculateHydration(weight) {
  if (!weight) {
    throw new Error("Weight is required");
  }
  if (weight <= 0) {
    throw new Error("Weight must be a positive value");
  }

  const dailyMl = weight * 35;

  // Map to hydration level string used in openaiService
  let hydrationLevel;
  if (dailyMl < 2000) hydrationLevel = "Low";
  else if (dailyMl < 2800) hydrationLevel = "Moderate";
  else hydrationLevel = "High";

  return {
    dailyWaterIntakeMl: dailyMl,
    dailyWaterIntakeLiters: +(dailyMl / 1000).toFixed(1),
    hydrationLevel, // ← this is what openaiService expects
  };
}