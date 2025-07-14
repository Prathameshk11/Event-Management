const express = require("express")
const router = express.Router()
const User = require("../models/User")
const Portfolio = require("../models/Portfolio")
const Availability = require("../models/Availability")
const { authenticateToken } = require("../middleware/auth")

// Get all vendors (public route)
router.get("/", async (req, res) => {
  try {
    const vendors = await User.find({ role: "vendor" }).select(
      "name category description location profileImage rating reviewCount priceRange",
    )

    res.json(vendors)
  } catch (error) {
    console.error("Get vendors error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get a specific vendor (public route)
router.get("/:id", async (req, res) => {
  try {
    const vendor = await User.findOne({ _id: req.params.id, role: "vendor" }).select("-password")

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" })
    }

    res.json(vendor)
  } catch (error) {
    console.error("Get vendor error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get vendor portfolio (public route)
router.get("/:id/portfolio", async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ vendor: req.params.id }).sort({ createdAt: -1 })

    res.json(portfolio)
  } catch (error) {
    console.error("Get vendor portfolio error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get vendor availability (public route)
router.get("/:id/availability", async (req, res) => {
  try {
    const availability = await Availability.find({ vendor: req.params.id }).sort({ date: 1 })

    res.json(availability)
  } catch (error) {
    console.error("Get vendor availability error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Search vendors (public route)
router.get("/search", async (req, res) => {
  try {
    const { category, location, query } = req.query

    const searchQuery = { role: "vendor" }

    if (category) {
      searchQuery.category = category
    }

    if (location) {
      searchQuery.location = location
    }

    if (query) {
      searchQuery.$or = [{ name: { $regex: query, $options: "i" } }, { description: { $regex: query, $options: "i" } }]
    }

    const vendors = await User.find(searchQuery).select(
      "name category description location profileImage rating reviewCount priceRange",
    )

    res.json(vendors)
  } catch (error) {
    console.error("Search vendors error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Add review to vendor (authenticated route)
router.post("/:id/reviews", authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" })
    }

    const vendor = await User.findOne({ _id: req.params.id, role: "vendor" })

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" })
    }

    // Update vendor rating
    const newReviewCount = vendor.reviewCount + 1
    const newRating = (vendor.rating * vendor.reviewCount + rating) / newReviewCount

    vendor.rating = newRating
    vendor.reviewCount = newReviewCount

    await vendor.save()

    res.json({ message: "Review added successfully" })
  } catch (error) {
    console.error("Add review error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update vendor profile
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const vendor = await User.findOne({ _id: req.params.id, role: "vendor" })

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" })
    }

    // Update vendor fields
    Object.assign(vendor, req.body)
    await vendor.save()

    // Emit socket event for vendor update
    const io = req.app.get("io")
    if (io) {
      console.log("Emitting vendor:updated event for vendor:", vendor._id)
      io.emit("vendor:updated", vendor)
    } else {
      console.warn("Socket.io instance not available for vendor update")
    }

    res.json(vendor)
  } catch (error) {
    console.error("Update vendor error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete vendor
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const vendor = await User.findOne({ _id: req.params.id, role: "vendor" })

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" })
    }

    await vendor.remove()

    // Emit socket event for vendor deletion
    const io = req.app.get("io")
    if (io) {
      console.log("Emitting vendor:deleted event for vendor:", req.params.id)
      io.emit("vendor:deleted", req.params.id)
    } else {
      console.warn("Socket.io instance not available for vendor deletion")
    }

    res.json({ message: "Vendor deleted successfully" })
  } catch (error) {
    console.error("Delete vendor error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
