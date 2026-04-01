const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  items: [
    {
      productId: Number,
      name: String,
      price: Number,
      image: String,
      quantity: Number,
    },
  ],

  totalAmount: {
    type: Number,
    required: true,
  },

  address: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    enum: ["Pending", "Placed", "Shipped", "Delivered"],
    default: "Pending",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);