// test.js
import "dotenv/config";
import { generateHealthRecommendations } from "./services/openaiService.js";

const mockHealthData = {
  age: 28,
  weight: 75,
  height: 175,
  bmi: 24.5,
  hydrationLevel: "Moderate",
  postureScore: 65,
  activityLevel: "Sedentary",
  healthRiskScore: 42,
};

// Test 1: Valid data — should succeed
console.log("--- Test 1: Valid input ---");
try {
  const result = await generateHealthRecommendations(mockHealthData);
  console.log("✅ Success:\n", result);
} catch (e) {
  console.error("❌ Failed:", e.message);
}

// Test 2: Missing fields — should throw HealthValidationError
console.log("\n--- Test 2: Missing fields ---");
try {
  await generateHealthRecommendations({ age: 28 });
} catch (e) {
  console.log("✅ Caught expected error:", e.name, "-", e.message);
}

// Test 3: Invalid age — should throw HealthValidationError
console.log("\n--- Test 3: Invalid age ---");
try {
  await generateHealthRecommendations({ ...mockHealthData, age: -5 });
} catch (e) {
  console.log("✅ Caught expected error:", e.name, "-", e.message);
}

// Test 4: BMI mismatch — should warn but still succeed
console.log("\n--- Test 4: BMI mismatch ---");
try {
  const result = await generateHealthRecommendations({ ...mockHealthData, bmi: 30 });
  console.log("✅ Success with BMI warning:\n", result);
} catch (e) {
  console.error("❌ Failed:", e.message);
}

// Test 5: Timeout — should throw timeout error
console.log("\n--- Test 5: Timeout (1ms) ---");
try {
  await generateHealthRecommendations(mockHealthData, 1);
} catch (e) {
  console.log("✅ Caught expected error:", e.message);
}