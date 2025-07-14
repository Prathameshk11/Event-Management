"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-hot-toast"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import API from "../../api/axios"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import LoadingSpinner from "../../components/LoadingSpinner"

const ManageAvailability = () => {
  const [availability, setAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [isAvailable, setIsAvailable] = useState(true)
  const [timeSlots, setTimeSlots] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const response = await API.get("/api/vendor/availability")
        setAvailability(response.data)
      } catch (err) {
        console.error("Error fetching availability:", err)
        setError("Failed to load availability. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [])

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleDateClick = (date) => {
    setSelectedDate(date)

    // Check if date is already in availability
    const existingDate = availability.find((a) => new Date(a.date).toDateString() === date.toDateString())

    if (existingDate) {
      setIsAvailable(existingDate.available)
      setTimeSlots(existingDate.timeSlots || [])
    } else {
      setIsAvailable(true)
      setTimeSlots([])
    }

    setShowModal(true)
  }

  const handleAddTimeSlot = () => {
    setTimeSlots([...timeSlots, { start: "09:00", end: "17:00" }])
  }

  const handleRemoveTimeSlot = (index) => {
    const newTimeSlots = [...timeSlots]
    newTimeSlots.splice(index, 1)
    setTimeSlots(newTimeSlots)
  }

  const handleTimeSlotChange = (index, field, value) => {
    const newTimeSlots = [...timeSlots]
    newTimeSlots[index][field] = value
    setTimeSlots(newTimeSlots)
  }

  const handleSaveAvailability = async () => {
    if (!selectedDate) return

    setSaving(true)

    try {
      const dateString = selectedDate.toISOString().split("T")[0]

      const response = await API.post("/api/vendor/availability", {
        date: dateString,
        available: isAvailable,
        timeSlots: isAvailable ? timeSlots : [],
      })

      // Update local state
      const newAvailability = [...availability]
      const existingIndex = newAvailability.findIndex(
        (a) => new Date(a.date).toDateString() === selectedDate.toDateString(),
      )

      if (existingIndex >= 0) {
        newAvailability[existingIndex] = response.data
      } else {
        newAvailability.push(response.data)
      }

      setAvailability(newAvailability)
      setShowModal(false)
      toast.success("Availability updated successfully!")
    } catch (err) {
      console.error("Error updating availability:", err)
      toast.error(err.response?.data?.message || "Failed to update availability. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const renderCalendar = () => {
    const month = currentMonth.getMonth()
    const year = currentMonth.getFullYear()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200"></div>)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateString = date.toISOString().split("T")[0]

      // Check if this date is in our availability array
      const dateAvailability = availability.find((a) => new Date(a.date).toDateString() === date.toDateString())

      const isAvailable = dateAvailability?.available
      const hasTimeSlots = dateAvailability?.timeSlots?.length > 0

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 ${
            isAvailable ? "bg-green-50" : dateAvailability ? "bg-red-50" : ""
          }`}
          onClick={() => handleDateClick(date)}
        >
          <div className="flex justify-between items-start">
            <span className={`font-medium ${isAvailable ? "text-green-700" : dateAvailability ? "text-red-700" : ""}`}>
              {day}
            </span>

            {dateAvailability && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {isAvailable ? "Available" : "Unavailable"}
              </span>
            )}
          </div>

          {hasTimeSlots && (
            <div className="mt-1 text-xs">
              {dateAvailability.timeSlots.map((slot, index) => (
                <div key={index} className="text-gray-600">
                  {slot.start} - {slot.end}
                </div>
              ))}
            </div>
          )}
        </div>,
      )
    }

    return days
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-grow bg-gray-50 py-8">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Manage Availability</h1>
            <Link to="/vendor" className="btn-outline">
              Back to Dashboard
            </Link>
          </div>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

          {/* Calendar Controls */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100">
                <ChevronLeftIcon className="h-5 w-5" />
              </button>

              <h2 className="text-xl font-bold">
                {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h2>

              <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100">
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Calendar Legend */}
            <div className="flex items-center space-x-4 mb-4 text-sm">
              <div className="flex items-center">
                <div className="h-4 w-4 bg-green-50 border border-gray-200 mr-2"></div>
                <span>Available</span>
              </div>

              <div className="flex items-center">
                <div className="h-4 w-4 bg-red-50 border border-gray-200 mr-2"></div>
                <span>Unavailable</span>
              </div>

              <div className="flex items-center">
                <div className="h-4 w-4 bg-white border border-gray-200 mr-2"></div>
                <span>Not Set</span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="h-10 flex items-center justify-center font-medium text-gray-500">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {renderCalendar()}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Managing Your Availability</h2>
            <p className="text-gray-600 mb-4">
              Click on any date to set your availability. You can mark dates as available or unavailable, and add
              specific time slots for available dates.
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Green dates indicate you're available for bookings</li>
              <li>Red dates indicate you're unavailable</li>
              <li>White dates haven't been set yet (clients will assume you're unavailable)</li>
              <li>You can add multiple time slots for each available date</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Date Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h3>

            <div className="mb-4">
              <label className="flex items-center">
                <input type="radio" checked={isAvailable} onChange={() => setIsAvailable(true)} className="mr-2" />
                <span>Available</span>
              </label>

              <label className="flex items-center mt-2">
                <input type="radio" checked={!isAvailable} onChange={() => setIsAvailable(false)} className="mr-2" />
                <span>Unavailable</span>
              </label>
            </div>

            {isAvailable && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Time Slots</h4>
                  <button
                    type="button"
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                    onClick={handleAddTimeSlot}
                  >
                    + Add Time Slot
                  </button>
                </div>

                {timeSlots.length === 0 ? (
                  <p className="text-sm text-gray-500 mb-2">No time slots added. Add one to specify available hours.</p>
                ) : (
                  <div className="space-y-3">
                    {timeSlots.map((slot, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <select
                          className="input flex-1"
                          value={slot.start}
                          onChange={(e) => handleTimeSlotChange(index, "start", e.target.value)}
                        >
                          {Array.from({ length: 24 }).map((_, i) => (
                            <option key={i} value={`${i.toString().padStart(2, "0")}:00`}>
                              {`${i.toString().padStart(2, "0")}:00`}
                            </option>
                          ))}
                        </select>

                        <span>to</span>

                        <select
                          className="input flex-1"
                          value={slot.end}
                          onChange={(e) => handleTimeSlotChange(index, "end", e.target.value)}
                        >
                          {Array.from({ length: 24 }).map((_, i) => (
                            <option key={i} value={`${i.toString().padStart(2, "0")}:00`}>
                              {`${i.toString().padStart(2, "0")}:00`}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleRemoveTimeSlot(index)}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button className="btn-outline" onClick={() => setShowModal(false)} disabled={saving}>
                Cancel
              </button>

              <button className="btn-primary" onClick={handleSaveAvailability} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default ManageAvailability
