//Dependencies
const express = require('express'); //nodejs framework we use to create APIs and servers
const cors = require('cors'); //middleware to allows backend to accept  cross-origin requests

//App & Port Setup
const app = express(); //create an instance of express
const port = 5000; //define the port number for the server

//Middleware Setup -(run before the route handlers)
app.use(cors()); //allos cross origin resources sharing. frontend port 3000 can communicate with backend port 5000
app.use(express.json());//parse incoming JSON request bodies and make them available under req.body. needed when handling POST or PUT requests with JSON payloads with JSON data

//GET Route set up
app.get("/",(req,res) => {
    res.send("Health Api is working");
}); // creates GET route for the root URL ("/"). when a GET request is made to this URL, the server responds with "Health Api is working"

//starting the sever
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); //starts the server and listens for incoming requests on the specified port. when the server is successfully started, it logs a message to the console indicating that it's running and on which port

//Building BMI
const {calculateBMI, calculateHydration} = require("./utils/healthUtils"); //import the calculateBMI function from the healthUtils module
app.post("/calculate-bmi", (req, res) => {
   try{
    const {weight,height} = req.body; //destructure weight and height from the request body
    const bmi = calculateBMI(weight,height); //call the calculateBMI function with the provided weight and height to calculate the BMI
    res.json({bmi: bmi.toFixed(2)}); //send the calculated BMI back to the client as a JSON response, rounding it to 2 decimal places
   }
    catch(error){
        res.status(400).json({error: error.message});
    }

});

//hydration API
app.post("/hydration-risk", (req,res) => {
    try{
          const {weight} = req.body; 

          const result = calculateHydration(weight);

          res.json(result);
        }catch(error){
            res.status(400).json({error: error.message});
        }
});

//health risk score API
const {calculateHealthRiskScore} = require("./utils/healthUtils"); //import the calculateHealthRiskScore function from the healthUtils module
app.post("/health-risk-score", (req,res) =>{
   try{
    const {weight,height} = req.body;
    const risk = calculateHealthRiskScore(weight,height);

    res.json({risk});
   }catch(error){
    res.status(400).json({error: error.message});
   }
   
});