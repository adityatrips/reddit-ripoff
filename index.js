const express = require("express");
const dotenv = require("dotenv");
const consola = require("consola");

const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json());

// Define Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/posts", require("./routes/posts"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => consola.success(`Server started on port ${PORT}`));
