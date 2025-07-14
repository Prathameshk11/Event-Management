"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline"
import { useAuth } from "../context/AuthContext"
import { useSocket } from "../context/SocketContext"
import NotificationBell from "./NotificationBell"
import ChatBox from "./ChatBox"
import axios from "axios"

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [activeChats, setActiveChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const { user, logout } = useAuth()
  const { socket, connected } = useSocket()
  const location = useLocation()
  const { token } = useAuth()

  useEffect(() => {
    const fetchActiveChats = async () => {
      try {
        const response = await axios.get("/api/chat/active", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (Array.isArray(response.data)) {
          console.log("Active chats fetched:", response.data);
          setActiveChats(response.data);
          // Calculate total unread messages
          const totalUnread = response.data.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
          setUnreadMessages(totalUnread);
        } else {
          console.error("Invalid chat data received:", response.data);
          setActiveChats([]);
          setUnreadMessages(0);
        }
      } catch (error) {
        console.error("Error fetching active chats:", error);
        setActiveChats([]);
        setUnreadMessages(0);
      }
    };

    if (token) {
      fetchActiveChats();
    }
  }, [token]);

  useEffect(() => {
    if (user && socket) {
      // Listen for new messages
      socket.on("message", (message) => {
        // Update unread count if chat is not currently open
        if (
          !isChatOpen ||
          (selectedChat && user.role === "vendor" && message.clientId !== selectedChat?.userId) ||
          (user.role === "client" && message.vendorId !== selectedChat?.userId)
        ) {
          setUnreadMessages((prev) => prev + 1)
        }

        // Update active chats
        setActiveChats((prev) => {
          const otherUserId = user.role === "vendor" ? message.clientId : message.vendorId
          const existingChatIndex = prev.findIndex((chat) => chat.userId === otherUserId)

          if (existingChatIndex >= 0) {
            const updatedChats = [...prev]
            updatedChats[existingChatIndex] = {
              ...updatedChats[existingChatIndex],
              lastMessage: message.text,
              lastMessageTime: message.timestamp,
              unreadCount:
                isChatOpen && selectedChat?.userId === otherUserId
                  ? 0
                  : (updatedChats[existingChatIndex].unreadCount || 0) + 1,
            }
            return updatedChats
          }

          return prev
        })
      })

      // Listen for chat updates
      socket.on("chatUpdated", (update) => {
        setActiveChats((prev) => {
          const existingChatIndex = prev.findIndex((chat) => chat.userId === update.userId)
          if (existingChatIndex >= 0) {
            const updatedChats = [...prev]
            updatedChats[existingChatIndex] = {
              ...updatedChats[existingChatIndex],
              lastMessage: update.lastMessage,
              lastMessageTime: update.lastMessageTime,
              unreadCount: update.unreadCount
            }
            return updatedChats
          }
          return prev
        })
      })

      return () => {
        socket.off("message")
        socket.off("chatUpdated")
      }
    }
  }, [user, socket, isChatOpen, selectedChat])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    closeMenu()
  }

  const isActive = (path) => {
    return location.pathname === path ? "text-indigo-600" : "text-gray-700 hover:text-indigo-600"
  }

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      // Don't reset unread count when opening chat
      // This was causing the unread count to disappear
    }
  }

  const handleChatSelect = (chat) => {
    setSelectedChat(chat)

    // Update unread count
    setUnreadMessages((prev) => Math.max(0, prev - (chat.unreadCount || 0)))

    // Update active chats
    setActiveChats((prev) => prev.map((c) => (c.userId === chat.userId ? { ...c, unreadCount: 0 } : c)))
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-indigo-600">EventPro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`font-medium ${isActive("/")}`}>
              Home
            </Link>
            <Link to="/vendors" className={`font-medium ${isActive("/vendors")}`}>
              Vendors
            </Link>

            {user ? (
              <>
                <Link
                  to={user.role === "client" ? "/client" : "/vendor"}
                  className={`font-medium ${isActive(user.role === "client" ? "/client" : "/vendor")}`}
                >
                  Dashboard
                </Link>

                {/* Notifications */}
                <div className="flex items-center space-x-4">
                  <NotificationBell />

                  {/* User Menu */}
                  <div className="relative group">
                    <div className="flex items-center cursor-pointer">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage || "/placeholder.svg"}
                            alt={user.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-indigo-600 font-semibold">{user.name.charAt(0)}</span>
                        )}
                      </div>
                    </div>

                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>

                        <Link
                          to={user.role === "client" ? "/client" : "/vendor"}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Dashboard
                        </Link>

                        <Link
                          to={user.role === "client" ? "/client/profile" : "/vendor/profile"}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Profile
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className={`font-medium ${isActive("/login")}`}>
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={toggleMenu} className="text-gray-700">
              {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="container-custom py-4 space-y-4">
            <Link to="/" className={`block font-medium ${isActive("/")}`} onClick={closeMenu}>
              Home
            </Link>
            <Link to="/vendors" className={`block font-medium ${isActive("/vendors")}`} onClick={closeMenu}>
              Vendors
            </Link>

            {user ? (
              <>
                <Link
                  to={user.role === "client" ? "/client" : "/vendor"}
                  className={`block font-medium ${isActive(user.role === "client" ? "/client" : "/vendor")}`}
                  onClick={closeMenu}
                >
                  Dashboard
                </Link>

                <Link
                  to={user.role === "client" ? "/client/profile" : "/vendor/profile"}
                  className="block font-medium text-gray-700 hover:text-indigo-600"
                  onClick={closeMenu}
                >
                  Profile
                </Link>

                <div className="flex items-center space-x-4 py-2">
                  <NotificationBell />
                </div>

                <button
                  onClick={handleLogout}
                  className="block w-full text-left font-medium text-gray-700 hover:text-indigo-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`block font-medium ${isActive("/login")}`} onClick={closeMenu}>
                  Login
                </Link>
                <Link to="/register" className="block btn-primary text-center" onClick={closeMenu}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Chat Box */}
      {user && (
        <ChatBox
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          activeChats={activeChats}
          onChatSelect={handleChatSelect}
          selectedChat={selectedChat}
        />
      )}
    </nav>
  )
}

export default Navbar
