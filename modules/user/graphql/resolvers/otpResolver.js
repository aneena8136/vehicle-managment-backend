const twilioClient = require('../../../../configs/twilioClient') // Import the correct Twilio client
const { PrismaClient } = require('@prisma/client');
const OTPController = require('../../controllers/OTPController');

const prisma = new PrismaClient();

const otpresolvers = {
    Mutation: {
        sendOTP: async (_, { phoneNumber }) => {
            return OTPController.sendOTP(phoneNumber);
          },
          verifyOTP: async (_, { phoneNumber, otp }) => {
            return OTPController.verifyOTP(phoneNumber, otp);
          },
    },
};

module.exports = otpresolvers;
