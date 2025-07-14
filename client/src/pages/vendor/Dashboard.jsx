"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { CalendarIcon, UserIcon, ChatBubbleLeftIcon, PhotoIcon } from "@heroicons/react/24/outline"
import { useAuth } from "../../context/AuthContext"
import API from "../../api/axios"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import LoadingSpinner from "../../components/LoadingSpinner"

const Dashboard = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalIncome: 0,
    profileViews: 0,
    unreadMessages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch vendor's bookings
        const bookingsResponse = await API.get("/api/vendor/bookings")
        setBookings(bookingsResponse.data)

        // Fetch vendor's stats
        const statsResponse = await API.get("/api/vendor/stats")
        setStats(statsResponse.data)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to load dashboard data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-grow bg-gray-50 py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}!</h1>
            <p className="text-gray-600">Manage your vendor profile, bookings, and availability from your dashboard.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card bg-white">
              <div className="flex items-center">
                <div className="bg-indigo-100 rounded-full p-3 mr-4">
                  <CalendarIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Total Bookings</p>
                  <h3 className="text-2xl font-bold">{stats.totalBookings}</h3>
                </div>
              </div>
            </div>

            <div className="card bg-white">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-3 mr-4">
                  <UserIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Profile Views</p>
                  <h3 className="text-2xl font-bold">{stats.profileViews}</h3>
                </div>
              </div>
            </div>

            <div className="card bg-white">
              <div className="flex items-center">
                <div className="bg-orange-100 rounded-full p-3 mr-4">
                  <ChatBubbleLeftIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Unread Messages</p>
                  <h3 className="text-2xl font-bold">{stats.unreadMessages}</h3>
                </div>
              </div>
            </div>

            <div className="card bg-white">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full p-3 mr-4">
                  <CalendarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Pending Bookings</p>
                  <h3 className="text-2xl font-bold">{stats.pendingBookings}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link
              to="/vendor/portfolio"
              className="card bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              <div className="flex items-center">
                <div className="bg-white/20 rounded-full p-3 mr-4">
                  <PhotoIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Manage Portfolio</h3>
                  <p className="text-indigo-100 text-sm">Update your work samples</p>
                </div>
              </div>
            </Link>

            <Link
              to="/vendor/availability"
              className="card bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <div className="flex items-center">
                <div className="bg-white/20 rounded-full p-3 mr-4">
                  <CalendarIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Update Availability</h3>
                  <p className="text-emerald-100 text-sm">Manage your calendar</p>
                </div>
              </div>
            </Link>

            <Link to="/vendor/bookings" className="card bg-orange-500 text-white hover:bg-orange-600 transition-colors">
              <div className="flex items-center">
                <div className="bg-white/20 rounded-full p-3 mr-4">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">View Bookings</h3>
                  <p className="text-orange-100 text-sm">Manage client bookings</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Bookings */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Recent Bookings</h2>
              <Link to="/vendor/bookings" className="text-indigo-600 hover:text-indigo-800 font-medium">
                View All
              </Link>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
            )}

            {bookings.length === 0 ? (
              <div className="card text-center py-12">
                <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-6">When clients book your services, they will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Client</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Event</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Date</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Status</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookings.slice(0, 5).map((booking) => (
                      <tr key={booking._id}>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <img
                              src={booking.client.profileImage || "/placeholder.svg?height=40&width=40"}
                              alt={booking.client.name}
                              className="h-10 w-10 rounded-full mr-3 object-cover"
                            />
                            <div>
                              <p className="font-medium">{booking.client.name}</p>
                              <p className="text-sm text-gray-500">{booking.client.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium">{booking.event.name}</p>
                          <p className="text-sm text-gray-500">{booking.event.eventType}</p>
                        </td>
                        <td className="py-3 px-4">
                          {new Date(booking.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : booking.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            to={`/vendor/bookings/${booking._id}`}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Profile Completion */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Profile Completion</h2>

            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Profile Strength</span>
                <span className="text-sm font-medium">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: "75%" }}></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <div className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm">Basic information completed</span>
              </div>

              <div className="flex items-center">
                <div className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm">Contact information added</span>
              </div>

              <div className="flex items-center">
                <div className="h-5 w-5 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mr-3">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm">Add more portfolio items (3/10)</span>
              </div>

              <div className="flex items-center">
                <div className="h-5 w-5 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mr-3">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm">Update your service packages</span>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/vendor/profile" className="btn-primary w-full text-center">
                Complete Your Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Dashboard
