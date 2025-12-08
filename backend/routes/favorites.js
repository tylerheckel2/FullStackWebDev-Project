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
    const { cityId, city, state, country, coord, weatherData } = req.body;
    
    if (cityId == null) {
      return res.status(400).json({ msg: "cityId is required" });
    }

    const user = await User.findById(req.user.id);

    if (!user.favorites.some(f => f.cityId === Number(cityId))) {
      user.favorites.push({ cityId: Number(cityId), city, state, country, coord, weatherData });
      await user.save();
    }
    res.json(user.favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.delete("/:cityId", auth, async (req, res) => {
  try {
    const cityId = Number(req.params.cityId);
    const user = await User.findById(req.user.id);

    user.favorites = user.favorites.filter(f => f.cityId !== cityId);
    await user.save();

    res.json(user.favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
