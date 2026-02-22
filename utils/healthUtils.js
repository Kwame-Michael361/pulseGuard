function calculateBMI(weight,height){
    if (!weight || !height) {
        throw new Error("Weight and height are required");
    }
    if (weight <= 0 || height <=0){
        throw new Error("Weight and height must be positive values");
    }
    const heightInMeters = height / 100;
    return weight/(heightInMeters * heightInMeters);
    
}
module.exports = {
    calculateBMI,
    calculateHydration,
    calculateHealthRiskScore,
};

function calculateHealthRiskScore(weight,height){
    if (!weight || !height) {
        throw new Error("Weight and height are required");
    }
    if (weight <= 0 || height <=0){
        throw new Error("Weight and height must be positive values");
    }
    const heightInMeters = height / 100;
    const bmi = weight/(heightInMeters * heightInMeters);
    
    let risk = "low";
    if (bmi >= 30) {
        risk = "high";
    }else if (bmi >= 25) {
        risk = "moderate";
    }
    return risk;
}

function calculateHydration(weight){
    if (!weight){
        throw new Error("Weight is required");
    }
    if (weight <= 0){
        throw new Error("Weight must be positive values");
    }

    const hydration = weight * 35;
    return {
        dailyWaterIntakeMl: hydration,
        dailyWaterIntakeLiters: hydration / 1000, //return 2.1
    };
}


    
