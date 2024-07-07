const mongoose = require("mongoose");
const dotenv = require("dotenv");
const consola = require("consola");

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    consola.success("MongoDB connected...");
  } catch (err) {
    consola.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
