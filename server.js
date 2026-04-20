require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const journalRoutes = require("./routes/journalRoutes");

const app = express();

/* 🔥 CORS FIX (important for Vercel + Postman) */
app.use(cors({
  origin: [
    "https://mental-wellbeing-full.vercel.app",
    "http://localhost:3000" // for local testing
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

/* 🔥 Middleware */
app.use(express.json());

/* 🔥 Health Check Route */
app.get("/", (req, res) => {
  res.json({ message: "Backend is LIVE 🚀" });
});

/* 🔥 Routes */
app.use("/api", journalRoutes);

/* 🔥 MongoDB Connection (better handling) */
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("MongoDB Atlas connected ✅");

  /* 🔥 Start server ONLY after DB connects */
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

})
.catch(err => {
  console.error("❌ DB Connection Error:", err);
  process.exit(1);
});

/* 🔥 Global Error Handler */
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({
    success: false,
    error: "Internal Server Error"
  });
});
