🛒 Crowded Fashion – Full Stack E-commerce App

A full-stack e-commerce web application built using Node.js, Express, MongoDB, Passport.js, and Razorpay (Test Mode).

This project demonstrates real-world backend architecture including authentication, cart management, checkout flow, and payment integration.

🚀 Features
🔐 Authentication System
User Registration with OTP verification
Secure Login using Passport.js
Session-based authentication
Protected routes

🛍️ Product Management
Product listing with category filtering
Dynamic product details page
Clean UI with responsive design

🛒 Cart System (Database-Based)
Add to cart (persistent using MongoDB)
Update quantity logic
Remove items from cart
Cart state maintained per user

💳 Checkout & Orders
Address-based checkout system
Order creation with full cart snapshot
Cart auto-cleared after order placement
Order history page

💰 Payment Integration
Razorpay Test Mode integration
Secure payment flow
Order linked with payment status

🏗️ Tech Stack
Layer	Technology
Frontend	EJS, HTML, CSS
Backend	Node.js, Express.js
Database	MongoDB (Mongoose)
Auth	Passport.js
Payments	Razorpay (Test Mode)
Session	express-session + connect-mongo

📁 Project Structure
project-root/
│
├── config/
│   └── passport.js
│
├── models/
│   ├── cart.js
│   └── order.js
│
├── routes/
│   └── indexRoute.js
│
├── views/
│   ├── product.ejs
│   ├── product-details.ejs
│   ├── cart.ejs
│   ├── checkout.ejs
│   ├── orders.ejs
│   ├── login.ejs
│   └── register.ejs
│
├── data/
│   └── products.js
│
├── public/
│
├── index.js
└── .env

⚙️ Installation & Setup
1. Clone the repository
git clone https://github.com/Madhurjya216/crowded-fashion.git
cd crowded-fashion
2. Install dependencies
npm install
3. Setup environment variables

Create a .env file:
MONGO_URI=your_mongodb_connection
SESSION_SECRET=your_secret_key

RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

4. Run the app
npm start

Server runs on:
http://localhost:3000

🔄 Application Flow
User registers → OTP verification
Logs in → redirected to store
Browses products → views product details
Adds items to cart
Proceeds to checkout
Enters address → initiates payment
Payment successful → Order stored in DB
Cart cleared → User can view orders

💳 Razorpay Test Mode

Use test credentials:
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
OTP: 123456

🧠 Key Learning Outcomes
Session handling in Express
Authentication with Passport.js
MongoDB schem
a design (Cart, Order)
Payment gateway integration
MVC-based scalable backend structure

📌 Future Improvements
Order status tracking (Shipped, Delivered)
Admin dashboard
Inventory management
Stripe integration (multi-payment support)
JWT-based auth for scalability
UI upgrade with React / Next.js

🤝 Contributing
Pull requests are welcome. For major changes, open an issue first to discuss your approach.

📄 License
This project is open-source and available under the MIT License.