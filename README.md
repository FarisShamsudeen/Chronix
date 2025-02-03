# Chronix - Luxurious Watch E-commerce Website ⌚

## Overview
Chronix is a full-featured **e-commerce platform** built with the **MERN stack**, designed for purchasing luxurious watches. It provides a seamless shopping experience with secure authentication, dynamic product management, and an intuitive user interface.

## Features 🚀
- 🔑 **User Authentication**: Sign up/Login with **Google OAuth & OTP verification**
- 🛍️ **Product Management**: Browse, filter, and explore watches in detail
- ❤️ **Wishlist & Cart**: Save favorite watches and manage purchases easily
- 💳 **Payment Integration**: Supports **PayPal & Cash on Delivery (COD)**
- 📦 **Order System**: Place, track, and manage orders with real-time updates
- 📄 **Invoice Generation**: Download invoices in **PDF & image formats**
- 📊 **Admin Dashboard**: Manage users, orders, products, coupons, and offers
- 🔄 **Order Cancellation**: Update delivery status and cancel orders with stock adjustment
- 🔐 **Secure Sessions**: Session handling with **JWT & Express-session**

## Tech Stack 🛠️
- **Frontend**: React.js (planned for future versions)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ORM
- **Authentication**: Passport.js (Google OAuth), Bcrypt (Password hashing)
- **Payments**: PayPal API Integration
- **File Uploads**: Multer & Sharp (for image handling)
- **PDF & Image Generation**: pdfmake, html-pdf-node, html-to-image

## Installation & Setup 🔧
### 1️⃣ Clone the repository:
```bash
git clone https://github.com/FarisShamsudeen/Chronix.git
cd Chronix
```

### 2️⃣ Install dependencies:
```bash
npm install
```

### 3️⃣ Create a `.env` file:
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

### 4️⃣ Start the server:
```bash
npm start
```

## Future Plans 🚧
- 🌐 **Hosting Chronix online** for public access
- 🎨 **Frontend migration to React.js** for a better UI/UX
- 📦 **More payment options** (Razorpay, Stripe, etc.)
- 📊 **Advanced analytics** for admin insights

## Contributions 🤝
Want to contribute? Feel free to **fork** this repo and submit a **pull request**! 

## License 📜
This project is licensed under the **MIT License**.

---
💡 **Let's connect on LinkedIn!** [@FarisShamsudeen](https://www.linkedin.com/in/farisshamsudeen/)
