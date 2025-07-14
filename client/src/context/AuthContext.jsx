"use client"

import { createContext, useContext, useState, useEffect } from "react"
import API from "../api/axios"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem("token")

        if (token) {
          // Set default auth header
          API.defaults.headers.common["Authorization"] = `Bearer ${token}`

          // Verify token and get user data
          const response = await API.get("/api/auth/me")
          setUser(response.data)
        }
      } catch (err) {
        console.error("Auth check failed:", err)
        localStorage.removeItem("token")
        delete API.defaults.headers.common["Authorization"]
      } finally {
        setLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await API.post("/api/auth/login", { email, password })
      const { token, user } = response.data

      // Save token and set user
      localStorage.setItem("token", token)
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(user)

      return user
    } catch (err) {
      setError(err.response?.data?.message || "Login failed")
      throw err
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      const response = await API.post("/api/auth/register", userData)
      const { token, user } = response.data

      // Save token and set user
      localStorage.setItem("token", token)
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(user)

      return user
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed")
      throw err
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    delete API.defaults.headers.common["Authorization"]
    setUser(null)
  }

  const updateProfile = async (userData) => {
    try {
      setError(null)
      const response = await API.put("/api/users/profile", userData)
      setUser(response.data)
      return response.data
    } catch (err) {
      setError(err.response?.data?.message || "Profile update failed")
      throw err
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
