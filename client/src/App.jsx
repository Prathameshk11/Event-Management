import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "./context/AuthContext"
import { SocketProvider } from "./context/SocketContext"

// Pages
import Landing from "./pages/Landing"
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import ClientDashboard from "./pages/client/Dashboard"
import VendorDashboard from "./pages/vendor/Dashboard"
import VendorListing from "./pages/client/VendorListing"
import ClientVendorProfile from "./pages/client/VendorProfile"
import CreateEvent from "./pages/client/CreateEvent"
import EditEvent from "./pages/client/EditEvent"
import ManagePortfolio from "./pages/vendor/ManagePortfolio"
import Profile from "./pages/vendor/Profile"
import ManageAvailability from "./pages/vendor/ManageAvailability"
import Bookings from "./pages/vendor/Bookings"
import BookingDetails from "./pages/vendor/BookingDetails"
import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Toaster position="top-center" />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Client Routes */}
            <Route
              path="/client"
              element={
                <ProtectedRoute role="client">
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendors"
              element={
                <ProtectedRoute role="client">
                  <VendorListing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendors/:id"
              element={
                <ProtectedRoute role="client">
                  <ClientVendorProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/create"
              element={
                <ProtectedRoute role="client">
                  <CreateEvent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:id/edit"
              element={
                <ProtectedRoute role="client">
                  <EditEvent />
                </ProtectedRoute>
              }
            />

            {/* Vendor Routes */}
            <Route
              path="/vendor"
              element={
                <ProtectedRoute role="vendor">
                  <VendorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/portfolio"
              element={
                <ProtectedRoute role="vendor">
                  <ManagePortfolio />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/availability"
              element={
                <ProtectedRoute role="vendor">
                  <ManageAvailability />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/bookings"
              element={
                <ProtectedRoute role="vendor">
                  <Bookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/bookings/:id"
              element={
                <ProtectedRoute role="vendor">
                  <BookingDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/profile"
              element={
                <ProtectedRoute role="vendor">
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
