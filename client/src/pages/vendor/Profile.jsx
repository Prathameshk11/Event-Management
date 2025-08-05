"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-hot-toast"
import { PencilIcon } from "@heroicons/react/24/outline"
import API from "../../api/axios"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import LoadingSpinner from "../../components/LoadingSpinner"

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    description: "",
    location: "",
    services: [],
    priceRange: 0,
    packages: [],
  })

  const [newService, setNewService] = useState("")
  const [newPackage, setNewPackage] = useState({
    name: "",
    price: "",
    description: "",
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await API.get("/api/vendor/profile")

        setFormData({
          name: response.data.name || "",
          email: response.data.email || "",
          category: response.data.category || "",
          description: response.data.description || "",
          location: response.data.location || "",
          services: response.data.services || [],
          priceRange: response.data.priceRange || 0,
          packages: response.data.packages || [],
        })
      } catch (err) {
        console.error("Error fetching profile:", err)
        setError("Failed to load profile. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddService = () => {
    if (!newService.trim()) return
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, newService],
    }))
    setNewService("")
  }

  const handleRemoveService = (index) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }))
  }

  const handleAddPackage = () => {
    if (!newPackage.name || !newPackage.price) return

    setFormData((prev) => ({
      ...prev,
      packages: [...prev.packages, newPackage],
    }))

    setNewPackage({
      name: "",
      price: "",
      description: "",
    })
  }

  const handleRemovePackage = (index) => {
    setFormData((prev) => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index),
    }))
  }

  const handlePackageChange = (e) => {
    const { name, value } = e.target
    setNewPackage((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await API.put("/api/vendor/profile", formData)

      // Update auth context with new user data
      updateProfile(response.data)

      toast.success("Profile updated successfully!")
    } catch (err) {
      console.error("Error updating profile:", err)
      toast.error(err.response?.data?.message || "Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await API.post("/api/uploads/profile-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      // Update auth context with new profile image
      updateProfile({ profileImage: response.data.profileImage })

      toast.success("Profile image updated successfully!")
    } catch (err) {
      console.error("Error uploading profile image:", err)
      toast.error(err.response?.data?.message || "Failed to upload profile image. Please try again.")
    } finally {
      setUploadingImage(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-grow bg-gray-50 py-8">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Edit Profile</h1>
            <div className="flex space-x-4">
              <Link to="/vendor/portfolio" className="btn-outline">
                Manage Portfolio
              </Link>
              <Link to="/vendor" className="btn-outline">
                Back to Dashboard
              </Link>
            </div>
          </div>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Image and Basic Info */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-200">
                      <img
                        src={user?.profileImage || "/placeholder.svg?height=128&width=128"}
                        alt={user?.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button
                      className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700"
                      onClick={() => fileInputRef.current.click()}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <PencilIcon className="h-5 w-5" />
                      )}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleProfileImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  <h2 className="text-xl font-semibold">{user?.name}</h2>
                  <p className="text-gray-600">{user?.category}</p>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Profile Visibility</h3>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Profile Status</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Your profile is visible to clients searching for vendors.
                  </p>

                  <h3 className="text-lg font-semibold mb-4">Account Info</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-500 text-sm">Member Since</span>
                      <p>{new Date(user?.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Account Type</span>
                      <p className="capitalize">{user?.role}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Rating & Reviews</h3>
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`h-5 w-5 ${star <= (user?.rating || 0) ? "text-yellow-500" : "text-gray-300"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600">
                    {user?.rating || "0.0"} ({user?.reviewCount || 0} reviews)
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {user?.reviewCount
                    ? "Based on client reviews after completed bookings."
                    : "No reviews yet. Complete bookings to get reviews."}
                </p>
              </div>
            </div>

            {/* Profile Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <form onSubmit={handleSubmit}>
                  <h2 className="text-xl font-semibold mb-6">Basic Information</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="name" className="label">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="input"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="label">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="input"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="category" className="label">
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        className="input"
                        value={formData.category}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select a category</option>
                        <option value="Photographer">Photographer</option>
                        <option value="Venue">Venue</option>
                        <option value="Caterer">Caterer</option>
                        <option value="Florist">Florist</option>
                        <option value="Musician">Musician</option>
                        <option value="Event Planner">Event Planner</option>
                        <option value="Decorator">Decorator</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="location" className="label">
                        Location
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        className="input"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="City, State"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="description" className="label">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows="4"
                      className="input"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Tell clients about your services and experience"
                    ></textarea>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="priceRange" className="label">
                      Starting Price (₹{formData.priceRange.toLocaleString("en-IN")})
                    </label>

                    <input
                      type="range"
                      id="priceRange"
                      name="priceRange"
                      min="0"
                      max="10000"
                      step="100"
                      className="w-full"
                      value={formData.priceRange}
                      onChange={handleChange}
                    />
                  </div>

                  <h2 className="text-xl font-semibold mb-4">Services</h2>

                  <div className="mb-6">
                    <div className="flex mb-2">
                      <input
                        type="text"
                        className="input flex-grow"
                        placeholder="Add a service you offer"
                        value={newService}
                        onChange={(e) => setNewService(e.target.value)}
                      />
                      <button type="button" className="btn-primary ml-2" onClick={handleAddService}>
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.services.map((service, index) => (
                        <div
                          key={index}
                          className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm flex items-center"
                        >
                          {service}
                          <button
                            type="button"
                            className="ml-2 text-indigo-600 hover:text-indigo-800"
                            onClick={() => handleRemoveService(index)}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                      {formData.services.length === 0 && (
                        <p className="text-gray-500 text-sm">
                          No services added yet. Add services you offer to clients.
                        </p>
                      )}
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold mb-4">Packages</h2>

                  <div className="mb-6">
                    <div className="bg-gray-50 p-4 rounded-md mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label htmlFor="packageName" className="label">
                            Package Name
                          </label>
                          <input
                            type="text"
                            id="packageName"
                            name="name"
                            className="input"
                            placeholder="e.g. Basic Package"
                            value={newPackage.name}
                            onChange={handlePackageChange}
                          />
                        </div>

                        <div>
                          <label htmlFor="packagePrice" className="label">
                            Price (₹)
                          </label>
                          <input
                            type="number"
                            id="packagePrice"
                            name="price"
                            className="input"
                            placeholder="e.g. 1000"
                            value={newPackage.price}
                            onChange={handlePackageChange}
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label htmlFor="packageDescription" className="label">
                          Description
                        </label>
                        <textarea
                          id="packageDescription"
                          name="description"
                          rows="2"
                          className="input"
                          placeholder="Describe what's included in this package"
                          value={newPackage.description}
                          onChange={handlePackageChange}
                        ></textarea>
                      </div>

                      <button type="button" className="btn-primary w-full" onClick={handleAddPackage}>
                        Add Package
                      </button>
                    </div>

                    {formData.packages.length > 0 ? (
                      <div className="space-y-4">
                        {formData.packages.map((pkg, index) => (
                          <div key={index} className="border border-gray-200 rounded-md p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-semibold">{pkg.name}</h3>
                              <div className="flex items-center">
                                <span className="font-bold">₹{pkg.price}</span>
                                <button
                                  type="button"
                                  className="ml-4 text-red-600 hover:text-red-800"
                                  onClick={() => handleRemovePackage(index)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm">{pkg.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No packages added yet. Create packages to offer to clients.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Profile
