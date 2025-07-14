const express = require("express")
const router = express.Router()
const Event = require("../models/Event")
const User = require("../models/User")
const { isClient } = require("../middleware/auth")

// Get all events for the current client
router.get("/", isClient, async (req, res) => {
  try {
    const events = await Event.find({ client: req.user.id })
      .sort({ date: 1 })
      .populate("vendors", "name category profileImage")

    res.json(events)
  } catch (error) {
    console.error("Get events error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get a specific event
router.get("/:id", isClient, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, client: req.user.id }).populate(
      "vendors",
      "name category profileImage",
    )

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    res.json(event)
  } catch (error) {
    console.error("Get event error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create a new event
router.post("/", isClient, async (req, res) => {
  try {
    const { name, date, location, description, budget, guestCount, eventType } = req.body

    const event = new Event({
      name,
      date,
      location,
      description,
      budget,
      guestCount,
      eventType,
      client: req.user.id,
    })

    await event.save()
    res.status(201).json(event)
  } catch (error) {
    console.error("Create event error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update an event
router.put("/:id", isClient, async (req, res) => {
  try {
    const { name, date, location, description, budget, guestCount, eventType } = req.body

    const event = await Event.findOne({ _id: req.params.id, client: req.user.id })

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    // Update fields
    event.name = name
    event.date = date
    event.location = location
    event.description = description
    event.budget = budget
    event.guestCount = guestCount
    event.eventType = eventType

    await event.save()
    res.json(event)
  } catch (error) {
    console.error("Update event error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete an event
router.delete("/:id", isClient, async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, client: req.user.id })

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    res.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Delete event error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get vendors for an event
router.get("/:id/vendors", isClient, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, client: req.user.id })

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    const vendors = await User.find({ _id: { $in: event.vendors } }).select("name category profileImage location")

    res.json(vendors)
  } catch (error) {
    console.error("Get event vendors error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Add vendor to event
router.post("/:id/vendors/:vendorId", isClient, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, client: req.user.id })

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    const vendor = await User.findOne({ _id: req.params.vendorId, role: "vendor" })

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" })
    }

    // Check if vendor is already added
    if (event.vendors.includes(vendor._id)) {
      return res.status(400).json({ message: "Vendor already added to this event" })
    }

    event.vendors.push(vendor._id)
    await event.save()

    res.json(event)
  } catch (error) {
    console.error("Add vendor to event error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Remove vendor from event
router.delete("/:id/vendors/:vendorId", isClient, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, client: req.user.id })

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    // Remove vendor from event
    event.vendors = event.vendors.filter((vendor) => vendor.toString() !== req.params.vendorId)

    await event.save()

    res.json(event)
  } catch (error) {
    console.error("Remove vendor from event error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
