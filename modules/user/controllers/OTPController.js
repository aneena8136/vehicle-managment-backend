const { PrismaClient } = require('@prisma/client');
const twilioClient = require('../../../configs/twilioClient'); // Import Twilio client

const prisma = new PrismaClient();


class OTPController {
  static async sendOTP(phoneNumber) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP

    try {
      // Send OTP using Twilio
      await twilioClient.messages.create({
        body: `Your OTP is ${otp}`,
        from: '+18649205618', // Your Twilio phone number
        to: phoneNumber, // User's phone number
      });

      // Save OTP to the database
      await prisma.oTP.create({
        data: {
          phoneNumber,
          otp,
        },
      });

      return true; // Return success after sending OTP and saving to DB
    } catch (error) {
      console.error("Error sending OTP via Twilio:", error);
      throw new Error("Failed to send OTP");
    }
  }

  static async verifyOTP(phoneNumber, otp) {
    try {
      // Find the OTP record by phone number
      const otpRecord = await prisma.oTP.findFirst({
        where: { phoneNumber },
        orderBy: { createdAt: 'desc' }, // Get the latest OTP record
      });

      if (!otpRecord) {
        return false; // No OTP found for the phone number
      }

      // Check if the OTP has expired (e.g., after 5 minutes)
      const isExpired = new Date() > new Date(otpRecord.createdAt.getTime() + 5 * 60 * 1000);
      if (isExpired) {
        await prisma.oTP.delete({ where: { id: otpRecord.id } }); // Remove expired OTP
        return false;
      }

      // Compare the provided OTP with the stored one
      const isValid = otpRecord.otp === otp;

      if (isValid) {
        await prisma.oTP.delete({ where: { id: otpRecord.id } }); // Remove OTP after successful verification
      }

      return isValid;
    } catch (error) {
      console.error("Error verifying OTP:", error);
      throw new Error("Failed to verify OTP");
    }
  }
}

module.exports = OTPController;
