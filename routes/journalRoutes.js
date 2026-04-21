const router = require("express").Router();
const Entry = require("../models/Entry");
const axios = require("axios");

/* 🔥 NLP SERVICE URL */
const NLP_URL = "https://mental-wellbeing-full-2.onrender.com/analyze";

/* 🧠 HELPER FUNCTIONS */

function normalizeMood(mood) {
  return mood?.toLowerCase().trim();
}

function moodToExpectedRange(mood) {
  mood = normalizeMood(mood);

  if (mood === "happy") return [0.1, 1];
  if (mood === "neutral") return [-0.3, 0.3];
  if (["sad", "anxious", "stressed"].includes(mood))
    return [-1, -0.1];

  return [-1, 1];
}

function detectMismatch(mood, score) {
  const [min, max] = moodToExpectedRange(mood);
  const tolerance = 0.15;

  return score < (min - tolerance) || score > (max + tolerance);
}

function perceptionType(mood, score) {
  mood = normalizeMood(mood);

  if (mood === "happy" && score < -0.2)
    return "Masking Stress";

  if (
    ["sad", "anxious", "stressed"].includes(mood) &&
    score > 0.2
  )
    return "Resilience";

  return "Aligned";
}

/* 🔥 NLP CALL */
async function analyzeText(text) {
  try {
    const res = await axios.post(NLP_URL, { text }, { timeout: 10000 });

    // 🔥 DEBUG LOG (very important)
    console.log("NLP RESPONSE:", res.data);

    return {
      score: res.data.score,
      severity: res.data.severity,
      predicted_mood: res.data.predicted_mood // ✅ MUST exist from Flask
    };

  } catch (err) {
    console.error("❌ NLP ERROR:", err.message);

    return {
      score: 0,
      severity: "Unknown",
      predicted_mood: "Neutral"
    };
  }
}

/* 🟢 POST ENTRY */
router.post("/entry", async (req, res) => {
  try {
    let { text, mood } = req.body;

    if (!text || !mood) {
      return res.status(400).json({ error: "Text and mood are required" });
    }

    mood = normalizeMood(mood);

    const aiResult = await analyzeText(text);

    const entry = new Entry({
      text,
      mood,
      sentimentScore: aiResult.score,
      severity: aiResult.severity,
      predictedMood: aiResult.predicted_mood, // ✅ FINAL FIX
      mismatch: detectMismatch(mood, aiResult.score),
      perceptionType: perceptionType(mood, aiResult.score)
    });

    await entry.save();

    res.status(201).json({
      success: true,
      message: "Entry saved successfully",
      data: entry
    });

  } catch (err) {
    console.error("❌ ENTRY ERROR:", err);
    res.status(500).json({ error: "Failed to save entry" });
  }
});

/* 🟢 GET ALL ENTRIES */
router.get("/entry", async (req, res) => {
  try {
    const entries = await Entry.find().sort({ createdAt: -1 });
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* 🟢 ANALYTICS */
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
      success: true,
      sentimentTrend,
      moodCount
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

/* 🟢 AWARENESS */
router.get("/awareness", async (req, res) => {
  try {
    const entries = await Entry.find();

    const total = entries.length;
    const aligned = entries.filter(e => !e.mismatch).length;

    const awarenessScore =
      total === 0 ? 0 : Math.round((aligned / total) * 100);

    res.json({
      success: true,
      awarenessScore,
      totalEntries: total,
      alignedEntries: aligned,
      mismatchedEntries: total - aligned
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to calculate awareness" });
  }
});

/* 🟢 PERCEPTION ANALYSIS */
router.get("/perception-analysis", async (req, res) => {
  try {
    const entries = await Entry.find();

    const result = {};
    entries.forEach(e => {
      result[e.perceptionType] =
        (result[e.perceptionType] || 0) + 1;
    });

    res.json({
      success: true,
      data: result
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to analyze perception data" });
  }
});

module.exports = router;
