const express = require("express")
const router = express.Router()
const Message = require("../models/Message")
const User = require("../models/User")
const { authenticateToken } = require("../middleware/auth")

// Get chat history between vendor and client
router.get("/:userId", authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user.id
    const otherUser = req.params.userId

    // Determine if current user is vendor or client
    const user = await User.findById(currentUser)

    let query
    if (user.role === "vendor") {
      query = {
        vendorId: currentUser,
        clientId: otherUser,
      }
    } else {
      query = {
        vendorId: otherUser,
        clientId: currentUser,
      }
    }

    // Get messages
    const messages = await Message.find(query).sort({ timestamp: 1 })

    // Mark messages as read if current user is the recipient
    if (messages.length > 0) {
      const unreadMessages = messages.filter((msg) => !msg.read && msg.sender !== user.role)

      if (unreadMessages.length > 0) {
        await Message.updateMany({ _id: { $in: unreadMessages.map((msg) => msg._id) } }, { read: true })
      }
    }

    res.json(messages)
  } catch (error) {
    console.error("Get chat history error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Mark messages as read
router.put("/:userId/read", authenticateToken, async (req, res) => {
  try {
    const currentUser = req.user.id
    const otherUser = req.params.userId

    // Determine if current user is vendor or client
    const user = await User.findById(currentUser)

    let query
    if (user.role === "vendor") {
      query = {
        vendorId: currentUser,
        clientId: otherUser,
        sender: "client",
        read: false,
      }
    } else {
      query = {
        vendorId: otherUser,
        clientId: currentUser,
        sender: "vendor",
        read: false,
      }
    }

    // Mark messages as read
    await Message.updateMany(query, { read: true })

    res.json({ message: "Messages marked as read" })
  } catch (error) {
    console.error("Mark messages as read error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
