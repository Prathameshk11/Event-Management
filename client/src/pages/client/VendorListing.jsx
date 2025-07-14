"use client"

import { useState, useEffect } from "react"
import { useLocation, Link } from "react-router-dom"
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, MapPinIcon, StarIcon } from "@heroicons/react/24/outline"
import axios from "axios"
import Navbar from "../../components/Navbar"
import Footer from "../../components/Footer"
import LoadingSpinner from "../../components/LoadingSpinner"

const VendorListing = () => {
  const location = useLocation()
  const [vendors, setVendors] = useState([])
  const [filteredVendors, setFilteredVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [priceRange, setPriceRange] = useState([0, 5000])
  const [showFilters, setShowFilters] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState({
    searchTerm: "",
    category: "",
    location: "",
    priceRange: [0, 5000]
  })

  // Category mapping for URL parameters
  const categoryMap = {
    'photographer': 'Photographer',
    'photographers': 'Photographer',
    'venue': 'Venue',
    'venues': 'Venue',
    'caterer': 'Caterer',
    'caterers': 'Caterer',
    'florist': 'Florist',
    'florists': 'Florist',
    'musician': 'Musician',
    'musicians': 'Musician',
    'event-planner': 'Event Planner',
    'event-planners': 'Event Planner',
    'decorator': 'Decorator',
    'decorators': 'Decorator',
    'transportation': 'Transportation'
  }

  const categories = [
    "All Categories",
    "Photographer",
    "Venue",
    "Caterer",
    "Florist",
    "Musician",
    "Event Planner",
    "Decorator",
    "Transportation",
  ]

  const locations = [
    "All Locations",
    "New York, NY",
    "Los Angeles, CA",
    "Chicago, IL",
    "Houston, TX",
    "Miami, FL",
    "Seattle, WA",
    "Boston, MA",
    "Denver, CO",
  ]

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        // Get category from URL if present
        const params = new URLSearchParams(location.search)
        const categoryParam = params.get("category")

        if (categoryParam) {
          const mappedCategory = categoryMap[categoryParam.toLowerCase()] || categoryParam
          setSelectedCategory(mappedCategory)
          setAppliedFilters(prev => ({ ...prev, category: mappedCategory }))
        }

        console.log("Fetching vendors...")
        const response = await axios.get("/api/vendors")
        console.log("Vendors fetched:", response.data.length)
        
        if (response.data && Array.isArray(response.data)) {
          if (response.data.length > 0) {
            console.log("Sample vendor data:", response.data[0])
          }
          
          setVendors(response.data)
          setFilteredVendors(response.data)
          setAppliedFilters({
            searchTerm: "",
            category: categoryParam ? (categoryMap[categoryParam.toLowerCase()] || categoryParam) : "",
            location: "",
            priceRange: [0, 5000]
          })
        } else {
          console.error("Invalid vendor data received:", response.data)
          setError("Invalid vendor data received from server")
        }
      } catch (err) {
        console.error("Error fetching vendors:", err)
        setError("Failed to load vendors. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [location])

  useEffect(() => {
    // If no filters are applied, show all vendors
    if (!appliedFilters.searchTerm && 
        (!appliedFilters.category || appliedFilters.category === "All Categories") && 
        (!appliedFilters.location || appliedFilters.location === "All Locations") && 
        appliedFilters.priceRange[0] === 0 && 
        appliedFilters.priceRange[1] === 5000) {
      console.log("No filters applied, showing all vendors:", vendors.length)
      setFilteredVendors(vendors)
      return
    }

    // Apply filters
    let results = [...vendors]
    console.log("Starting with all vendors:", results.length)
    console.log("Vendor categories:", results.map(v => v.category))
    console.log("Vendor locations:", results.map(v => v.location))

    // Search term filter
    if (appliedFilters.searchTerm) {
      const searchLower = appliedFilters.searchTerm.toLowerCase()
      results = results.filter(
        (vendor) =>
          vendor.name.toLowerCase().includes(searchLower) ||
          vendor.description.toLowerCase().includes(searchLower)
      )
      console.log("After search filter:", results.length)
    }

    // Category filter
    if (appliedFilters.category && appliedFilters.category !== "All Categories") {
      console.log("Filtering by category:", appliedFilters.category)
      results = results.filter(
        (vendor) => {
          const vendorCategory = vendor.category?.toLowerCase() || ""
          const filterCategory = appliedFilters.category.toLowerCase()
          const matches = vendorCategory === filterCategory
          console.log(`Vendor ${vendor.name} category: ${vendor.category}, matches: ${matches}`)
          return matches
        }
      )
      console.log("After category filter:", results.length)
    }

    // Location filter
    if (appliedFilters.location && appliedFilters.location !== "All Locations") {
      console.log("Filtering by location:", appliedFilters.location)
      results = results.filter(
        (vendor) => {
          const vendorLocation = vendor.location?.toLowerCase() || ""
          const filterLocation = appliedFilters.location.toLowerCase()
          const matches = vendorLocation === filterLocation
          console.log(`Vendor ${vendor.name} location: ${vendor.location}, matches: ${matches}`)
          return matches
        }
      )
      console.log("After location filter:", results.length)
    }

    // Price range filter
    results = results.filter((vendor) => {
      // Convert price indicators to numeric values
      const getPriceValue = (priceIndicator) => {
        switch(priceIndicator) {
          case '$': return 5000
          case '$$': return 10000
          case '$$$': return 15000
          case '$$$$': return 25000
          case '$$$$$': return 40000
          default: return 0
        }
      }
      
      const vendorPrice = getPriceValue(vendor.priceRange)
      const matches = vendorPrice >= appliedFilters.priceRange[0] && vendorPrice <= appliedFilters.priceRange[1]
      console.log(`Vendor ${vendor.name} price indicator: ${vendor.priceRange}, numeric value: ${vendorPrice}, matches: ${matches}`)
      return matches
    })
    console.log("After price filter:", results.length)

    console.log("Applied filters:", appliedFilters)
    console.log("Filtered vendors:", results.length)
    console.log("Filtered results:", results)
    setFilteredVendors(results)
  }, [vendors, appliedFilters])

  const applyFilters = () => {
    console.log("Applying filters:", {
      searchTerm,
      category: selectedCategory,
      location: selectedLocation,
      priceRange
    })
    setAppliedFilters({
      searchTerm,
      category: selectedCategory,
      location: selectedLocation,
      priceRange
    })
  }

  const resetFilters = () => {
    setSearchTerm("")
    setSelectedCategory("")
    setSelectedLocation("")
    setPriceRange([0, 5000])
    // Reset applied filters to show all vendors
    setAppliedFilters({
      searchTerm: "",
      category: "",
      location: "",
      priceRange: [0, 5000]
    })
    // Reset filtered vendors to show all vendors
    setFilteredVendors(vendors)
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    applyFilters()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-grow bg-gray-50 py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Find Vendors</h1>
            <p className="text-gray-600">Browse and filter vendors for your event</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow relative">
                  <input
                    type="text"
                    placeholder="Search vendors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
                <button
                  type="button"
                  onClick={toggleFilters}
                  className="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                  Filters
                </button>
              </div>
            </form>

            {/* Filters Panel */}
            {showFilters && (
              <div className="bg-white p-4 rounded-lg shadow mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {locations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Range: ${priceRange[0]} - ${priceRange[1]}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      step="100"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
          )}

          {/* Vendors Grid */}
          {filteredVendors.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No vendors found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or search criteria</p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map((vendor) => (
                <Link
                  key={vendor._id}
                  to={`/vendors/${vendor._id}`}
                  className="card hover:shadow-lg transition-shadow"
                >
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
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {vendor.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <StarIcon className="h-4 w-4 mr-1 text-yellow-500" />
                      {vendor.rating ? vendor.rating.toFixed(1) : "New"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default VendorListing

