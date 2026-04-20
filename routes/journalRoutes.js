const router = require("express").Router();
const Entry = require("../models/Entry");
const axios = require("axios");

/* 🔥 NLP SERVICE URL (Render) */
const NLP_URL = "https://mental-wellbeing-full-2.onrender.com/analyze";

/* 🧠 HELPER FUNCTIONS */

function normalizeMood(mood) {
  return mood.toLowerCase();
}

function moodToExpectedRange(mood) {
  mood = normalizeMood(mood);

  if (mood === "happy") return [0.1, 1];
  if (mood === "neutral") return [-0.3, 0.3];
  if (["sad", "anxious", "stressed"].includes(mood))
    return [-1, -0.1];

  return [-1, 1];
}

function detectMismatch(mood, sentimentScore) {
  const [min, max] = moodToExpectedRange(mood);
  const tolerance = 0.15;

  return (
    sentimentScore < min - tolerance ||
    sentimentScore > max + tolerance
  );
}

function perceptionType(mood, sentimentScore) {
  mood = normalizeMood(mood);

  if (mood === "happy" && sentimentScore < -0.2)
    return "Masking Stress";

  if (
    ["sad", "anxious", "stressed"].includes(mood) &&
    sentimentScore > 0.2
  )
    return "Resilience";

  return "Aligned";
}

/* 🔥 REAL NLP CALL (REPLACES MOCK AI) */
async function analyzeText(text) {
  try {
    const res = await axios.post(NLP_URL, { text });

    return {
      score: res.data.score,
      severity: res.data.severity
    };

  } catch (err) {
    console.error("NLP ERROR:", err.message);

    // fallback (safe default)
    return {
      score: 0,
      severity: "Unknown"
    };
  }
}

/* 🟢 POST ENTRY */
router.post("/entry", async (req, res) => {
  try {
    let { text, mood } = req.body;

    if (!text || !mood) {
      return res.status(400).json({ error: "Missing data" });
    }

    mood = normalizeMood(mood);

    const aiResult = await analyzeText(text);

    const entry = new Entry({
      text,
      mood,
      sentimentScore: aiResult.score,
      severity: aiResult.severity,
      mismatch: detectMismatch(mood, aiResult.score),
      perceptionType: perceptionType(mood, aiResult.score)
    });

    await entry.save();

    res.json({
      success: true,
      data: entry
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save entry" });
  }
});

/* 🟢 GET ALL ENTRIES */
router.get("/entry", async (req, res) => {
  try {
    const entries = await Entry.find().sort({ createdAt: -1 });
    res.json(entries);
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

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: "Failed to analyze perception data" });
  }
});

module.exports = router;
