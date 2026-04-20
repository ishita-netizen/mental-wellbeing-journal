const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const journalRoutes = require("./routes/journalRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/wellbeing")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

app.use("/", journalRoutes);

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
