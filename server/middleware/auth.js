const jwt = require("jsonwebtoken")

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ message: "Invalid token." })
  }
}

// Middleware to check if user is a client
const isClient = (req, res, next) => {
  if (req.user.role !== "client") {
    return res.status(403).json({ message: "Access denied. Client role required." })
  }
  next()
}

// Middleware to check if user is a vendor
const isVendor = (req, res, next) => {
  if (req.user.role !== "vendor") {
    return res.status(403).json({ message: "Access denied. Vendor role required." })
  }
  next()
}

module.exports = {
  authenticateToken,
  isClient,
  isVendor,
}
