import { useState, useEffect, useRef } from "react"
import { toast } from "react-hot-toast"
import API from "../../api/axios"
import { useAuth } from "../../context/AuthContext"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import LoadingSpinner from "../../components/LoadingSpinner"
import { PencilIcon } from "@heroicons/react/24/outline"

const ClientProfile = () => {
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    about: "",
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await API.get("/api/client/profile")
        setFormData({
          name: response.data.name || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
          location: response.data.location || "",
          about: response.data.about || "",
        })
      } catch (err) {
        console.error("Error fetching client profile:", err)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await API.put("/api/client/profile", formData)
      updateProfile(response.data)
      toast.success("Profile updated successfully!")
    } catch (err) {
      console.error("Error updating client profile:", err)
      toast.error(err.response?.data?.message || "Failed to update profile.")
    } finally {
      setSaving(false)
    }
  }

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingImage(true)

    try {
      const uploadData = new FormData()
      uploadData.append("image", file)

      const response = await API.post("/api/uploads/profile-image", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      updateProfile({ profileImage: response.data.profileImage })
      toast.success("Profile image updated successfully!")
    } catch (err) {
      console.error("Error uploading profile image:", err)
      toast.error(err.response?.data?.message || "Failed to upload profile image.")
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
          <h1 className="text-3xl font-bold mb-6">My Profile</h1>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Sidebar */}
            <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
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
              <p className="text-gray-600">{user?.email}</p>

              <div className="mt-6 w-full">
                <h3 className="text-lg font-semibold mb-4">Account Info</h3>
                <p className="text-sm text-gray-500">
                  Member Since: {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">Account Type: {user?.role}</p>
              </div>
            </div>

            {/* Profile Edit Form */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <form onSubmit={handleSubmit}>
                <h2 className="text-xl font-semibold mb-6">Edit Information</h2>

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
                      Email
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
                    <label htmlFor="phone" className="label">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      className="input"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. +91 9876543210"
                    />
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
                  <label htmlFor="about" className="label">
                    About Me
                  </label>
                  <textarea
                    id="about"
                    name="about"
                    rows="4"
                    className="input"
                    value={formData.about}
                    onChange={handleChange}
                    placeholder="Tell vendors a bit about yourself and the type of events you host"
                  ></textarea>
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

      <Footer />
    </div>
  )
}

export default ClientProfile
