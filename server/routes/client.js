const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const User = require("../models/User")
const { isClient } = require("../middleware/auth")
const { uploadImage, deleteImage } = require("../utils/cloudinary")

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

// @desc    Get client profile
// @route   GET /api/client/profile
// @access  Private (Client only)
router.get("/profile", isClient, async (req, res) => {
  try {
    const client = await User.findById(req.user.id).select("-password")

    if (!client) {
      return res.status(404).json({ message: "Client not found" })
    }

    res.json(client)
  } catch (error) {
    console.error("Get client profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @desc    Update client profile
// @route   PUT /api/client/profile
// @access  Private (Client only)
router.put("/profile", isClient, async (req, res) => {
  try {
    const { name, email, phone, location, about } = req.body

    const client = await User.findById(req.user.id)

    if (!client) {
      return res.status(404).json({ message: "Client not found" })
    }

    // Update only client-specific fields
    if (name) client.name = name
    if (email) client.email = email
    if (phone) client.phone = phone
    if (location) client.location = location
    if (about) client.about = about

    await client.save()

    res.json(client)
  } catch (error) {
    console.error("Update client profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @desc    Upload client profile image
// @route   POST /api/client/profile-image
// @access  Private (Client only)
router.post(
  "/profile-image",
  isClient,
  upload.single("image"),
  async (req, res) => {
    try {
      const client = await User.findById(req.user.id)

      if (!client) {
        return res.status(404).json({ message: "Client not found" })
      }

      // Upload to Cloudinary
      const result = await uploadImage(req.file.path, "profile_images")

      // Delete old image from Cloudinary if exists
      if (client.profileImagePublicId) {
        await deleteImage(client.profileImagePublicId)
      }

      client.profileImage = result.secure_url
      client.profileImagePublicId = result.public_id

      await client.save()

      res.json({ profileImage: client.profileImage })
    } catch (error) {
      console.error("Client profile image upload error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }
)

module.exports = router
