const express = require("express");
const protect = require("../middlewares/authMiddleware");
const { searchUsers, toggleBlock } = require("../controllers/userController");

const router = express.Router();

router.get("/search", protect, searchUsers);
router.patch("/toggle-block", protect, toggleBlock);
module.exports = router;
