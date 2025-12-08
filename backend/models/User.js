const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  favorites: [
  {
    city: { type: String },
    country: { type: String },
    weatherData: { type: Object }
  }
],
});

module.exports = mongoose.model("User", userSchema);

