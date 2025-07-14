"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { toast } from "react-hot-toast"
import { PlusIcon, TrashIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/outline"
import API from "../../api/axios"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import LoadingSpinner from "../../components/LoadingSpinner"

const EditEvent = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    location: "",
    description: "",
    budget: "",
    guestCount: "",
    eventType: "",
  })

  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        // Fetch event details
        const eventResponse = await API.get(`/api/events/${id}`)
        setEvent(eventResponse.data)

        // Set form data
        const eventData = eventResponse.data
        setFormData({
          name: eventData.name,
          date: eventData.date.split("T")[0], // Format date for input
          location: eventData.location,
          description: eventData.description,
          budget: eventData.budget,
          guestCount: eventData.guestCount,
          eventType: eventData.eventType,
        })

        // Fetch event vendors
        const vendorsResponse = await API.get(`/api/events/${id}/vendors`)
        setVendors(vendorsResponse.data)
      } catch (err) {
        console.error("Error fetching event data:", err)
        setError("Failed to load event information. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchEventData()
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await API.put(`/api/events/${id}`, formData)
      toast.success("Event updated successfully!")
      // Refresh event data
      const eventResponse = await API.get(`/api/events/${id}`)
      setEvent(eventResponse.data)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update event. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEvent = async () => {
    setIsDeleting(true)

    try {
      await API.delete(`/api/events/${id}`)
      toast.success("Event deleted successfully!")
      navigate("/client")
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete event. Please try again.")
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleRemoveVendor = async (vendorId) => {
    try {
      await API.delete(`/api/events/${id}/vendors/${vendorId}`)
      toast.success("Vendor removed from event")
      // Update vendors list
      const vendorsResponse = await API.get(`/api/events/${id}/vendors`)
      setVendors(vendorsResponse.data)
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove vendor. Please try again.")
    }
  }

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link to="/client" className="btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-grow bg-gray-50 py-8">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Edit Event</h1>
            <div className="flex space-x-4">
              <Link to="/client" className="btn-outline">
                Back to Dashboard
              </Link>
              <button
                className="btn-outline text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Event
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Event Details Form */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-bold mb-6">Event Details</h2>

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
                      value={formData.description}
                      onChange={handleChange}
                    ></textarea>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Event Vendors */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Event Vendors</h2>
                  <Link to="/vendors" className="btn-primary flex items-center">
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Add Vendor
                  </Link>
                </div>

                {vendors.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 mb-4">No vendors added to this event yet</p>
                    <Link to="/vendors" className="btn-primary">
                      Browse Vendors
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vendors.map((vendor) => (
                      <div
                        key={vendor._id}
                        className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <img
                            src={vendor.profileImage || "/placeholder.svg?height=60&width=60"}
                            alt={vendor.name}
                            className="h-12 w-12 rounded-full object-cover mr-4"
                          />
                          <div>
                            <h3 className="font-semibold">{vendor.name}</h3>
                            <p className="text-sm text-gray-600">{vendor.category}</p>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Link
                            to={`/vendors/${vendor._id}`}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                            title="View Vendor"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </Link>

                          <button
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                            title="Remove Vendor"
                            onClick={() => handleRemoveVendor(vendor._id)}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              {/* Event Summary */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">Event Summary</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Event Type</h3>
                    <p className="font-medium">{event.eventType || "Not specified"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date</h3>
                    <p className="font-medium">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Location</h3>
                    <p className="font-medium">{event.location}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Budget</h3>
                    <p className="font-medium">${event.budget || "0"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Guest Count</h3>
                    <p className="font-medium">{event.guestCount || "0"} guests</p>
                  </div>
                </div>
              </div>

              {/* Vendor Suggestions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Vendor Suggestions</h2>

                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Based on your event type and preferences, here are some vendor categories you might need:
                  </p>

                  <div className="space-y-2">
                    {["Photographer", "Venue", "Caterer", "Florist"].map((category, index) => (
                      <div key={index} className="flex items-center">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            vendors.some((v) => v.category === category) ? "bg-green-500" : "bg-gray-300"
                          } mr-2`}
                        ></div>
                        <span
                          className={vendors.some((v) => v.category === category) ? "line-through text-gray-400" : ""}
                        >
                          {category}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link to="/vendors" className="btn-outline w-full text-center mt-4">
                    Find Vendors
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Delete Event</h3>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <p className="mb-6">Are you sure you want to delete this event? This action cannot be undone.</p>

            <div className="flex justify-end space-x-4">
              <button className="btn-outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                Cancel
              </button>

              <button
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                onClick={handleDeleteEvent}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default EditEvent
