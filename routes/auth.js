const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const router = express.Router();
const consola = require("consola");
const {
  uniqueNamesGenerator,
  adjectives,
  animals,
} = require("unique-names-generator");
const dotenv = require("dotenv");
const auth = require("../middleware/auth");

dotenv.config();

// Register User
router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
    check("gender", "Gender must be Male, Female, or Other")
      .optional()
      .isIn(["Male", "Female", "Other"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, dateOfBirth, gender } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      }

      const username = uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        separator: ".",
        style: "lowerCase",
      });

      user = new User({
        name,
        email,
        password,
        dateOfBirth,
        gender,
        username,
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );

      consola.success(
        `User registered: ${user.email}, username: ${user.username}`
      );
    } catch (err) {
      consola.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// Login User
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );

      consola.success(`User logged in: ${user.email}`);
    } catch (err) {
      consola.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// Logout User
router.post("/logout", auth, (req, res) => {
  // On the client side, simply delete the JWT token
  res.json({ msg: "Logged out successfully" });
  consola.success(`User logged out: ${req.user.id}`);
});

module.exports = router;
