const { GraphQLUpload } = require('graphql-upload');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const VehicleController = require('../../controllers/vehicleController');

// Create an instance of VehicleController
const vehicleController = new VehicleController();

const vehicleResolvers = {
  Upload: GraphQLUpload,
  
  Query: {
    getAllVehicles: async (_, __, { prisma }) => {
      try {
        console.log("Attempting to fetch vehicles...");
        const vehicles = await prisma.vehicle.findMany();
        console.log("Fetched vehicles:", vehicles);

        if (!vehicles) {
          console.error('No vehicles found');
        }

        return vehicles;
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        throw new Error('Error fetching vehicles: ' + error.message);
      }
    },

    getVehicleById: async (_, { id }, { prisma }) => {
      try {
        const vehicle = await prisma.vehicle.findUnique({
          where: { id: parseInt(id) },
        });
        if (!vehicle) throw new Error('Vehicle not found');
        return vehicle;
      } catch (error) {
        throw new Error('Error fetching vehicle: ' + error.message);
      }
    },
  },

  Mutation: {
    addVehicle: async (_, args) => {
      return vehicleController.addVehicle(args);
    },

    deleteVehicle: async (_, { id }) => {
      return vehicleController.deleteVehicle(id);
    },

    editVehicle: async (_, args) => {
      return vehicleController.editVehicle(args);
    },

    importVehicles: async (_, { file }) => {
      // Since importVehicles is a static method, we can call it directly on the class
      return VehicleController.importVehicles(file);
    },
  },
};

module.exports = vehicleResolvers;