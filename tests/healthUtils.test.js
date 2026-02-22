
const { 
    calculateBMI,
    calculateHydration, 
    calculateHealthRiskScore 
} = require("../utils/healthUtils");


describe ("BMI Calculation",() => {

    test("Calculates BMI correctly for valid input",() =>{
        const bmi = calculateBMI(70,175); //call the calculateBMI function with weight 70 kg and height 175 cm
        expect(bmi).toBeCloseTo(22.86,2); //expect the calculated BMI to be approximately 22.86, rounded to 2 decimal places
    });

    test("Throws error for missing weight",() => {
        expect(() => calculateBMI(null,175)).toThrow("Weight and height are required"); //expect the calculateBMI function to throw an error when weight is missing
    });

    test("Throws error for missing height",() => {
        expect(() => calculateBMI(70,null)).toThrow("Weight and height are required"); //expect the calculateBMI function to throw an error when height is missing
    });

    test("Throws error for negative values",() => {
        expect(() => calculateBMI(-70,175)).toThrow("Weight and height must be positive");
    });
});

describe("Hydration Calculation", () =>{
    test("Calculates hydration correctly for valid input",() => {
        const result  = calculateHydration(60); //call the calculateHydration function with weight 70 kg
        expect(result.dailyWaterIntakeMl).toBe(2100); //expect the daily water intake in ml to be 2100 (60kg * 35ml/kg)
        expect(result.dailyWaterIntakeLiters).toBe(2.1); //expect the daily water intake in liters to be 2.1 (2100ml / 1000)
    });

    test("Throws error for missing weight",() =>{
        expect(() => calculateHydration(null)).toThrow("Weight is required");
    });

    test("Throws error for negative values",() => {
        expect(() => calculateHydration(-60)).toThrow("Weight must be positive values");
    });
});

describe("Health Risk Score",() => {
    test("Returns low Risk",() => {
        expect(calculateHealthRiskScore(60,175)).toBe("low");
    });

    test("Returns moderate Risk",() => {
        expect(calculateHealthRiskScore(80,175)).toBe("moderate");
    });

    test("Returns high Risk",() => {
        expect(calculateHealthRiskScore(95,175)).toBe("high");
    });

    test("Throws error for missing weight",() => {
        expect(() => calculateHealthRiskScore(null,175)).toThrow("Weight and height are required");
    });

    test(" Throws error for missing height", () => {
        expect (() => calculateHealthRiskScore(80,null)).toThrow("Weight and height are required");
    });

    test("Throws error for negative values", () => {
        expect(() => calculateHealthRiskScore(-80,175)).toThrow("Weight and height must be positive values");
    });
});