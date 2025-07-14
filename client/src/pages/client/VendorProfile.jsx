"use client"

import { CalendarIcon, ChatBubbleLeftIcon, MapPinIcon, StarIcon } from "@heroicons/react/24/outline"
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid"
import API from "../../api/axios"
import { useEffect, useRef, useState } from "react"
import { toast } from "react-hot-toast"
import { Link, useParams } from "react-router-dom"
import Footer from "../../components/Footer"
import LoadingSpinner from "../../components/LoadingSpinner"
import Navbar from "../../components/Navbar"
import { useAuth } from "../../context/AuthContext"
import { useSocket } from "../../context/SocketContext"

const VendorProfile = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const { socket } = useSocket()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [bookingNote, setBookingNote] = useState("")
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Chat state
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef(null)

  // Gallery state
  const [activeImage, setActiveImage] = useState(0)

  // Availability calendar
  const [availability, setAvailability] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${vendor._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setMessages(data)
      scrollToBottom()
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        // Fetch vendor details
        const vendorResponse = await API.get(`/api/vendors/${id}`)
        setVendor(vendorResponse.data)
        console.log('Portfolio:', vendorResponse.data?.portfolio || 'No portfolio available');
        console.log("Vendor data:", vendorResponse.data)

        // Fetch client's events for booking form
        const eventsResponse = await API.get("/api/events")
        setEvents(eventsResponse.data)

        // Fetch vendor's availability
        const availabilityResponse = await API.get(`/api/vendors/${id}/availability`)
        setAvailability(availabilityResponse.data)

        // Fetch chat history if any
        if (socket) {
          const chatResponse = await API.get(`/api/chat/${id}`)
          setMessages(chatResponse.data)
        }
      } catch (err) {
        console.error("Error fetching vendor data:", err)
        setError("Failed to load vendor information. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchVendorData()
  }, [id])

  useEffect(() => {
    if (showChat) {
      // Fetch chat history
      fetchMessages()

      // Listen for new messages
      socket.on("message", handleNewMessage)
      socket.on("chatMessage", handleChatMessage)

      return () => {
        socket.off("message")
        socket.off("chatMessage")
      }
    }
  }, [showChat])

  const handleNewMessage = (message) => {
    console.log("Received message:", message)
    // Only add message if it's for this chat and doesn't already exist
    if (
      ((user.role === "vendor" && message.clientId === vendor._id) ||
       (user.role === "client" && message.vendorId === vendor._id)) &&
      !messages.some(m => m._id === message._id)
    ) {
      setMessages(prev => [...prev, message])
      scrollToBottom()
    }
  }

  const handleChatMessage = (data) => {
    console.log("Received chat message:", data)
    // Only add message if it's for this chat and doesn't already exist
    if (
      data.chatId === `${user.role === "vendor" ? user._id : vendor._id}-${user.role === "vendor" ? vendor._id : user._id}` &&
      !messages.some(m => m._id === data.message._id)
    ) {
      setMessages(prev => [...prev, data.message])
      scrollToBottom()
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    const messageData = {
      vendorId: user.role === "vendor" ? user._id : vendor._id,
      clientId: user.role === "client" ? user._id : vendor._id,
      sender: user.role,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    }

    // Add message to local state immediately
    const tempMessage = {
      ...messageData,
      _id: Date.now().toString(), // Temporary ID
      text: newMessage.trim(), // Add text field for backward compatibility
      createdAt: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMessage])
    setNewMessage("")
    scrollToBottom()

    // Send message through socket
    socket.emit("sendMessage", messageData)
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()

    if (!selectedEvent || !selectedDate) {
      toast.error("Please select an event and date")
      return
    }

    setIsSubmitting(true)

    try {
      await API.post("/api/bookings", {
        vendorId: id,
        eventId: selectedEvent,
        date: selectedDate,
        notes: bookingNote,
      })

      toast.success("Booking request sent successfully!")
      setShowBookingForm(false)
      setSelectedEvent("")
      setSelectedDate("")
      setBookingNote("")
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit booking request")
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const renderCalendar = () => {
    const month = currentMonth.getMonth()
    const year = currentMonth.getFullYear()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateString = date.toISOString().split("T")[0]
      const isAvailable = availability.some((a) => a.date.split("T")[0] === dateString && a.available)
      const isBooked = availability.some((a) => a.date.split("T")[0] === dateString && !a.available)

      days.push(
        <div
          key={day}
          className={`h-10 w-10 rounded-full flex items-center justify-center text-sm cursor-pointer ${
            isAvailable
              ? "bg-green-100 text-green-800 hover:bg-green-200"
              : isBooked
                ? "bg-red-100 text-red-800"
                : "hover:bg-gray-100"
          }`}
          onClick={() => isAvailable && setSelectedDate(dateString)}
        >
          {day}
        </div>,
      )
    }

    return days
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
            <Link to="/vendors" className="btn-primary">
              Back to Vendors
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
          {/* Vendor Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/4">
                <img
                  src={vendor.profileImage || "/placeholder.svg?height=300&width=300"}
                  alt={vendor.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>

              <div className="md:w-3/4">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{vendor.name}</h1>
                    <p className="text-gray-600 mb-2">{vendor.category}</p>
                  </div>

                  <div className="flex items-center space-x-4 mt-4 md:mt-0">
                    <button className="btn-outline flex items-center" onClick={() => setShowChat(!showChat)}>
                      <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
                      Chat
                    </button>

                    <button
                      className="btn-primary flex items-center"
                      onClick={() => setShowBookingForm(!showBookingForm)}
                    >
                      <CalendarIcon className="h-5 w-5 mr-2" />
                      Book Now
                    </button>
                  </div>
                </div>

                <div className="flex items-center mb-4">
                  <div className="flex items-center mr-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star}>
                        {star <= Math.floor(vendor.rating || 4.5) ? (
                          <StarIconSolid className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <StarIcon className="h-5 w-5 text-yellow-500" />
                        )}
                      </span>
                    ))}
                    <span className="ml-2 text-gray-600">
                      {vendor.rating || "4.5"} ({vendor.reviewCount || "12"} reviews)
                    </span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="h-5 w-5 mr-1" />
                    <span>{vendor.location}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">About</h3>
                  <p className="text-gray-700">{vendor.description || "No description provided."}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Services</h3>
                  <div className="flex flex-wrap gap-2">
                    {(vendor.services || ["Photography", "Editing", "Prints", "Albums"]).map((service, index) => (
                      <span key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Portfolio Gallery */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-2xl font-bold mb-6">Portfolio</h2>

                <div className="mb-4">
                  <div className="relative h-96 rounded-lg overflow-hidden">
                    <img
                      src={
                        (vendor.portfolio && vendor.portfolio[activeImage]) || "/images/hotel-venue.jpg"
                      }
                      alt="Portfolio"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {(vendor.portfolio || Array(5).fill("/placeholder.svg?height=100&width=100")).map((image, index) => (
                    <div
                      key={index}
                      className={`h-20 rounded-md overflow-hidden cursor-pointer ${
                        activeImage === index ? "ring-2 ring-indigo-600" : ""
                      }`}
                      onClick={() => setActiveImage(index)}
                    >
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`Portfolio ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-2xl font-bold mb-6">Reviews</h2>

                {(vendor.reviews || []).length === 0 ? (
                  <p className="text-gray-600">No reviews yet.</p>
                ) : (
                  <div className="space-y-6">
                    {(
                      vendor.reviews || [
                        {
                          name: "John Doe",
                          rating: 5,
                          date: "2023-05-15",
                          comment: "Amazing service! Very professional and the photos turned out beautifully.",
                        },
                        {
                          name: "Jane Smith",
                          rating: 4,
                          date: "2023-04-22",
                          comment: "Great experience working with them. Would recommend for any event.",
                        },
                      ]
                    ).map((review, index) => (
                      <div key={index} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                        <div className="flex justify-between mb-2">
                          <h3 className="font-semibold">{review.name}</h3>
                          <span className="text-sm text-gray-500">
                            {new Date(review.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star}>
                              {star <= review.rating ? (
                                <StarIconSolid className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <StarIcon className="h-4 w-4 text-yellow-500" />
                              )}
                            </span>
                          ))}
                        </div>

                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              {/* Booking Form */}
              {showBookingForm && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                  <h2 className="text-xl font-bold mb-4">Book {vendor.name}</h2>

                  <form onSubmit={handleBookingSubmit}>
                    <div className="mb-4">
                      <label htmlFor="event" className="label">
                        Select Event
                      </label>
                      <select
                        id="event"
                        className="input"
                        value={selectedEvent}
                        onChange={(e) => setSelectedEvent(e.target.value)}
                        required
                      >
                        <option value="">Select an event</option>
                        {events.map((event) => (
                          <option key={event._id} value={event._id}>
                            {event.name} ({new Date(event.date).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="date" className="label">
                        Select Date
                      </label>
                      <input
                        type="date"
                        id="date"
                        className="input"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-6">
                      <label htmlFor="note" className="label">
                        Additional Notes
                      </label>
                      <textarea
                        id="note"
                        rows="3"
                        className="input"
                        placeholder="Any special requirements or questions?"
                        value={bookingNote}
                        onChange={(e) => setBookingNote(e.target.value)}
                      ></textarea>
                    </div>

                    <div className="flex justify-between">
                      <button type="button" className="btn-outline" onClick={() => setShowBookingForm(false)}>
                        Cancel
                      </button>

                      <button type="submit" className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Send Booking Request"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Availability Calendar */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">Availability</h2>

                <div className="mb-4 flex justify-between items-center">
                  <button onClick={prevMonth} className="text-gray-600 hover:text-indigo-600">
                    &lt; Prev
                  </button>

                  <h3 className="font-medium">
                    {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </h3>

                  <button onClick={nextMonth} className="text-gray-600 hover:text-indigo-600">
                    Next &gt;
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div key={day} className="h-10 w-10 flex items-center justify-center font-medium">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

                <div className="mt-4 flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <div className="h-4 w-4 rounded-full bg-green-100 mr-2"></div>
                    <span>Available</span>
                  </div>

                  <div className="flex items-center">
                    <div className="h-4 w-4 rounded-full bg-red-100 mr-2"></div>
                    <span>Booked</span>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">Pricing</h2>

                <div className="space-y-4">
                  {(
                    vendor.packages || [
                      {
                        name: "Basic Package",
                        price: 1200,
                        description: "Up to 4 hours of coverage, 100 edited photos, online gallery",
                      },
                      {
                        name: "Standard Package",
                        price: 2500,
                        description: "Up to 8 hours of coverage, 300 edited photos, online gallery, one photographer",
                      },
                      {
                        name: "Premium Package",
                        price: 3800,
                        description:
                          "Full day coverage, 500+ edited photos, online gallery, two photographers, photo album",
                      },
                    ]
                  ).map((pkg, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{pkg.name}</h3>
                        <span className="font-bold">${pkg.price}</span>
                      </div>
                      <p className="text-gray-600 text-sm">{pkg.description}</p>
                    </div>
                  ))}
                </div>

                <button className="btn-primary w-full mt-6" onClick={() => setShowBookingForm(true)}>
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Overlay */}
      {showChat && (
        <div className="fixed bottom-0 right-0 w-full md:w-96 h-96 bg-white shadow-lg rounded-t-lg z-50 flex flex-col">
          <div className="bg-indigo-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">Chat with {vendor.name}</h3>
            <button onClick={() => setShowChat(false)} className="text-white hover:text-indigo-200">
              &times;
            </button>
          </div>

          <div className="flex-grow p-4 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  // Get the message content, prioritizing message field
                  const messageContent = message.message || message.text || "No message content"
                  
                  return (
                    <div key={index} className={`flex ${message.sender === "client" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs rounded-lg px-4 py-2 ${
                          message.sender === "client" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        <p>{messageContent}</p>
                        <p
                          className={`text-xs mt-1 ${message.sender === "client" ? "text-indigo-200" : "text-gray-500"}`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
            <div className="flex">
              <input
                type="text"
                className="input flex-grow"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="btn-primary ml-2" disabled={!newMessage.trim()}>
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default VendorProfile
