// server.js
import "dotenv/config";
import express from "express";
import recommendationsRouter from "./routes/recommendations.js";

const app = express();
app.use(express.json({ limit: "10kb" }));
app.use("/api/recommendations", recommendationsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));