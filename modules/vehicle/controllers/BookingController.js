const { AuthenticationError, UserInputError, ApolloError } = require('apollo-server-express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createOrder } = require('../../../configs/razorpay');

class BookingController {
  static async createBooking({ vehicleId, pickupLocation, dropoffLocation, pickupTime, dropoffTime, status, customerId }) {
    console.log('Received booking request:', { vehicleId, customerId, pickupLocation, dropoffLocation, pickupTime, dropoffTime, status });
    
    if (!customerId) {
      throw new AuthenticationError('You must be logged in to make a booking');
    }

    const pickupDate = new Date(pickupTime);
    const dropoffDate = new Date(dropoffTime);
    
    if (pickupDate >= dropoffDate) {
      throw new UserInputError('Dropoff time must be later than pickup time');
    }

    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle) {
        throw new UserInputError('Vehicle not found');
      }

      // Check for existing bookings that overlap with the new booking
      const existingBookings = await prisma.booking.findMany({
        where: {
          vehicleId: vehicleId,
          AND: [
            {
              pickupTime: { lt: dropoffDate },
            },
            {
              dropoffTime: { gt: pickupDate },
            },
          ],
        },
      });

      // Calculate available quantity for each day of the booking period
      const availabilityMap = new Map();
      const currentDate = new Date(pickupDate);
      
      while (currentDate <= dropoffDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        const bookedQty = existingBookings.filter(booking => 
          new Date(booking.pickupTime) <= currentDate && new Date(booking.dropoffTime) > currentDate
        ).length;
        availabilityMap.set(dateString, vehicle.availableQty - bookedQty);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Check if there's at least one vehicle available for the entire booking period
      const isAvailable = Array.from(availabilityMap.values()).every(qty => qty > 0);
      
      if (!isAvailable) {
        throw new UserInputError('Vehicle is not available for the selected dates');
      }

      const oneDay = 24 * 60 * 60 * 1000;
      const totalDays = Math.ceil((dropoffDate - pickupDate) / oneDay);
      const totalPrice = totalDays * vehicle.price;
      console.log('Total price for booking:', totalPrice);

      // Proceed with booking
      const newBooking = await prisma.$transaction(async (prisma) => {
        const booking = await prisma.booking.create({
          data: {
            customer: { connect: { id: customerId } },
            vehicle: { connect: { id: vehicleId } },
            pickupLocation,
            dropoffLocation,
            pickupTime,
            dropoffTime,
            status,
            totalPrice,
          },
        });

        // Schedule a job to increase availableQty after dropoff
        await prisma.scheduledJob.create({
          data: {
            vehicleId: vehicleId,
            jobType: 'INCREASE_AVAILABLE_QTY',
            scheduledTime: dropoffDate,
          },
        });

        return booking;
      });

      console.log('Booking created:', newBooking);
      return newBooking;
    } catch (error) {
      console.error('Error in BookingController.createBooking:', error);
      if (error instanceof UserInputError || error instanceof AuthenticationError) {
        throw error;
      }
      throw new ApolloError('An error occurred while creating the booking', 'BOOKING_CREATION_ERROR');
    }
  }

  static async createRazorpayOrder({ bookingId, customerId }) {
    if (!customerId) {
      throw new AuthenticationError('You must be logged in to create a Razorpay order');
    }

    const parsedBookingId = parseInt(bookingId);

    try {
      const booking = await prisma.booking.findUnique({
        where: { id: parsedBookingId },
      });

      if (!booking) {
        throw new UserInputError('Booking not found');
      }

      if (booking.customerId !== customerId) {
        throw new AuthenticationError('You are not authorized to create an order for this booking');
      }

      console.log('Creating Razorpay order with totalPrice:', booking.totalPrice);

      // Create the Razorpay order
      const razorpayOrder = await createOrder(booking.totalPrice, 'INR', `receipt_${booking.id}`);

      if (!razorpayOrder) {
        throw new ApolloError('Failed to create Razorpay order', 'RAZORPAY_ORDER_CREATION_ERROR');
      }

      console.log('Razorpay order created:', razorpayOrder);

      return {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status,
      };
    } catch (error) {
      console.error('Error in PaymentController.createRazorpayOrder:', error);

      if (error instanceof UserInputError || error instanceof AuthenticationError) {
        throw error;
      }

      throw new ApolloError('An error occurred while creating the Razorpay order', 'RAZORPAY_ORDER_CREATION_ERROR');
    }
  }
}

module.exports = BookingController;
