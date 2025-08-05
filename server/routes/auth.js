const express = require("express")
const router = express.Router()
const User = require("../models/User")
const { generateToken } = require("../utils/jwt")
const { authenticateToken } = require("../middleware/auth")

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, category } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" })
    }

    // Validate vendor category
    if (role === "vendor" && !category) {
      return res.status(400).json({ message: "Category is required for vendors" })
    }

    // Create new vendor
    const user = new User({
      name,
      email,
      password,
      role,
      category,
      location: req.body.location || "New York, NY", 
      description: req.body.description || "",
    })

    await user.save()

    // Generate JWT token
    const token = generateToken(user)

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        category: user.category,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ message: "Server error during registration" })
  }
})

// Login vendor/user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" })
    }

    // Generate JWT token
    const token = generateToken(user)

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        category: user.category,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Server error during login" })
  }
})

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(user)
  } catch (error) {
    console.error("Get current user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
