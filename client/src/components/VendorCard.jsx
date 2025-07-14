import { Link } from "react-router-dom"
import { StarIcon, MapPinIcon } from "@heroicons/react/24/solid"

const VendorCard = ({ vendor }) => {
  return (
    <Link to={`/vendors/${vendor.id}`} className="card hover:shadow-lg transition-shadow overflow-hidden group">
      <div className="relative h-48 mb-4 overflow-hidden rounded-md">
        <img
          src={vendor.image || "/placeholder.svg"}
          alt={vendor.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-md text-xs font-medium text-gray-700">
          {vendor.category}
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-1 group-hover:text-indigo-600 transition-colors">{vendor.name}</h3>
      <div className="flex items-center mb-2">
        <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
        <span className="text-sm font-medium">{vendor.rating}</span>
      </div>
      <div className="flex items-center text-gray-500 text-sm">
        <MapPinIcon className="h-4 w-4 mr-1" />
        <span>{vendor.location}</span>
      </div>
    </Link>
  )
}

export default VendorCard
