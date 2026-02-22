import "dotenv/config";
import express from "express";
import cors from "cors"; 
import recommendationsRouter from "./routes/recommendations.js";
import postureRouter from "./routes/posture.js";  

const app = express();

app.use(cors({
  origin: ["http://localhost:5174", "http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "10kb" }));
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/posture", postureRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));