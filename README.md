# EventPro

EventPro is a powerful event management and vendor booking platform built with the MERN (MongoDB, Express, React, Node.js) stack. It allows clients to create and manage events, find and book vendors, chat in real time, and monitor all bookings and communications through modern dashboards.

## 🚀 Features

### Authentication & Authorization
- Secure JWT-based authentication
- Clients and vendors each have dedicated registration & login

### Event Management (for Clients)
- Create, edit, and delete events
- Manage vendors per event
- View event and vendor details

### Vendor Management
- Browse/search vendors by category, location, keyword
- View vendor portfolios, ratings, reviews, and availability

### Booking System
- Book vendors for events; track booking status (pending, confirmed, declined, completed)
- Vendors can manage bookings and update statuses
- Real-time updates with Socket.IO

### Messaging
- Real-time client↔vendor chat
- Chat history, notification indicators, and Socket.IO integration

### Vendor Tools
- Portfolio image management via Cloudinary
- Set & edit availability for dates/time slots
- Dashboard analytics (bookings, income, unread messages, profile views)

### Notifications
- Real-time and persistent notifications for bookings, messages, updates

## 🛠️ Tech Stack

| Component    | Technologies                                 |
|--------------|----------------------------------------------|
| Backend      | Node.js, Express, MongoDB, Mongoose          |
| Frontend     | React, React Router, Context API             |
| Realtime     | Socket.IO                                    |
| File Upload  | Multer, Cloudinary                           |
| Auth         | JWT                                          |
| Styling      | TailwindCSS / CSS Modules                    |
| Dev Tools    | Dotenv (env config)                          |

---

## 🌐 Live Demo
**Live link** → https://event-management-livid-iota.vercel.app/  


---

## 💡 Future Improvements
- Integrate **payment gateways (Razorpay/Stripe)** for vendor booking payments.
- **Email notifications** (via Nodemailer) for booking confirmations.
- Implement **admin dashboard** for platform-level analytics.

