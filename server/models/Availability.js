const mongoose = require("mongoose")

const availabilitySchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  available: {
    type: Boolean,
    default: true,
  },
  timeSlots: [
    {
      start: String,
      end: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Compound index to ensure unique date per vendor
availabilitySchema.index({ vendor: 1, date: 1 }, { unique: true })

const Availability = mongoose.model("Availability", availabilitySchema)

module.exports = Availability
