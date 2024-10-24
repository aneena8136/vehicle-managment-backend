// services/razorpayService.js

const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// Create a new order
const createOrder = async (amount, currency, receipt) => {
  const options = {
    amount: amount * 100, // Amount in paise
    currency: currency,
    receipt: receipt,
    payment_capture: 1, // Automatically capture payment
  };

  console.log('Creating order with options:', options); // Log the options

  try {
    const order = await razorpayInstance.orders.create(options);
    console.log('Order created successfully:', order); // Log the order response
    return order; // Return the created order
  } catch (error) {
    console.error('Error creating order:', JSON.stringify(error, null, 2)); // Log complete error object
    throw new ApolloError('Failed to create Razorpay order', 'RAZORPAY_ORDER_CREATION_ERROR');
  }
};

// Verify payment signature
const verifyPayment = (orderId, paymentId, signature) => {
  const crypto = require('crypto');
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(orderId + '|' + paymentId)
    .digest('hex');

  return generatedSignature === signature;
};

module.exports = { createOrder, verifyPayment };
