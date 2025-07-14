const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const User = require("../models/User")
const Booking = require("../models/Booking")
const Availability = require("../models/Availability")
const Portfolio = require("../models/Portfolio")
const { isVendor } = require("../middleware/auth")
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

// Get vendor profile
router.get("/profile", isVendor, async (req, res) => {
  try {
    const vendor = await User.findById(req.user.id).select("-password")

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" })
    }

    res.json(vendor)
  } catch (error) {
    console.error("Get vendor profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update vendor profile
router.put("/profile", isVendor, async (req, res) => {
  try {
    const { name, category, description, location, services, priceRange, packages } = req.body

    const vendor = await User.findById(req.user.id)

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" })
    }

    // Update fields
    if (name) vendor.name = name
    if (category) vendor.category = category
    if (description) vendor.description = description
    if (location) vendor.location = location
    if (services) vendor.services = services
    if (priceRange) vendor.priceRange = priceRange
    if (packages) vendor.packages = packages

    await vendor.save()

    res.json(vendor)
  } catch (error) {
    console.error("Update vendor profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get vendor bookings
router.get("/bookings", isVendor, async (req, res) => {
  try {
    const bookings = await Booking.find({ vendor: req.user.id })
      .sort({ createdAt: -1 })
      .populate("client", "name email profileImage")
      .populate("event", "name eventType date location")

    res.json(bookings)
  } catch (error) {
    console.error("Get vendor bookings error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get a specific booking
router.get("/bookings/:id", isVendor, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, vendor: req.user.id })
      .populate("client", "name email profileImage")
      .populate("event", "name eventType date location")

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    res.json(booking)
  } catch (error) {
    console.error("Get booking error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update booking status
router.put("/bookings/:id", isVendor, async (req, res) => {
  try {
    const { status } = req.body

    if (!["confirmed", "declined", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const booking = await Booking.findOne({ _id: req.params.id, vendor: req.user.id })
      .populate("client", "name email profileImage")
      .populate("event", "name eventType date location")

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    booking.status = status
    await booking.save()

    // Notify client of status change using Socket.IO if available
    try {
      const io = req.app.get("io")
      if (io) {
        io.to(booking.client._id.toString()).emit("bookingUpdated", booking)
      }
    } catch (socketError) {
      console.error("Socket notification error:", socketError)
      // Continue with the response even if socket notification fails
    }

    res.json(booking)
  } catch (error) {
    console.error("Update booking status error:", error)
    res.status(500).json({ message: "Server error", details: error.message })
  }
})

// Get vendor availability
router.get("/availability", isVendor, async (req, res) => {
  try {
    const availability = await Availability.find({ vendor: req.user.id }).sort({ date: 1 })

    res.json(availability)
  } catch (error) {
    console.error("Get vendor availability error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Set vendor availability
router.post("/availability", isVendor, async (req, res) => {
  try {
    const { date, available, timeSlots } = req.body

    // Check if availability already exists for this date
    let availability = await Availability.findOne({
      vendor: req.user.id,
      date: new Date(date),
    })

    if (availability) {
      // Update existing availability
      availability.available = available
      availability.timeSlots = timeSlots || []
    } else {
      // Create new availability
      availability = new Availability({
        vendor: req.user.id,
        date: new Date(date),
        available,
        timeSlots: timeSlots || [],
      })
    }

    await availability.save()

    res.json(availability)
  } catch (error) {
    console.error("Set vendor availability error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get vendor portfolio
router.get("/portfolio", isVendor, async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ vendor: req.user.id }).sort({ createdAt: -1 })

    res.json(portfolio)
  } catch (error) {
    console.error("Get vendor portfolio error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Upload portfolio images
router.post("/portfolio", isVendor, upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" })
    }

    const uploadPromises = req.files.map(async (file) => {
      // Upload to Cloudinary
      const result = await uploadImage(file.path)

      // Create portfolio entry
      const portfolioItem = new Portfolio({
        vendor: req.user.id,
        url: result.secure_url,
        publicId: result.public_id,
        caption: file.originalname,
      })

      await portfolioItem.save()

      // Delete local file
      fs.unlinkSync(file.path)

      return portfolioItem
    })

    const portfolioItems = await Promise.all(uploadPromises)

    res.status(201).json(portfolioItems)
  } catch (error) {
    console.error("Upload portfolio images error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete portfolio image
router.delete("/portfolio/:id", isVendor, async (req, res) => {
  try {
    const portfolioItem = await Portfolio.findOne({
      _id: req.params.id,
      vendor: req.user.id,
    })

    if (!portfolioItem) {
      return res.status(404).json({ message: "Portfolio item not found" })
    }

    // Delete from Cloudinary if publicId exists
    if (portfolioItem.publicId) {
      await deleteImage(portfolioItem.publicId)
    }

    // Fixed: Use deleteOne instead of remove (which is deprecated)
    await Portfolio.deleteOne({ _id: portfolioItem._id })

    res.json({ message: "Portfolio item deleted successfully" })
  } catch (error) {
    console.error("Delete portfolio image error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get vendor stats
router.get("/stats", isVendor, async (req, res) => {
  try {
    // Get booking stats
    const bookings = await Booking.find({ vendor: req.user.id })

    const totalBookings = bookings.length
    const pendingBookings = bookings.filter((b) => b.status === "pending").length
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length

    // Calculate total income (from confirmed bookings)
    const vendor = await User.findById(req.user.id)
    const avgBookingValue = vendor.priceRange || 1000 // Default if no price range
    const totalIncome = confirmedBookings * avgBookingValue

    // Get profile views (mock data for demo)
    const profileViews = Math.floor(Math.random() * 100) + 50

    // Get unread messages count
    const Message = require("../models/Message")
    const unreadMessages = await Message.countDocuments({
      vendorId: req.user.id,
      sender: "client",
      read: false,
    })

    res.json({
      totalBookings,
      pendingBookings,
      confirmedBookings,
      totalIncome,
      profileViews,
      unreadMessages,
    })
  } catch (error) {
    console.error("Get vendor stats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
