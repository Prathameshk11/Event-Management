const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const User = require("../models/User")
const { authenticateToken } = require("../middleware/auth")
const { uploadImage } = require("../utils/cloudinary")

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/"
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error("Only image files are allowed!"))
  },
})

// Upload profile image
router.post("/profile-image", authenticateToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" })
    }

    // Upload to Cloudinary
    const result = await uploadImage(req.file.path)

    // Update user profile image
    const user = await User.findById(req.user.id)
    user.profileImage = result.secure_url
    await user.save()

    // Delete local file
    fs.unlinkSync(req.file.path)

    res.json({ profileImage: result.secure_url })
  } catch (error) {
    console.error("Upload profile image error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
