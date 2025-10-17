
import { useState, useEffect, useRef } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import { CheckIcon, XMarkIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline"
import API from "../../api/axios"
import { useSocket } from "../../context/SocketContext"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import LoadingSpinner from "../../components/LoadingSpinner"

import { useAuth } from "../../context/AuthContext"

const BookingDetails = () => {
  const { id } = useParams()
  const { socket, connected } = useSocket()
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [showChatModal, setShowChatModal] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (showChatModal) {
      scrollToBottom()
    }
  }, [messages, showChatModal])

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await API.get(`/api/vendor/bookings/${id}`)
        setBooking(response.data)
      } catch (err) {
        console.error("Error fetching booking:", err)
        setError("Failed to load booking details. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [id])



  useEffect(() => {
    if (socket && booking) {
      console.log("Setting up socket listeners for booking:", booking._id)

      const handleNewMessage = (message) => {
        try {
          console.log("Received new message:", message)
          
          // Validate message structure
          if (!message || typeof message !== 'object') {
            console.error("Invalid message format:", message)
            return
          }
          
          if (
            message.vendorId === booking.vendor._id &&
            message.clientId === booking.client._id
          ) {
            // Ensure message has both message and text fields
            const formattedMessage = {
              ...message,
              text: message.message || message.text || "",
              message: message.message || message.text || ""
            }
            
            console.log("Formatted new message:", formattedMessage)
            
            setMessages(prev => {
              // Check if message already exists
              const exists = prev.some(m => m._id === message._id)
              if (exists) {
                console.log("Message already exists, skipping:", message._id)
                return prev
              }
              console.log("Adding new message to state:", formattedMessage)
              return [...prev, formattedMessage]
            })
          } else {
            console.log("Message not for current chat:", {
              messageVendorId: message.vendorId,
              currentVendorId: booking.vendor._id,
              messageClientId: message.clientId,
              currentClientId: booking.client._id
            })
          }
        } catch (err) {
          console.error("Error handling new message:", err, "Message:", message)
        }
      }

      const handleChatMessage = (data) => {
        try {
          console.log("Received chat message:", data)

          // Validate message structure
          if (!data || typeof data !== 'object' || !data.message) {
            console.error("Invalid chat message format:", data)
            return
          }

          const message = data.message

          if (
            message.vendorId === booking.vendor._id &&
            message.clientId === booking.client._id
          ) {
            // Ensure message has both message and text fields
            const formattedMessage = {
              ...message,
              text: message.message || message.text || "",
              message: message.message || message.text || ""
            }

            console.log("Formatted chat message:", formattedMessage)

            setMessages(prev => {
              // Check if message already exists
              const exists = prev.some(m => m._id === message._id)
              if (exists) {
                console.log("Message already exists, skipping:", message._id)
                return prev
              }
              console.log("Adding chat message to state:", formattedMessage)
              return [...prev, formattedMessage]
            })
          } else {
            console.log("Chat message not for current chat:", {
              messageVendorId: message.vendorId,
              currentVendorId: booking.vendor._id,
              messageClientId: message.clientId,
              currentClientId: booking.client._id
            })
          }
        } catch (err) {
          console.error("Error handling chat message:", err, "Data:", data)
        }
      }

      socket.on("message", handleNewMessage)
      socket.on("chatMessage", handleChatMessage)

      return () => {
        console.log("Cleaning up socket listeners")
        socket.off("message", handleNewMessage)
        socket.off("chatMessage", handleChatMessage)
      }
    }
  }, [socket, booking])

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await API.put(
        `${import.meta.env.VITE_API_URL}/api/vendor/bookings/${booking._id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )

      setBooking(response.data)
      toast.success(`Booking status updated to ${newStatus}`)
    } catch (error) {
      console.error("Error updating booking status:", error)
      const errorMessage = error.response?.data?.details || error.response?.data?.message || "Failed to update booking status"
      toast.error(errorMessage)
    }
  }

  const openChat = async () => {
    try {
      console.log("Opening chat with client:", booking.client._id)
      const response = await API.get(`/api/chat/${booking.client._id}`)
      console.log("Raw chat history response:", response)
      console.log("Fetched chat history data:", response.data)
      
      if (!Array.isArray(response.data)) {
        console.error("Expected array of messages, got:", typeof response.data)
        toast.error("Invalid chat history format")
        setMessages([])
        return
      }
      
      // Ensure messages have both message and text fields
      const formattedMessages = response.data.map(msg => {
        try {
          console.log("Processing message:", msg)
          return {
            ...msg,
            text: msg.message || msg.text || "",
            message: msg.message || msg.text || ""
          }
        } catch (err) {
          console.error("Error formatting message:", err, "Message:", msg)
          return {
            _id: Date.now().toString(),
            vendorId: booking.vendor._id,
            clientId: booking.client._id,
            sender: "system",
            message: "Error loading message",
            text: "Error loading message",
            timestamp: new Date().toISOString(),
            read: false
          }
        }
      })
      
      console.log("Formatted messages:", formattedMessages)
      setMessages(formattedMessages)
    } catch (err) {
      console.error("Error fetching chat history:", err)
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
      toast.error(`Failed to load chat history: ${err.message}`)
      setMessages([])
    }

    setShowChatModal(true)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!newMessage.trim() || !socket || !booking) {
      console.log("Cannot send message:", {
        hasMessage: !!newMessage.trim(),
        hasSocket: !!socket,
        hasBooking: !!booking
      })
      return
    }

    setSendingMessage(true)

    try {
      // Get the vendor ID from the AuthContext
      const vendorId = user._id
      console.log("Using vendor ID from AuthContext:", vendorId)

      const messageData = {
        vendorId: vendorId,
        clientId: booking.client._id,
        sender: "vendor",
        message: newMessage.trim(),
        timestamp: new Date().toISOString()
      }

      console.log("Preparing to send message:", messageData)

      // Create a temporary message object
      const tempMessage = {
        _id: Date.now().toString(), // Temporary ID
        vendorId: vendorId,
        clientId: booking.client._id,
        sender: "vendor",
        message: newMessage.trim(),
        text: newMessage.trim(),
        timestamp: new Date().toISOString(),
        read: false
      }

      // Add message to local state immediately
      setMessages(prev => [...prev, tempMessage])

      // Send message via socket
      socket.emit("sendMessage", messageData)

      console.log("Message emitted via socket")

      // Remove temporary message when real message arrives
      const handleMessageSent = (message) => {
        if (message.vendorId === vendorId && message.clientId === booking.client._id) {
          setMessages(prev => {
            // Remove temp message if this real message matches its content and timestamp
            const withoutTemp = prev.filter(m => {
              if (m._id?.toString().startsWith('temp-')) {
                const timeDiff = Math.abs(new Date(m.timestamp) - new Date(message.timestamp))
                return !(m.message === message.message && timeDiff < 2000)
              }
              return true
            })
            return withoutTemp
          })
        }
      }

      socket.once("messageSent", handleMessageSent)

      setNewMessage("")
      scrollToBottom()
    } catch (err) {
      console.error("Error sending message:", err)
      toast.error("Failed to send message. Please try again.")
    } finally {
      setSendingMessage(false)
    }
  }

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow bg-gray-50 py-8">
          <div className="container-custom">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
            <Link to="/vendor/bookings" className="btn-primary mt-4">
              Back to Bookings
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow bg-gray-50 py-8">
          <div className="container-custom">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Booking Not Found</h2>
              <p className="text-gray-600 mb-4">The booking you're looking for doesn't exist or you don't have access to it.</p>
              <Link to="/vendor/bookings" className="btn-primary">
                Back to Bookings
              </Link>
            </div>
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
            <h1 className="text-3xl font-bold">Booking Details</h1>
            <Link to="/vendor/bookings" className="btn-outline">
              Back to Bookings
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Client Information */}
            <div className="flex items-center mb-6">
              <img
                src={booking.client.profileImage || "/placeholder.svg?height=50&width=50"}
                alt={booking.client.name}
                className="h-12 w-12 rounded-full object-cover mr-4"
              />
              <div>
                <h2 className="text-xl font-semibold">{booking.client.name}</h2>
                <p className="text-gray-500">{booking.client.email}</p>
              </div>
            </div>

            {/* Booking Status */}
            <div className="mb-6">
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

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Event Information</h3>
                <div className="space-y-2">
                  <p>
                    <span className="text-gray-500">Event Name:</span> {booking.event.name}
                  </p>
                  <p>
                    <span className="text-gray-500">Event Type:</span> {booking.event.eventType}
                  </p>
                  <p>
                    <span className="text-gray-500">Location:</span> {booking.event.location}
                  </p>
                  <p>
                    <span className="text-gray-500">Date:</span>{" "}
                    {new Date(booking.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {booking.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Notes</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-md">{booking.notes}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                onClick={openChat}
              >
                <ChatBubbleLeftIcon className="h-5 w-5 mr-1" />
                Chat with Client
              </button>

              {booking.status === "pending" && (
                <>
                  <button
                    className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                    onClick={() => handleStatusChange("confirmed")}
                  >
                    <CheckIcon className="h-5 w-5 mr-1" />
                    Confirm Booking
                  </button>

                  <button
                    className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                    onClick={() => handleStatusChange("declined")}
                  >
                    <XMarkIcon className="h-5 w-5 mr-1" />
                    Decline Booking
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Chat with {booking.client.name}</h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowChatModal(false)}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-4 h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message, index) => {
                  try {
                    // Get the message content, prioritizing message field
                    const messageContent = message.message || message.text || "No message content"
                    console.log("Rendering message:", message, "Content:", messageContent)
                    
                    return (
                      <div
                        key={message._id || index}
                        className={`mb-4 ${
                          message.sender === "vendor" ? "text-right" : "text-left"
                        }`}
                      >
                        <div
                          className={`inline-block p-3 rounded-lg ${
                            message.sender === "vendor"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <p>{messageContent}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    )
                  } catch (err) {
                    console.error("Error rendering message:", err, "Message:", message)
                    return (
                      <div key={`error-${index}`} className="mb-4 text-center text-red-500">
                        Error displaying message
                      </div>
                    )
                  }
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 input"
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={sendingMessage || !newMessage.trim()}
                >
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

export default BookingDetails 