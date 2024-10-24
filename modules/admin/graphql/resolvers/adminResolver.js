// src/graphql/resolvers.js
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');


const prisma = new PrismaClient();


const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Replace with your actual secret key


const adminResolvers = {
  Mutation: {
    loginAdmin: async (_, { email, password }) => {
      // Find the admin by email
      const admin = await prisma.admin.findUnique({
        where: { email },
      });

      // If admin not found, throw an error
      if (!admin) {
        throw new Error('Admin not found');
      }

      
      // Compare the provided password with the stored hashed password
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }


      // Generate JWT token
      const token = jwt.sign(
        { id: admin.id, email: admin.email }, // Payload
        JWT_SECRET, // Secret key
        { expiresIn: '1h' } // Token expiration time
      );

      // If valid, return the admin data (excluding the password)
      return {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        token,
      };
    },
  },
};

module.exports =  adminResolvers;
