const express = require("express")
const router = express.Router()
const Booking = require("../models/Booking")
const Event = require("../models/Event")
const User = require("../models/User")
const { isClient } = require("../middleware/auth")

// Get all bookings for the current client
router.get("/", isClient, async (req, res) => {
  try {
    const bookings = await Booking.find({ client: req.user.id })
      .sort({ createdAt: -1 })
      .populate("vendor", "name category profileImage")
      .populate("event", "name eventType")

    res.json(bookings)
  } catch (error) {
    console.error("Get bookings error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get a specific booking
router.get("/:id", isClient, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, client: req.user.id })
      .populate("vendor", "name category profileImage location description")
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

// Create a new booking
router.post("/", isClient, async (req, res) => {
  try {
    const { vendorId, eventId, date, notes } = req.body
    
    console.log("Booking request received:", { vendorId, eventId, date, notes, clientId: req.user.id })

    // Verify event belongs to client
    const event = await Event.findOne({ _id: eventId, client: req.user.id })

    if (!event) {
      console.log("Event not found:", eventId)
      return res.status(404).json({ message: "Event not found" })
    }

    // Verify vendor exists
    const vendor = await User.findOne({ _id: vendorId, role: "vendor" })

    if (!vendor) {
      console.log("Vendor not found:", vendorId)
      return res.status(404).json({ message: "Vendor not found" })
    }

    // Create booking
    const booking = new Booking({
      client: req.user.id,
      vendor: vendorId,
      event: eventId,
      date,
      notes,
      status: "pending" // Ensure status is set
    })

    await booking.save()
    console.log("Booking created:", booking._id)

    // Add vendor to event if not already added
    if (!event.vendors.includes(vendorId)) {
      event.vendors.push(vendorId)
      await event.save()
      console.log("Vendor added to event:", vendorId, eventId)
    }

    // Emit socket event for real-time notification
    const io = req.app.get("io")
    if (io) {
      io.to(vendorId).emit("newBooking", booking)
      console.log("Socket event emitted for new booking")
    } else {
      console.warn("Socket.io instance not available for booking notification")
    }

    res.status(201).json(booking)
  } catch (error) {
    console.error("Create booking error:", error)
    res.status(500).json({ message: "Server error", details: error.message })
  }
})

// Cancel a booking
router.delete("/:id", isClient, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, client: req.user.id })

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    if (booking.status === "confirmed") {
      return res.status(400).json({ message: "Cannot cancel a confirmed booking. Please contact the vendor directly." })
    }

    await booking.remove()

    // Notify vendor
    req.app
      .get("io")
      .to(booking.vendor.toString())
      .emit("bookingUpdated", {
        ...booking.toObject(),
        status: "cancelled",
      })

    res.json({ message: "Booking cancelled successfully" })
  } catch (error) {
    console.error("Cancel booking error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
