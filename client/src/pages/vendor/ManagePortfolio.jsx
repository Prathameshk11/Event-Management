"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { toast } from "react-hot-toast"
import { TrashIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline"
import axios from "axios"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import LoadingSpinner from "../../components/LoadingSpinner"

const ManagePortfolio = () => {
  const [portfolio, setPortfolio] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await axios.get("/api/vendor/portfolio")
        setPortfolio(response.data)
      } catch (err) {
        console.error("Error fetching portfolio:", err)
        setError("Failed to load portfolio. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolio()
  }, [])

  const handleFileChange = async (e) => {
    const files = e.target.files
    if (files.length === 0) return

    await uploadFiles(files)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFiles(e.dataTransfer.files)
    }
  }

  const uploadFiles = async (files) => {
    setUploading(true)

    try {
      const formData = new FormData()

      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i])
      }

      const response = await axios.post("/api/vendor/portfolio", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setPortfolio((prev) => [...prev, ...response.data])
      toast.success(`${files.length} image${files.length > 1 ? "s" : ""} uploaded successfully!`)
    } catch (err) {
      console.error("Error uploading images:", err)
      toast.error(err.response?.data?.message || "Failed to upload images. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const deleteImage = async (imageId) => {
    try {
      // Fixed: Use the correct endpoint and handle the response properly
      await axios.delete(`/api/vendor/portfolio/${imageId}`)

      // Update the portfolio state after successful deletion
      setPortfolio((prev) => prev.filter((img) => img._id !== imageId))
      toast.success("Image deleted successfully!")
    } catch (err) {
      console.error("Error deleting image:", err)
      toast.error(err.response?.data?.message || "Failed to delete image. Please try again.")
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-grow bg-gray-50 py-8">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Manage Portfolio</h1>
            <div className="flex space-x-4">
              <Link to="/vendor/profile" className="btn-outline">
                Edit Profile
              </Link>
              <Link to="/vendor" className="btn-outline">
                Back to Dashboard
              </Link>
            </div>
          </div>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 mb-8 text-center ${dragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300"
              }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <ArrowUpTrayIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />

            <h2 className="text-xl font-semibold mb-2">Upload Portfolio Images</h2>
            <p className="text-gray-500 mb-6">Drag and drop your images here, or click to browse</p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="hidden"
            />

            <button className="btn-primary" onClick={() => fileInputRef.current.click()} disabled={uploading}>
              {uploading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Uploading...
                </span>
              ) : (
                "Select Images"
              )}
            </button>

            <p className="text-xs text-gray-500 mt-4">Supported formats: JPG, PNG, GIF. Max file size: 5MB.</p>
          </div>

          {/* Portfolio Gallery */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Portfolio</h2>

            {portfolio.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">No images in your portfolio</h3>
                <p className="text-gray-600 mb-6">Upload images to showcase your work to potential clients.</p>
                <button className="btn-primary" onClick={() => fileInputRef.current.click()}>
                  Upload Your First Image
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {portfolio.map((image) => (
                  <div key={image._id} className="group relative bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt="Portfolio"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-all duration-300 flex items-center justify-center">
                      <button
                        className="bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                        onClick={() => deleteImage(image._id)}
                        title="Delete Image"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
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

export default ManagePortfolio
