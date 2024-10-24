const { gql } = require('apollo-server-express');

const bookingTypeDef = gql`
  scalar DateTime

  enum PickupLocation {
    KOCHI
    THRISSUR
    ANGAMALY
  }

  enum DropoffLocation {
    KOCHI
    THRISSUR
    ANGAMALY
  }

  enum BookingStatus {
    PENDING
    CONFIRMED
    CANCELLED
    COMPLETED
  }

  enum Currency {
    INR
  }

  type RazorpayOrder {
    id: String!
    amount: Int!
    currency: Currency!
    receipt: String!
  }

    type RazorpayOrderResponse {
        id: String!
        amount: Int!
        currency: Currency!
        receipt: String!
    }

  type RazorpayPaymentVerification {
    success: Boolean!
    message: String!
  }

  type Booking {
    id: ID!
    customerId: Int!
    vehicleId: Int!
    pickupLocation: PickupLocation!
    dropoffLocation: DropoffLocation!
    pickupTime: DateTime!
    dropoffTime: DateTime!
    status: BookingStatus!
    totalPrice: Float!
    createdAt: DateTime!
    razorpayOrder: RazorpayOrder!
    vehicle: Vehicle!
    customer: Customer!
  }

  input RazorpayOrderInput {
    amount: Int!
    currency: Currency!
    receipt: String!
    notes: String
  }

  type Query {
    getAllBookings: [Booking!]
    getBookingById(id: ID!): Booking
  }

  type Mutation {
    createBooking(
      
      vehicleId: Int!
      pickupLocation: PickupLocation!
      dropoffLocation: DropoffLocation!
      pickupTime: DateTime!
      dropoffTime: DateTime!
      status: BookingStatus!
    ): Booking!

    cancelBooking(id: ID!): String!
    createRazorpayOrder(bookingId: ID!): RazorpayOrderResponse!
    verifyPayment(orderId: String!, paymentId: String!, signature: String!): RazorpayPaymentVerification!
  }
`;

module.exports = bookingTypeDef;
