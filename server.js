require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const journalRoutes = require("./routes/journalRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Root route (IMPORTANT)
app.get("/", (req, res) => {
  res.send("Backend is LIVE 🚀");
});

// MongoDB Atlas connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connected ✅"))
  .catch(err => console.error(err));

app.use("/", journalRoutes);

// ✅ FIXED PORT
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
