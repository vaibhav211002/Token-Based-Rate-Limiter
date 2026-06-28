const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { createApikey } = require("../controllers/apikeycontroller");

router.post("/", auth, createApikey);

module.exports = router;