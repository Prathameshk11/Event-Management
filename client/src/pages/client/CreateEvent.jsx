"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import axios from "axios"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"

const CreateEvent = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    location: "",
    description: "",
    budget: "",
    guestCount: "",
    eventType: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const eventTypes = [
    "Wedding",
    "Corporate Event",
    "Birthday Party",
    "Anniversary",
    "Conference",
    "Graduation",
    "Baby Shower",
    "Engagement Party",
    "Reunion",
    "Other",
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await axios.post("/api/events", formData)
      toast.success("Event created successfully!")
      navigate(`/events/${response.data._id}/edit`)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create event. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-grow bg-gray-50 py-8">
        <div className="container-custom max-w-3xl">
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            <h1 className="text-3xl font-bold mb-6">Create New Event</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="label">
                    Event Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="input"
                    placeholder="Enter event name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="eventType" className="label">
                    Event Type
                  </label>
                  <select
                    id="eventType"
                    name="eventType"
                    className="input"
                    value={formData.eventType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select event type</option>
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="date" className="label">
                    Event Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className="input"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="location" className="label">
                    Event Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    className="input"
                    placeholder="Enter event location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="budget" className="label">
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    className="input"
                    placeholder="Enter your budget"
                    value={formData.budget}
                    onChange={handleChange}
                    min="0"
                  />
                </div>

                <div>
                  <label htmlFor="guestCount" className="label">
                    Number of Guests
                  </label>
                  <input
                    type="number"
                    id="guestCount"
                    name="guestCount"
                    className="input"
                    placeholder="Enter expected guest count"
                    value={formData.guestCount}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="label">
                  Event Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  className="input"
                  placeholder="Describe your event and any special requirements"
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-4">
                <button type="button" className="btn-outline" onClick={() => navigate("/client")}>
                  Cancel
                </button>

                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default CreateEvent
