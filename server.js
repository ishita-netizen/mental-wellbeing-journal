require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const journalRoutes = require("./routes/journalRoutes");

const app = express();

// ✅ FIXED CORS
app.use(cors({
  origin: "https://mental-wellbeing-full.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.send("Backend is LIVE 🚀");
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connected ✅"))
  .catch(err => {
    console.error("DB Error:", err);
    process.exit(1);
  });

// Routes
app.use("/api", journalRoutes);

// Error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: "Something went wrong" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
