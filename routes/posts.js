const express = require("express");
const { check, validationResult } = require("express-validator");
const Post = require("../models/Post");
const User = require("../models/User");
const auth = require("../middleware/auth");
const router = express.Router();
const consola = require("consola");

// Add a new post
router.post(
  "/",
  [
    auth,
    [
      check("text", "Text is required")
        .not()
        .isEmpty()
        .optional({ checkFalsy: true }),
      check("image", "Image must be a valid Data URL")
        .optional({ checkFalsy: true })
        .isDataURI(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text, image } = req.body;

    try {
      const post = new Post({
        user: req.user.id,
        text,
        image,
      });

      await post.save();

      res.status(201).json(post);
      consola.success(`Post created by user: ${req.user.id}`);
    } catch (err) {
      consola.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// Edit a post
router.put(
  "/:postId",
  [
    auth,
    [
      check("text", "Text is required")
        .not()
        .isEmpty()
        .optional({ checkFalsy: true }),
      check("image", "Image must be a valid Data URL")
        .optional({ checkFalsy: true })
        .isDataURI(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text, image } = req.body;

    try {
      let post = await Post.findById(req.params.postId);

      if (!post) {
        return res.status(404).json({ msg: "Post not found" });
      }

      // Check user
      if (post.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: "User not authorized" });
      }

      post.text = text || post.text;
      post.image = image || post.image;
      post.updatedAt = Date.now();

      await post.save();

      res.json(post);
      consola.success(`Post edited by user: ${req.user.id}`);
    } catch (err) {
      consola.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// Delete a post (by owner or moderator)
router.delete("/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const user = await User.findById(req.user.id);

    // Check user or moderator
    if (post.user.toString() !== req.user.id && user.role !== "moderator") {
      return res.status(401).json({ msg: "User not authorized" });
    }

    await post.deleteOne();

    res.json({ msg: "Post removed" });
    consola.success(`Post removed by user: ${req.user.id}`);
  } catch (err) {
    consola.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    consola.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get a single post
router.get("/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    consola.error(err.message);
    res.status(500).send("Server error");
  }
});

// Like a post
router.put("/like/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if the post has already been liked
    if (post.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: "Post already liked" });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json(post.likes);
    consola.success(`Post liked by user: ${req.user.id}`);
  } catch (err) {
    consola.error(err.message);
    res.status(500).send("Server error");
  }
});

// Unlike a post
router.put("/unlike/:postId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if the post has not yet been liked
    if (!post.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: "Post has not yet been liked" });
    }

    // Remove the like
    post.likes = post.likes.filter(
      ({ user }) => user.toString() !== req.user.id
    );

    await post.save();

    res.json(post.likes);
    consola.success(`Post unliked by user: ${req.user.id}`);
  } catch (err) {
    consola.error(err.message);
    res.status(500).send("Server error");
  }
});

// Add a comment to a post
router.post(
  "/comment/:postId",
  [auth, [check("text", "Text is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text } = req.body;

    try {
      const post = await Post.findById(req.params.postId);

      if (!post) {
        return res.status(404).json({ msg: "Post not found" });
      }

      const comment = {
        user: req.user.id,
        text,
      };

      post.comments.unshift(comment);

      await post.save();

      res.json(post.comments);
      consola.success(`Comment added by user: ${req.user.id}`);
    } catch (err) {
      consola.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// Delete a comment from a post
router.delete("/comment/:postId/:commentId", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const comment = post.comments.find(
      (comment) => comment.id === req.params.commentId
    );

    if (!comment) {
      return res.status(404).json({ msg: "Comment not found" });
    }

    // Check user or post owner
    if (
      comment.user.toString() !== req.user.id &&
      post.user.toString() !== req.user.id
    ) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    post.comments = post.comments.filter(
      ({ id }) => id !== req.params.commentId
    );

    await post.save();

    res.json(post.comments);
    consola.success(`Comment removed by user: ${req.user.id}`);
  } catch (err) {
    consola.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
