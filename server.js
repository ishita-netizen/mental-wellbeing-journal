require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const journalRoutes = require("./routes/journalRoutes");

const app = express();

app.use(cors({
  origin: [
    "https://mental-wellbeing-full.vercel.app",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend is LIVE 🚀" });
});

app.use("/api", journalRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Atlas connected ");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  })
  .catch(err => {
    console.error("DB Connection Error:", err);
    process.exit(1);
  });

app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    success: false,
    error: "Internal Server Error"
  });
});
