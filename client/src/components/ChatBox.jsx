
import { useState, useEffect, useRef } from "react"
import { XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline"
import { useSocket } from "../context/SocketContext"
import { useAuth } from "../context/AuthContext"

const ChatBox = ({ isOpen, onClose, activeChats, onChatSelect, selectedChat }) => {
  const { socket } = useSocket()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (selectedChat) {
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
  }, [selectedChat])

  useEffect(() => {
    if (selectedChat && socket) {
      setLoading(true)
      console.log("Fetching chat history for:", selectedChat.userId)

      // Fetch chat history
      const fetchMessages = async () => {
        try {
          const response = await fetch(`/api/chat/${selectedChat.userId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          })
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const data = await response.json()
          console.log("Chat history fetched:", data.length, "messages")
          setMessages(data)
        } catch (error) {
          console.error("Error fetching messages:", error)
        } finally {
          setLoading(false)
        }
      }

      // Listen for new messages
      const handleNewMessage = (message) => {
        console.log("Received message:", message)
        // Only add message if it's for this chat and doesn't already exist
        if (
          ((user.role === "vendor" && message.clientId === selectedChat.userId) ||
           (user.role === "client" && message.vendorId === selectedChat.userId)) &&
          !messages.some(m => m._id === message._id)
        ) {
          setMessages(prev => [...prev, message])
          scrollToBottom()
        }
      }

      // Listen for chat updates
      const handleChatUpdate = (update) => {
        console.log("Received chat update:", update)
        if (update.userId === selectedChat.userId) {
          // Update the selected chat with new information
          onChatSelect({
            ...selectedChat,
            lastMessage: update.lastMessage,
            lastMessageTime: update.lastMessageTime,
            unreadCount: 0
          })
        }
      }

      // Listen for chat messages (from other components)
      const handleChatMessage = (data) => {
        console.log("Received chat message:", data)
        // Only add message if it's for this chat and doesn't already exist
        if (
          data.chatId === `${user.role === "vendor" ? user._id : selectedChat.userId}-${user.role === "vendor" ? selectedChat.userId : user._id}` &&
          !messages.some(m => m._id === data.message._id)
        ) {
          setMessages(prev => [...prev, data.message])
          scrollToBottom()
        }
      }

      socket.on("chatUpdated", handleChatUpdate)

      // Listen for message errors
      socket.on("messageError", (error) => {
        console.error("Message error:", error)
      })

      // Mark messages as read
      const markAsRead = async () => {
        try {
          const response = await fetch(`/api/chat/${selectedChat.userId}/read`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          })
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          console.log("Messages marked as read")
        } catch (error) {
          console.error("Error marking messages as read:", error)
        }
      }

      markAsRead()

      return () => {
        socket.off("chatUpdated")
        socket.off("messageError")
      }
    }
  }, [selectedChat, socket, user, onChatSelect])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    const messageData = {
      vendorId: user.role === "vendor" ? user._id : selectedChat.userId,
      clientId: user.role === "client" ? user._id : selectedChat.userId,
      sender: user.role,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    }

    // Add message to local state immediately
    const tempMessage = {
      ...messageData,
      _id: Date.now().toString(), // Temporary ID
      createdAt: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMessage])
    setNewMessage("")
    scrollToBottom()

    // Send message through socket
    socket.emit("sendMessage", messageData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-0 right-4 w-80 bg-white rounded-t-lg shadow-lg z-40 flex flex-col">
      {/* Chat Header */}
      <div className="bg-indigo-600 text-white p-3 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center">
          {selectedChat ? (
            <>
              <div className="h-8 w-8 rounded-full bg-indigo-300 flex items-center justify-center mr-2 overflow-hidden">
                {selectedChat.profileImage ? (
                  <img
                    src={selectedChat.profileImage || "/placeholder.svg"}
                    alt={selectedChat.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-indigo-600 font-semibold">{selectedChat.name.charAt(0)}</span>
                )}
              </div>
              <div>
                <h3 className="font-medium text-sm">{selectedChat.name}</h3>
                <p className="text-xs text-indigo-200">
                  {selectedChat.lastActive
                    ? `Last active ${new Date(selectedChat.lastActive).toLocaleTimeString()}`
                    : "Online"}
                </p>
              </div>
            </>
          ) : (
            <h3 className="font-medium">Messages</h3>
          )}
        </div>
        <button onClick={onClose} className="text-white hover:text-indigo-200">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Chat Content */}
      {selectedChat ? (
        <>
          {/* Messages */}
          <div className="flex-1 p-3 h-80 overflow-y-auto bg-gray-50">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-500 text-sm">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => {
                  const isSender =
                    (user.role === "vendor" && message.sender === "vendor") ||
                    (user.role === "client" && message.sender === "client")

                  return (
                    <div key={index} className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs rounded-lg px-3 py-2 ${
                          isSender ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className={`text-xs mt-1 ${isSender ? "text-indigo-200" : "text-gray-500"}`}>
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

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200">
            <div className="flex">
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white rounded-r-md px-3 hover:bg-indigo-700 disabled:opacity-50"
                disabled={!newMessage.trim()}
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </form>
        </>
      ) : (
        // Chat List
        <div className="h-80 overflow-y-auto">
          {activeChats.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-500 text-sm">No active conversations</div>
          ) : (
            <div>
              {activeChats.map((chat) => (
                <div
                  key={chat.userId}
                  className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onChatSelect(chat)}
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3 overflow-hidden">
                      {chat.profileImage ? (
                        <img
                          src={chat.profileImage || "/placeholder.svg"}
                          alt={chat.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-indigo-600 font-semibold">{chat.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-sm">{chat.name}</h4>
                        <span className="text-xs text-gray-500">
                          {new Date(chat.lastMessageTime).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="ml-2 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ChatBox
