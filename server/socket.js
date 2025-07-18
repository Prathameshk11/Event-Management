const socketIo = require("socket.io")
const { verifyToken } = require("./utils/jwt")

module.exports = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  })

  // Socket.io middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) {
      return next(new Error("Authentication error"))
    }

    try {
      const user = verifyToken(token)
      socket.user = user
      next()
    } catch (error) {
      next(new Error("Authentication error"))
    }
  })

  // Socket.io connection
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.id}`)

    // Join a room based on user ID
    socket.join(socket.user.id)

    // Handle vendor updates
    socket.on("vendor:update", async (vendorData) => {
      try {
        console.log("Vendor update received:", vendorData._id)
        // Broadcast vendor update to all clients
        io.emit("vendor:updated", vendorData)
      } catch (error) {
        console.error("Vendor update error:", error)
      }
    })

    // Handle vendor creation
    socket.on("vendor:create", async (vendorData) => {
      try {
        console.log("Vendor creation received:", vendorData._id)
        io.emit("vendor:created", vendorData)
      } catch (error) {
        console.error("Vendor creation error:", error)
      }
    })

    // Handle vendor deletion
    socket.on("vendor:delete", async (vendorId) => {
      try {
        console.log("Vendor deletion received:", vendorId)
        io.emit("vendor:deleted", vendorId)
      } catch (error) {
        console.error("Vendor deletion error:", error)
      }
    })

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.id}`)
    })
  })

  return io
} 