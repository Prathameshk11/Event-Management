
import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"
import { useAuth } from "./AuthContext"
const backendURL = import.meta.env.VITE_API_URL;


const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    let newSocket = null

    // Only connect if user is authenticated
    if (user) {
      const token = localStorage.getItem("token")
      newSocket = io(backendURL, {
        auth: {
          token,
        },
        transports: ["websocket", "polling"],
        withCredentials: true,
      })

      newSocket.on("connect", () => {
        console.log("Socket connected successfully")
        setConnected(true)
      })

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error)
        setConnected(false)
      })

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected")
        setConnected(false)
      })

      setSocket(newSocket)
    }

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect()
      }
    }
  }, [user])

  const value = {
    socket,
    connected,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
