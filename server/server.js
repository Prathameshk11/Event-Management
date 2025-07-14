const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const http = require("http")
const socketIo = require("socket.io")
const dotenv = require("dotenv")
const path = require("path")
const cookieParser = require("cookie-parser")
const morgan = require("morgan")

// Load environment variables
dotenv.config()

// Import routes
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const eventRoutes = require("./routes/events")
const vendorRoutes = require("./routes/vendors")
const bookingRoutes = require("./routes/bookings")
const chatRoutes = require("./routes/chat")
const uploadRoutes = require("./routes/uploads")
const notificationRoutes = require("./routes/notifications")

// Import middleware
const { authenticateToken } = require("./middleware/auth")

// Create Express app
const app = express()
const server = http.createServer(app)

// Set up Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Authorization"],
  },
  transports: ["websocket", "polling"],
})

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookieParser())
app.use(morgan("dev"))

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Socket.io middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  if (!token) {
    console.error("Socket authentication error: No token provided")
    return next(new Error("Authentication error"))
  }

  try {
    const user = require("./utils/jwt").verifyToken(token)
    socket.user = user
    console.log(`Socket authenticated for user: ${user.id}`)
    next()
  } catch (error) {
    console.error("Socket authentication error:", error)
    next(new Error("Authentication error"))
  }
})

// Socket.io connection
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user.id}`)

  // Join a room based on user ID
  socket.join(socket.user.id)
  console.log(`User ${socket.user.id} joined their room`)

  // Handle chat messages
  socket.on("sendMessage", async (message) => {
    try {
      console.log("Received message:", message)
      
      // Validate required fields
      if (!message.vendorId) {
        if (socket.user) {
          message.vendorId = socket.user.id
        } else {
          throw new Error("Vendor ID is required")
        }
      }
      
      if (!message.clientId) {
        throw new Error("Client ID is required")
      }
      
      if (!message.sender) {
        throw new Error("Sender is required")
      }
      
      // Ensure message field is set
      if (!message.message && message.text) {
        message.message = message.text
      } else if (!message.message) {
        throw new Error("Message content is required")
      }
      
      // Save message to database
      const Message = require("./models/Message")
      const newMessage = new Message({
        vendorId: message.vendorId,
        clientId: message.clientId,
        sender: message.sender,
        message: message.message,
        timestamp: message.timestamp || new Date(),
      })

      await newMessage.save()
      console.log("Message saved to database:", newMessage._id)
      
      newMessage.text = newMessage.message
      
      // Emit to both vendor and client
      io.to(message.vendorId).to(message.clientId).emit("message", newMessage)
      console.log("Message emitted to rooms:", message.vendorId, message.clientId)

      // Update active chats for both users
      const User = require("./models/User")
      const [vendor, client] = await Promise.all([
        User.findById(message.vendorId),
        User.findById(message.clientId)
      ])

      if (vendor && client) {
        // Emit chat update to vendor
        io.to(message.vendorId).emit("chatUpdated", {
          userId: message.clientId,
          name: client.name,
          profileImage: client.profileImage,
          lastMessage: message.message,
          lastMessageTime: message.timestamp,
          unreadCount: message.sender === "client" ? 1 : 0
        })

        // Emit chat update to client
        io.to(message.clientId).emit("chatUpdated", {
          userId: message.vendorId,
          name: vendor.name,
          profileImage: vendor.profileImage,
          lastMessage: message.message,
          lastMessageTime: message.timestamp,
          unreadCount: message.sender === "vendor" ? 1 : 0
        })

        const chatId = `${message.vendorId}-${message.clientId}`
        io.emit("chatMessage", {
          chatId: chatId,
          message: newMessage,
          vendor: {
            id: vendor._id,
            name: vendor.name,
            profileImage: vendor.profileImage
          },
          client: {
            id: client._id,
            name: client.name,
            profileImage: client.profileImage
          }
        })
        
        console.log("Chat message broadcasted with ID:", chatId)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      socket.emit("messageError", { error: "Failed to send message" })
    }
  })

  // Handle booking notifications
  socket.on("newBooking", (booking) => {
    io.to(booking.vendorId).emit("newBooking", booking)
  })

  socket.on("bookingUpdated", (booking) => {
    io.to(booking.clientId).emit("bookingUpdated", booking)
  })

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.id}`)
  })
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", authenticateToken, userRoutes)
app.use("/api/events", authenticateToken, eventRoutes)
app.use("/api/vendors", vendorRoutes) 
app.use("/api/bookings", authenticateToken, bookingRoutes)
app.use("/api/chat", authenticateToken, chatRoutes)
app.use("/api/uploads", authenticateToken, uploadRoutes)
app.use("/api/notifications", authenticateToken, notificationRoutes)

// Vendor-specific routes
app.use("/api/vendor", authenticateToken, require("./routes/vendor"))

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: err.message || "Something went wrong!" })
})

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB")

    const PORT = process.env.PORT || 5000
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err)
    process.exit(1)
  })

  
