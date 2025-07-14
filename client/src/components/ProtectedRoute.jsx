"use client"

import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import LoadingSpinner from "./LoadingSpinner"

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If role is specified, check if user has that role
  if (role && user.role !== role) {
    // Redirect to appropriate dashboard based on role
    return <Navigate to={user.role === "client" ? "/client" : "/vendor"} replace />
  }

  return children
}

export default ProtectedRoute
