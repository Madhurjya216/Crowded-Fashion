// routes/indexRoute.js
const express = require("express");
const router = express.Router();
const passport = require("passport");
const { registerUser, generateAndSendOTP } = require("../config/passport");
const { isAuthenticated } = require("../config/passport");
const products = require("../data/products");
const Cart = require("../models/cart");
const Order = require("../models/order");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Login form page
router.get("/login", (req, res) => {
  // If already logged in, redirect to dashboard
  if (req.isAuthenticated()) {
    return res.redirect("/home");
  }
  res.render("login", { error: null });
});

// Register form page
router.get("/", (req, res) => {
  // If already logged in, redirect to dashboard
  if (req.isAuthenticated()) {
    return res.redirect("/home");
  }
  res.render("register", { error: null });
});

router.get("/home", (req, res) => {
  return res.render("home", { user: req.user });
});

// contact page
router.get("/contact", (req, res) => {
  return res.render("contact", { user: req.user });
});

// Handle user registration
router.post("/", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const result = await registerUser(name, email, password);

    if (result.error) {
      return res.status(400).render("register", { error: result.error });
    }

    req.session.email = email;
    await generateAndSendOTP(email);

    // IMPORTANT: Save session before redirect
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).render("register", { error: "Session error" });
      }
      res.redirect("/verify-otp");
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).render("register", { error: "Server error" });
  }
});

// Handle login - FIXED VERSION
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Login error:", err);
      return next(err);
    }

    if (!user) {
      return res.render("login", {
        error: info.message || "Invalid credentials",
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      req.session.email = user.email;
      generateAndSendOTP(user.email);

      // Save session before redirect
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return next(err);
        }
        return res.redirect("/verify-otp");
      });
      return;
    }

    // CRITICAL: Log the user in with Passport
    req.login(user, (err) => {
      if (err) {
        console.error("req.login error:", err);
        return next(err);
      }

      // IMPORTANT: Save session after login
      req.session.save((err) => {
        if (err) {
          console.error("Session save error after login:", err);
          return next(err);
        }

        console.log("✅ Login successful, redirecting to dashboard");

        return res.redirect("/home");
      });
    });
  })(req, res, next);
});

// OTP verification page
router.get("/verify-otp", (req, res) => {
  if (!req.session.email) {
    return res.redirect("/login");
  }
  res.render("verify-otp", { email: req.session.email, error: null });
});

// Handle OTP verification
router.post("/verify-otp", (req, res, next) => {
  if (!req.session.email) {
    return res.redirect("/login");
  }

  req.body.email = req.session.email;

  passport.authenticate("otp-verify", (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      return res.render("verify-otp", {
        email: req.session.email,
        error: info.message || "Invalid or expired OTP",
      });
    }

    user.isVerified = true;
    user
      .save()
      .then(() => {
        req.login(user, (err) => {
          if (err) return next(err);

          delete req.session.email;

          // Save session after login
          req.session.save((err) => {
            if (err) return next(err);
            return res.redirect("/home");
          });
        });
      })
      .catch((err) => {
        console.error("Error saving user verification:", err);
        return next(err);
      });
  })(req, res, next);
});

// Resend OTP
router.post("/resend-otp", async (req, res, next) => {
  if (!req.session.email) {
    return res.redirect("/login");
  }

  try {
    await generateAndSendOTP(req.session.email);
    res.redirect("/verify-otp");
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.render("verify-otp", {
      email: req.session.email,
      error: "Failed to send OTP. Please try again.",
    });
  }
});

// Product Page
// STORE HOME (E-COMMERCE PAGE)
router.get("/store", isAuthenticated, (req, res) => {
  const { category } = req.query;

  const categories = ["all", ...new Set(products.map(p => p.category))];

  const filteredProducts =
    category && category !== "all"
      ? products.filter(p => p.category === category)
      : products;

  res.render("product", {
    user: req.user || null,
    products: filteredProducts,
    categories,
    selectedCategory: category || "all",
  });
});

// PRODUCT DETAILS PAGE
router.get("/store/:id", (req, res) => {
  const productId = parseInt(req.params.id);

  const product = products.find(p => p.id === productId);

  if (!product) {
    return res.status(404).send("Product not found");
  }

  res.render("product-details", {
    user: req.user || null,
    product,
  });
});


// Add to Cart Route
router.post("/cart/add/:id", isAuthenticated, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    const product = products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: [],
      });
    }

    const existingItem = cart.items.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
      });
    }

    await cart.save();

    res.json({ success: true, message: "Added to cart" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Displaying cart
router.get("/cart", isAuthenticated, async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  res.render("cart", {
    cart: cart || { items: [] },
  });
});

// remove from cart
router.post("/cart/remove/:id", isAuthenticated, async (req, res) => {
  const productId = parseInt(req.params.id);

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) return res.redirect("/cart");

  cart.items = cart.items.filter(item => item.productId !== productId);

  await cart.save();

  res.redirect("/cart");
});


// checkout code
router.get("/checkout", isAuthenticated, async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart || cart.items.length === 0) {
    return res.redirect("/cart");
  }

  const total = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  res.render("checkout", {
    cart,
    total,
  });
});



//  checkout post code
router.post("/create-order", isAuthenticated, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const options = {
      amount: total * 100, // Razorpay works in paisa
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: total,
      key: process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.get("/orders", isAuthenticated, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

  res.render("orders", { orders });
});



router.post("/verify-payment", isAuthenticated, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      address,
    } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false });
    }

    // ✅ Payment verified → now create order
    const cart = await Cart.findOne({ user: req.user._id });

    const total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = new Order({
      user: req.user._id,
      items: cart.items,
      totalAmount: total,
      address,
      status: "Placed",
    });

    await order.save();

    // Clear cart
    cart.items = [];
    await cart.save();

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// Logout Route
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
      }
      res.redirect("/login");
    });
  });
});

module.exports = router;
