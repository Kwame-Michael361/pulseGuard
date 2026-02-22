import { calculateBMI, calculateHealthRiskScore, calculateHydration } from "./healthCalculations.js";

export function buildHealthData({ age, weight, height, postureScore, activityLevel }) {
  const bmi = calculateBMI(weight, height);
  const { hydrationLevel, dailyWaterIntakeLiters } = calculateHydration(weight);
  const healthRiskScore = calculateHealthRiskScore(bmi, age, activityLevel);

  return {
    age,
    weight,
    height,
    bmi,
    hydrationLevel,
    dailyWaterIntakeLiters,
    postureScore,
    activityLevel,
    healthRiskScore,
  };
}