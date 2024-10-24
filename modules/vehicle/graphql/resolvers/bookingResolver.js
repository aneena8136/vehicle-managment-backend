const { AuthenticationError, UserInputError, ApolloError } = require('apollo-server-express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BookingController = require('../../controllers/BookingController');

const bookingResolver = {
  Query: {
    getAllBookings: async (_, __, { customerId }) => {


      return await prisma.booking.findMany({
        include: {
          vehicle: true,
          customer: true,
        },
      });
    },

    getBookingById: async (_, { id }, { customerId }) => {
      if (!customerId) {
        throw new AuthenticationError('You must be logged in to view this booking');
      }

      const bookingId = parseInt(id, 10); // Ensure this is an integer
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }, // Use bookingId here
        include: {
          vehicle: true,
          customer: true,
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      return booking;
    },

  },

  Mutation: {
    
    createBooking: async (_, { vehicleId, pickupLocation, dropoffLocation, pickupTime, dropoffTime, status }, { customerId }) => {
      return BookingController.createBooking({
        vehicleId,
        pickupLocation,
        dropoffLocation,
        pickupTime,
        dropoffTime,
        status,
        customerId,
      });
    },
  
  
  

    createRazorpayOrder: async (_, { bookingId }, { customerId }) => {
      return BookingController.createRazorpayOrder({ bookingId, customerId });
    },

  },
};

module.exports = bookingResolver;