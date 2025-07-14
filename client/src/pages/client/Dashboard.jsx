"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { PlusIcon, CalendarIcon, UserGroupIcon } from "@heroicons/react/24/outline"
import { useAuth } from "../../context/AuthContext"
import { useSocket } from "../../context/SocketContext"
import API from "../../api/axios"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import LoadingSpinner from "../../components/LoadingSpinner"

const Dashboard = () => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [events, setEvents] = useState([])
  const [bookings, setBookings] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch client's events
        const eventsResponse = await API.get("/api/events")
        setEvents(eventsResponse.data)

        // Fetch client's bookings
        const bookingsResponse = await API.get("/api/bookings")
        setBookings(bookingsResponse.data)

        // Fetch available vendors
        const vendorsResponse = await API.get("/api/vendors")
        setVendors(vendorsResponse.data)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to load dashboard data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Listen for realtime vendor updates
  useEffect(() => {
    if (!socket) return;

    console.log("Setting up vendor socket listeners");
    
    // Listen for new vendors
    socket.on("vendor:created", (newVendor) => {
      console.log("New vendor created:", newVendor);
      setVendors(prev => {
        // Check if vendor already exists to avoid duplicates
        if (prev.some(v => v._id === newVendor._id)) {
          return prev;
        }
        return [...prev, newVendor];
      });
    });

    // Listen for vendor updates
    socket.on("vendor:updated", (updatedVendor) => {
      console.log("Vendor updated:", updatedVendor);
      setVendors(prev => prev.map(vendor => 
        vendor._id === updatedVendor._id ? updatedVendor : vendor
      ));
    });

    // Listen for vendor deletions
    socket.on("vendor:deleted", (vendorId) => {
      console.log("Vendor deleted:", vendorId);
      setVendors(prev => prev.filter(vendor => vendor._id !== vendorId));
    });

    return () => {
      console.log("Cleaning up vendor socket listeners");
      socket.off("vendor:created");
      socket.off("vendor:updated");
      socket.off("vendor:deleted");
    };
  }, [socket]);

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-grow bg-gray-50 py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}!</h1>
            <p className="text-gray-600">Manage your events and bookings from your dashboard.</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link to="/events/create" className="card bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
              <div className="flex items-center">
                <div className="bg-white/20 rounded-full p-3 mr-4">
                  <PlusIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Create Event</h3>
                  <p className="text-indigo-100 text-sm">Plan a new event</p>
                </div>
              </div>
            </Link>

            <Link to="/vendors" className="card bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
              <div className="flex items-center">
                <div className="bg-white/20 rounded-full p-3 mr-4">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Find Vendors</h3>
                  <p className="text-emerald-100 text-sm">Browse vendor listings</p>
                </div>
              </div>
            </Link>

            <Link to="#bookings" className="card bg-orange-500 text-white hover:bg-orange-600 transition-colors">
              <div className="flex items-center">
                <div className="bg-white/20 rounded-full p-3 mr-4">
                  <CalendarIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">View Bookings</h3>
                  <p className="text-orange-100 text-sm">Manage your vendor bookings</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Upcoming Events */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Your Events</h2>
              <Link to="/events/create" className="btn-primary flex items-center">
                <PlusIcon className="h-5 w-5 mr-1" />
                New Event
              </Link>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
            )}

            {events.length === 0 ? (
              <div className="card text-center py-12">
                <h3 className="text-xl font-semibold mb-2">No events yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first event to get started planning your perfect occasion.
                </p>
                <Link to="/events/create" className="btn-primary inline-flex items-center">
                  <PlusIcon className="h-5 w-5 mr-1" />
                  Create Event
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div key={event._id} className="card">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{event.name}</h3>
                        <p className="text-gray-600 text-sm">
                          {new Date(event.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          new Date(event.date) > new Date()
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {new Date(event.date) > new Date() ? "Upcoming" : "Past"}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-2">{event.description}</p>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{event.vendors?.length || 0} vendors</span>
                      <Link to={`/events/${event._id}/edit`} className="btn-outline text-sm py-1">
                        Manage Event
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Bookings */}
          <div id="bookings">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Recent Bookings</h2>
              <Link to="/vendors" className="text-indigo-600 hover:text-indigo-800 font-medium">
                Find more vendors
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="card text-center py-12">
                <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-6">
                  Browse our vendor listings to find and book the perfect vendors for your events.
                </p>
                <Link to="/vendors" className="btn-primary">
                  Find Vendors
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Vendor</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Event</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Date</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Status</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking._id}>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <img
                              src={booking.vendor.profileImage || "/placeholder.svg?height=40&width=40"}
                              alt={booking.vendor.name}
                              className="h-10 w-10 rounded-full mr-3 object-cover"
                            />
                            <div>
                              <p className="font-medium">{booking.vendor.name}</p>
                              <p className="text-sm text-gray-500">{booking.vendor.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium">{booking.event.name}</p>
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
                            to={`/vendors/${booking.vendor._id}`}
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
          
          {/* Available Vendors Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Available Vendors</h2>
              <Link to="/vendors" className="text-indigo-600 hover:text-indigo-800 font-medium">
                View all vendors
              </Link>
            </div>
            
            {vendors.length === 0 ? (
              <div className="card text-center py-12">
                <h3 className="text-xl font-semibold mb-2">No vendors available</h3>
                <p className="text-gray-600 mb-6">
                  Check back later for new vendor listings.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.slice(0, 6).map((vendor) => (
                  <div key={vendor._id} className="card">
                    <div className="flex items-center mb-4">
                      <img
                        src={vendor.profileImage || "/placeholder.svg?height=80&width=80"}
                        alt={vendor.name}
                        className="h-16 w-16 rounded-full mr-4 object-cover"
                      />
                      <div>
                        <h3 className="text-lg font-semibold">{vendor.name}</h3>
                        <p className="text-gray-600 text-sm">{vendor.category}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4 line-clamp-2">{vendor.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{vendor.location}</span>
                      <Link to={`/vendors/${vendor._id}`} className="btn-outline text-sm py-1">
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Dashboard
