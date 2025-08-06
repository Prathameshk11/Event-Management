
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-hot-toast"
import { CheckIcon, XMarkIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline"
import API from "../../api/axios"
import { useSocket } from "../../context/SocketContext"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import LoadingSpinner from "../../components/LoadingSpinner"

const Bookings = () => {
  const { socket } = useSocket()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("all")
  const [showChatModal, setShowChatModal] = useState(false)
  const [currentChat, setCurrentChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await API.get("/api/vendor/bookings")
        setBookings(response.data)
      } catch (err) {
        console.error("Error fetching bookings:", err)
        setError("Failed to load bookings. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  useEffect(() => {
    // Socket event listeners for real-time updates
    if (socket) {
      // Listen for new bookings
      socket.on("newBooking", (booking) => {
        setBookings((prev) => [booking, ...prev])
        toast.success("New booking request received!")
      })

      // Listen for booking updates
      socket.on("bookingUpdated", (updatedBooking) => {
        setBookings((prev) => prev.map((booking) => (booking._id === updatedBooking._id ? updatedBooking : booking)))
      })

      // Listen for chat messages
      socket.on("message", (message) => {
        if (
          currentChat &&
          (message.clientId === currentChat.client._id || message.vendorId === currentChat.vendor._id)
        ) {
          setMessages((prev) => [...prev, message])
        }
      })

      return () => {
        socket.off("newBooking")
        socket.off("bookingUpdated")
        socket.off("message")
      }
    }
  }, [socket, currentChat])

  const handleStatusChange = async (bookingId, status) => {
    try {
      const response = await API.put(`/api/vendor/bookings/${bookingId}`, { status })

      // Update local state
      setBookings((prev) => prev.map((booking) => (booking._id === bookingId ? { ...booking, status } : booking)))

      toast.success(`Booking ${status === "confirmed" ? "confirmed" : "declined"} successfully!`)
    } catch (err) {
      console.error("Error updating booking status:", err)
      toast.error(err.response?.data?.message || "Failed to update booking status. Please try again.")
    }
  }

  const openChat = async (booking) => {
    setCurrentChat(booking)

    try {
      const response = await API.get(`/api/chat/${booking.client._id}`)
      setMessages(response.data)
    } catch (err) {
      console.error("Error fetching chat history:", err)
      setMessages([])
    }

    setShowChatModal(true)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    setSendingMessage(true)

    try {
      // Send message via socket
      socket.emit("sendMessage", {
        vendorId: currentChat.vendor._id,
        clientId: currentChat.client._id,
        sender: "vendor",
        text: newMessage,
        timestamp: new Date(),
      })

      setNewMessage("")
    } catch (err) {
      console.error("Error sending message:", err)
      toast.error("Failed to send message. Please try again.")
    } finally {
      setSendingMessage(false)
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "all") return true
    if (activeTab === "pending") return booking.status === "pending"
    if (activeTab === "confirmed") return booking.status === "confirmed"
    if (activeTab === "declined") return booking.status === "declined"
    return true
  })

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-grow bg-gray-50 py-8">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Manage Bookings</h1>
            <Link to="/vendor" className="btn-outline">
              Back to Dashboard
            </Link>
          </div>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-8">
            <div className="flex border-b">
              <button
                className={`px-4 py-3 font-medium text-sm ${
                  activeTab === "all"
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("all")}
              >
                All Bookings
              </button>
              <button
                className={`px-4 py-3 font-medium text-sm ${
                  activeTab === "pending"
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("pending")}
              >
                Pending
              </button>
              <button
                className={`px-4 py-3 font-medium text-sm ${
                  activeTab === "confirmed"
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("confirmed")}
              >
                Confirmed
              </button>
              <button
                className={`px-4 py-3 font-medium text-sm ${
                  activeTab === "declined"
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("declined")}
              >
                Declined
              </button>
            </div>

            {/* Bookings List */}
            <div className="p-6">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
                  <p className="text-gray-500">
                    {activeTab === "all"
                      ? "You don't have any bookings yet."
                      : `You don't have any ${activeTab} bookings.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredBookings.map((booking) => (
                    <div key={booking._id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                        <div className="flex items-center mb-4 md:mb-0">
                          <img
                            src={booking.client.profileImage || "/placeholder.svg?height=50&width=50"}
                            alt={booking.client.name}
                            className="h-12 w-12 rounded-full object-cover mr-4"
                          />
                          <div>
                            <h3 className="font-semibold text-lg">{booking.client.name}</h3>
                            <p className="text-gray-500">{booking.client.email}</p>
                          </div>
                        </div>

                        <div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : booking.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Event</h4>
                          <p className="font-medium">{booking.event.name}</p>
                          <p className="text-sm text-gray-600">{booking.event.eventType}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Date</h4>
                          <p className="font-medium">
                            {new Date(booking.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
                          <p className="font-medium">{booking.event.location}</p>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{booking.notes}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <button
                          className="flex items-center px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                          onClick={() => openChat(booking)}
                        >
                          <ChatBubbleLeftIcon className="h-5 w-5 mr-1" />
                          Chat with Client
                        </button>

                        {booking.status === "pending" && (
                          <>
                            <button
                              className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                              onClick={() => handleStatusChange(booking._id, "confirmed")}
                            >
                              <CheckIcon className="h-5 w-5 mr-1" />
                              Confirm
                            </button>

                            <button
                              className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                              onClick={() => handleStatusChange(booking._id, "declined")}
                            >
                              <XMarkIcon className="h-5 w-5 mr-1" />
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChatModal && currentChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl h-[600px] flex flex-col">
            <div className="bg-indigo-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <div className="flex items-center">
                <img
                  src={currentChat.client.profileImage || "/placeholder.svg?height=40&width=40"}
                  alt={currentChat.client.name}
                  className="h-10 w-10 rounded-full object-cover mr-3"
                />
                <div>
                  <h3 className="font-semibold">{currentChat.client.name}</h3>
                  <p className="text-sm text-indigo-200">
                    {currentChat.event.name} - {new Date(currentChat.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowChatModal(false)} className="text-white hover:text-indigo-200">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-grow p-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.sender === "vendor" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs rounded-lg px-4 py-2 ${
                          message.sender === "vendor" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        <p>{message.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender === "vendor" ? "text-indigo-200" : "text-gray-500"
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
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
                <button type="submit" className="btn-primary ml-2" disabled={sendingMessage || !newMessage.trim()}>
                  {sendingMessage ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default Bookings
