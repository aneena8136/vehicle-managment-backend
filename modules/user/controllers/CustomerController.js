const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ValidationError } = require('apollo-server-express');
const { PrismaClient } = require('@prisma/client');
const customerValidationSchema = require('../requests/validate')
const minioClient = require('../../../configs/minioconfig'); // Adjust path
const mime = require('mime-types');
const JWT_SECRET = process.env.JWT_SECRET;


const prisma = new PrismaClient();

class CustomerController {
  static async registerCustomer(input) {
    // Validate input using Joi schema
    const { error } = customerValidationSchema.validate(input, { abortEarly: false });
    if (error) {
      throw new ValidationError(error.details.map(detail => detail.message).join(','));
    }

    const {
      name,
      email,
      phone,
      city,
      state,
      country,
      pincode,
      password,
      confirmPassword,
    } = input;

    // Check if passwords match
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Check if the phone number is unique
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone },
    });
    if (existingCustomer) {
      throw new Error('Phone number already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new customer in the database
    const newCustomer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        city,
        state,
        country,
        pincode,
        password: hashedPassword,
      },
    });

    return newCustomer;
  }

  static async loginCustomer(email, password, res) {
    try {
      // Find customer by email
      const customer = await prisma.customer.findUnique({
        where: { email }
      });

      if (!customer) {
        throw new Error('User not found');
      }

      // Compare the provided password with the hashed password
      const isPasswordValid = await bcrypt.compare(password, customer.password);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // Generate JWT token
      const token = jwt.sign({ id: customer.id, email: customer.email }, JWT_SECRET, { expiresIn: '100h' });

      // Set JWT token in an HTTP-only secure cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000, // 1 hour
        sameSite: 'Strict',
      });

      // Exclude password from returned customer data
      const { password: customerPassword, ...customerData } = customer;

      return {
        token,
        customer: customerData,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async updateCustomer(id, input, profileImageFile) {
    console.log("Entered updateCustomer controller");
    let profileImageUrl = null;

    try {
      // Check if profile image is provided
      if (profileImageFile) {
        const { createReadStream, filename } = await profileImageFile.promise; // Handle promise correctly
        const stream = createReadStream();
        const mimeType = mime.contentType(filename);

        console.log(`Uploading profile image: ${filename}`);
        // Upload image to MinIO bucket
        await minioClient.putObject('vehicle', filename, stream, {
          'Content-Type': mimeType || 'application/octet-stream',
        });

        // Get the URL for the uploaded image
        profileImageUrl = await minioClient.presignedGetObject('vehicle', filename);
        if (!profileImageUrl) {
          throw new Error('Failed to upload profile image');
        }
        console.log('Profile image URL:', profileImageUrl);
      }

      // Update customer in database
      const updatedCustomer = await prisma.customer.update({
        where: { id: parseInt(id, 10) },
        data: {
          ...input,
          profilePicture: profileImageUrl || input.profilePicture || undefined,
        },
      });

      console.log('Customer updated successfully:', updatedCustomer);
      return updatedCustomer;
    } catch (error) {
      console.error('Error in updateCustomer:', error);
      throw new Error('Error updating customer: ' + error.message);
    }
  }
}

module.exports = CustomerController;