"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { ChevronRightIcon, StarIcon, CheckCircleIcon } from "@heroicons/react/24/solid"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import CategoryCard from "../components/CategoryCard"
import VendorCard from "../components/VendorCard"

const categories = [
  { id: 1, name: "Photographers", icon: "📸", description: "Professional photographers for your special day" },
  { id: 2, name: "Venues", icon: "🏰", description: "Beautiful locations for any event" },
  { id: 3, name: "Caterers", icon: "🍽️", description: "Delicious food and beverage services" },
  { id: 4, name: "Florists", icon: "💐", description: "Stunning floral arrangements and decorations" },
  { id: 5, name: "Musicians", icon: "🎵", description: "Live music and entertainment" },
  { id: 6, name: "Event Planners", icon: "📋", description: "Professional planning and coordination" },
]

const featuredVendors = [
  {
    id: 1,
    name: "Elegant Captures",
    category: "Photographer",
    rating: 4.9,
    image: "/images/photographer.jpg",
    location: "New York, NY",
  },
  {
    id: 2,
    name: "Grand Plaza Hotel",
    category: "Venue",
    rating: 4.8,
    image: "/images/hotel-venue.jpg",
    location: "Los Angeles, CA",
  },
  {
    id: 3,
    name: "Gourmet Delights",
    category: "Caterer",
    rating: 4.7,
    image: "/images/caterer.jpg",
    location: "Chicago, IL",
  },
  {
    id: 4,
    name: "Blooming Beauty",
    category: "Florist",
    rating: 4.9,
    image: "/images/florist.jpg",
    location: "Miami, FL",
  },
]

const Landing = () => {
  const [email, setEmail] = useState("")

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white min-h-screen flex items-center">
        <div className="container-custom py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block bg-indigo-500/30 px-4 py-2 rounded-full text-sm font-medium mb-4">
                #1 Event Planning Platform
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Plan Your Perfect <span className="text-yellow-300">Event</span> with EventPro
              </h1>
              <p className="text-lg mb-8 text-indigo-100 max-w-lg">
                Connect with top vendors, manage your events, and create unforgettable experiences all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="btn-accent text-center py-3 px-6 text-lg font-medium">
                  Get Started
                </Link>
                <Link
                  to="/vendors"
                  className="bg-white text-indigo-700 hover:bg-indigo-50 font-medium py-3 px-6 rounded-md transition-colors text-center text-lg"
                >
                  Explore Vendors
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-8">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-indigo-300 flex items-center justify-center text-xs font-bold">
                      {i}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-indigo-200">
                  <span className="font-bold">1000+</span> happy clients
                </p>
              </div>
            </div>
            <div className="hidden md:block ">
              <img 
                src="/images/event-planner.png" 
                alt="Event Planning" 
                className="w-full max-w-2xl mx-auto object-contain" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Find the Perfect Vendors</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Discover a wide range of professional vendors to make your event special</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Vendors */}
      <section className="py-20">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Featured Vendors</h2>
              <p className="text-gray-600">Top-rated professionals ready for your event</p>
            </div>
            <Link to="/vendors" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
              View All <ChevronRightIcon className="w-5 h-5 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How EventPro Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Simple steps to create your perfect event</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "1",
                title: "Create Your Event",
                description: "Define your event details, date, and requirements to get started."
              },
              {
                number: "2",
                title: "Find Vendors",
                description: "Browse and connect with the perfect vendors for your event needs."
              },
              {
                number: "3",
                title: "Manage Everything",
                description: "Coordinate details, communicate with vendors, and track progress."
              }
            ].map((step, index) => (
              <div 
                key={index} 
                className="card text-center p-8 rounded-xl shadow"
              >
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 text-2xl font-bold">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-indigo-600 text-white">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Create Your Perfect Event?</h2>
            <p className="text-lg mb-8 text-indigo-100">
              Join thousands of clients and vendors who use EventPro to create unforgettable experiences.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register?role=client" className="btn-accent py-3 px-6 text-lg font-medium">
                Sign Up as Client
              </Link>
              <Link
                to="/register?role=vendor"
                className="bg-white text-indigo-700 hover:bg-indigo-50 font-medium py-3 px-6 rounded-md transition-colors text-lg"
              >
                Join as Vendor
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Clients Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Hear from people who've used EventPro for their special occasions</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Wedding Client",
                text: "EventPro made planning our wedding so much easier! We found amazing vendors and everything went perfectly."
              },
              {
                name: "Michael Chen",
                role: "Corporate Event Planner",
                text: "As a professional event planner, I love how EventPro streamlines vendor communication and management."
              },
              {
                name: "Emily Rodriguez",
                role: "Birthday Party Host",
                text: "I was able to find a great venue and caterer for my daughter's birthday party in just a few clicks!"
              }
            ].map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-white p-6 rounded-xl shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.text}"</p>
                <div className="flex mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon key={star} className="w-5 h-5 text-yellow-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      

      <Footer />
    </div>
  )
}

export default Landing
