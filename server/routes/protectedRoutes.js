const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const rateLimiter = require("../middleware/rateLimiter");

router.get("/", auth, rateLimiter, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Request Allowed 🚀",
    tokensLeft: req.tokensLeft,
  });
});

module.exports = router;