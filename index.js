const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { graphqlUploadExpress } = require('graphql-upload'); // GraphQL Upload
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

// Import your type definitions and resolvers
const usertypeDefs = require('./modules/user/graphql/typedef');
const cartypeDefs = require('./modules/vehicle/graphql/typedef');
const adminTypedefs = require('./modules/admin/graphql/typedef/adminTypedefs');
const userResolvers = require('./modules/user/graphql/resolvers');
const vehicleModuleResolvers = require('./modules/vehicle/graphql/resolvers');
const adminResolver = require('./modules/admin/graphql/resolvers/adminResolver');

// Load environment variables
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// Start the server
const startServer = async () => {
  const app = express();

  // Enable CORS for all requests
  const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow these origins
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  };
  

  app.use(cors(corsOptions));
  app.use(cookieParser());

  // Apply the graphqlUploadExpress middleware for handling file uploads
  app.use(graphqlUploadExpress({  maxFileSize: 20 * 1024 * 1024, maxFiles: 10 }));

  // Apollo Server setup
  const server = new ApolloServer({
    typeDefs: [usertypeDefs, ...cartypeDefs, adminTypedefs], // Combine typeDefs
    resolvers: [userResolvers, vehicleModuleResolvers, adminResolver], // Combine resolvers
    uploads: false, // Disable built-in uploads, handled by graphql-upload
    context: ({ req, res }) => {
      const token = req.cookies.token;
      let customerId = null;

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          customerId = decoded.id;
        } catch (error) {
          console.error('Token verification error', error);
        }
      }
      return { prisma, customerId, res };
    },
  });

  // Start Apollo Server
  await server.start();

  // Apply Apollo middleware to Express with CORS options
  server.applyMiddleware({ app, cors: corsOptions });

  // Start the Express server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}${server.graphqlPath}`);
  });
};

// Start the server and handle errors
startServer().catch((error) => {
  console.error('Error starting server:', error);
  prisma.$disconnect();
});
