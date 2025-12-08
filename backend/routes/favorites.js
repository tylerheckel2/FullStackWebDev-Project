const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { city, country, weatherData } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.favorites.some((f) => f.city === city)) {
      user.favorites.push({ city, country, weatherData });
      await user.save();
    }

    res.json(user.favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.delete("/:city", auth, async (req, res) => {
  try {
    const { city } = req.params;
    const user = await User.findById(req.user.id);

    user.favorites = user.favorites.filter((f) => f.city !== city);
    await user.save();

    res.json(user.favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
