const { PrismaClient } = require('@prisma/client');
const { GraphQLUpload } = require('graphql-upload');
const CustomerController = require('../../controllers/CustomerController');



// Initialize Prisma Client
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

const customerResolvers = {
  Upload: GraphQLUpload,

  Query: {
    getUserProfile: async (_, __, { prisma, user }) => {
      // Assuming you have some way to get the logged-in user's ID
      return await prisma.customer.findUnique({ where: { id: user.id } });
    },
  },

  Mutation: {
    registerCustomer: async (_, { input }, { prisma }) => {
      return CustomerController.registerCustomer(input);
    },


    loginCustomer: async (_, { email, password }, { prisma, res }) => {
      return CustomerController.loginCustomer(email, password, res);
    },

    updateCustomer: async (_, { id, input, profileImageFile }) => {
      return CustomerController.updateCustomer(id, input, profileImageFile);
    },
    
    
  },    
};

module.exports = customerResolvers; 