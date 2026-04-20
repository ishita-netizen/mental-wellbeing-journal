const router = require("express").Router();
const axios = require("axios");
const Entry = require("../models/Entry");

/* Helper Logic Functions */

function moodToExpectedRange(mood) {
  if (mood === "Happy") return [0.2, 1];
  if (mood === "Neutral") return [-0.2, 0.2];
  if (mood === "Sad" || mood === "Anxious" || mood === "Stressed")
    return [-1, -0.2];

  return [-1, 1];
}

function detectMismatch(mood, sentimentScore) {
  const [min, max] = moodToExpectedRange(mood);
  return sentimentScore < min || sentimentScore > max;
}

function perceptionType(mood, sentimentScore) {
  if (mood === "Happy" && sentimentScore < 0)
    return "Masking Stress";

  if ((mood === "Sad" || mood === "Anxious") && sentimentScore > 0)
    return "Resilience";

  return "Aligned";
}

router.post("/entry", async (req, res) => {
  try {
    const { text, mood } = req.body;

    if (!text || !mood) {
      return res.status(400).json({ error: "Missing data" });
    }

    const aiResponse = await axios.post(
      "http://localhost:8000/analyze",
      { text }
    );

    const sentimentScore = aiResponse.data.score;
    const severity = aiResponse.data.severity;

    const entry = new Entry({
      text,
      mood,
      sentimentScore,
      severity,
      mismatch: detectMismatch(mood, sentimentScore),
      perceptionType: perceptionType(mood, sentimentScore)
    });

    await entry.save();

    res.json({
      success: true,
      mismatch: entry.mismatch,
      perceptionType: entry.perceptionType
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save entry" });
  }
});

router.get("/analytics", async (req, res) => {
  try {
    const entries = await Entry.find()
      .sort({ createdAt: 1 })
      .limit(30);

    const sentimentTrend = entries.map(e => ({
      date: e.createdAt.toDateString(),
      score: e.sentimentScore
    }));

    const moodCount = {};
    entries.forEach(e => {
      moodCount[e.mood] = (moodCount[e.mood] || 0) + 1;
    });

    res.json({
      sentimentTrend,
      moodCount
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

router.get("/awareness", async (req, res) => {
  try {
    const entries = await Entry.find();

    const total = entries.length;
    const aligned = entries.filter(e => !e.mismatch).length;

    const awarenessScore =
      total === 0 ? 0 : Math.round((aligned / total) * 100);

    res.json({
      awarenessScore,
      totalEntries: total,
      alignedEntries: aligned,
      mismatchedEntries: total - aligned
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to calculate awareness" });
  }
});

router.get("/perception-analysis", async (req, res) => {
  try {
    const entries = await Entry.find();

    const result = {};
    entries.forEach(e => {
      result[e.perceptionType] =
        (result[e.perceptionType] || 0) + 1;
    });

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to analyze perception data" });
  }
});

module.exports = router;
