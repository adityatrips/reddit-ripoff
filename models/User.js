const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  dateOfBirth: {
    type: Date,
    default: null,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    default: null,
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ["user", "moderator"],
    default: "user",
  },
});

module.exports = mongoose.model("User", UserSchema);
