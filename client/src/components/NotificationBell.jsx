
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { BellIcon } from "@heroicons/react/24/outline"
import { BellIcon as BellIconSolid } from "@heroicons/react/24/solid"
import { useSocket } from "../context/SocketContext"
import { useAuth } from "../context/AuthContext"
import API from "../api/axios"

const NotificationBell = () => {
  const { socket } = useSocket()
  const { user, token } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const response = await API.get("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
          baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
        });
        setNotifications(response.data);
        setUnreadCount(response.data.filter((n) => !n.read).length);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    if (user && token) {
      fetchNotifications();
    }
  }, [user, token]);

  useEffect(() => {
    if (socket) {
      // Listen for new notifications
      socket.on("notification", (notification) => {
        setNotifications((prev) => [notification, ...prev])
        setUnreadCount((prev) => prev + 1)
      })

      return () => {
        socket.off("notification")
      }
    }
  }, [socket])

  const handleMarkAsRead = async (id) => {
    try {
      await API.put(`/api/notifications/${id}/read`, null, {
        headers: { Authorization: `Bearer ${token}` },
        baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => (notification._id === id ? { ...notification, read: true } : notification))
      );
      setUnreadCount((prev) => prev - 1);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await API.put("/api/notifications/read-all", null, {
        headers: { Authorization: `Bearer ${token}` },
        baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
      });

      // Update local state
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }

  return (
    <div className="relative">
      <button
        className="relative p-1 rounded-full text-gray-700 hover:bg-gray-100 focus:outline-none"
        onClick={toggleDropdown}
      >
        {unreadCount > 0 ? (
          <>
            <BellIconSolid className="h-6 w-6" />
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          </>
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50">
          <div className="p-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button className="text-xs text-indigo-600 hover:text-indigo-800" onClick={handleMarkAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications yet</div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? "bg-indigo-50" : ""}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Link
                          to={notification.link || "#"}
                          className="block"
                          onClick={() => handleMarkAsRead(notification._id)}
                        >
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-xs text-gray-500">{notification.message}</p>
                        </Link>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
