const mongoose = require("mongoose")

const portfolioSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
  },
  caption: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const Portfolio = mongoose.model("Portfolio", portfolioSchema)

module.exports = Portfolio
