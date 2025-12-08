const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  cityId: { type: Number, required: true },        
  city:   { type: String, required: true },
  state:  { type: String },                           
  country:{ type: String, required: true },
  coord:  { type: Object },          
  weatherData: { type: Object }
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  favorites: [favoriteSchema],
});

module.exports = mongoose.model("User", userSchema);

