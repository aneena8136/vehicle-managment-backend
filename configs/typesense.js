const Typesense = require('typesense');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Create a Typesense client
const client = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSEHOST, // Your Typesense host
      port: 443, // or 8108 for HTTP
      protocol: 'https', // or 'http' if not using SSL
    },
  ],
  apiKey: process.env.TYPESENSEADMIN, // Your Typesense API key
});

// Initialize Prisma Client
const prisma = new PrismaClient(); // Make sure to initialize it here

// Function to create a collection
const createCollection = async () => {
  const collectionSchema = {
    name: 'vehicles',
    fields: [
      { name: 'id', type: 'string', index: true },
      { name: 'name', type: 'string', index: true },
      { name: 'manufacturer', type: 'string', index: true },
      { name: 'model', type: 'string', index: true },
      { name: 'fuelType', type: 'string', index: true },
      { name: 'gearType', type: 'string', index: true },
      { name: 'seats', type: 'int32' },
      { name: 'price', type: 'float' },
      { name: 'availableQty', type: 'int32' },
      { name: 'primaryImage', type: 'string' },
      { name: 'secondaryImage', type: 'string' },
    ],
    default_sorting_field: 'price',
  };

  try {
    const result = await client.collections().create(collectionSchema);
    console.log('Collection created:', result);
  } catch (error) {
    console.error('Error creating collection:', error);
  }
};

// Function to add a vehicle to the collection
const addVehicle = async (vehicle) => {
  try {
    const result = await client.collections('vehicles').documents().create(vehicle);
    console.log('Vehicle added:', result);
  } catch (error) {
    console.error('Error adding vehicle:', error);
  }
};


const addVehicleToTypesense = async (vehicle) => {
    try {
      const result = await client.collections('vehicles').documents().create(vehicle);
      console.log('Vehicle added to Typesense:', result);
    } catch (error) {
      console.error('Error adding vehicle to Typesense:', error);
    }
  };
  
  // Function to delete a vehicle from Typesense
const deleteVehicleFromTypesense = async (id) => {
    try {
      const result = await client.collections('vehicles').documents(id.toString()).delete();
      console.log('Vehicle deleted from Typesense:', result);
    } catch (error) {
      console.error('Error deleting vehicle from Typesense:', error);
    }
  };

// Function to fetch vehicles from the database and add them to Typesense
const addVehiclesFromDatabase = async () => {
  try {
    const vehicles = await prisma.vehicle.findMany();
    for (const vehicle of vehicles) {
      const vehicleData = {
        id: vehicle.id.toString(), // Ensure this ID is a string
        name: vehicle.name,
        manufacturer: vehicle.manufacturer,
        model: vehicle.model,
        fuelType: vehicle.fuelType,
        gearType: vehicle.gearType,
        seats: vehicle.seats,
        price: vehicle.price,
        availableQty: vehicle.availableQty,
        primaryImage: vehicle.primaryImage,
        secondaryImage: vehicle.secondaryImage,
      };
      await addVehicle(vehicleData);
    }
    console.log('All vehicles added to Typesense successfully.');
  } catch (error) {
    console.error('Error fetching vehicles from the database:', error);
  } finally {
    await prisma.$disconnect(); // Disconnect Prisma client
  }
};

const updateVehicleInTypesense = async (updatedVehicle) => {
  try {
    // Assuming vehicle has the same ID in both the database and Typesense
    await client.collections('vehicles').documents(updatedVehicle.id.toString()).update({
      name: updatedVehicle.name,
      manufacturer: updatedVehicle.manufacturer,
      model: updatedVehicle.model,
      fuelType: updatedVehicle.fuelType,
      gearType: updatedVehicle.gearType,
      seats: updatedVehicle.seats,
      price: updatedVehicle.price,
      primaryImage: updatedVehicle.primaryImage,
      secondaryImage: updatedVehicle.secondaryImage,
      availableQty: updatedVehicle.availableQty
    });
    console.log('Vehicle updated in Typesense successfully');
  } catch (error) {
    console.error('Error updating vehicle in Typesense:', error);
  }
};



// Uncomment the line below to create the collection
// createCollection();

// Fetch vehicles from the database and add them to Typesense
module.exports = {
    addVehicle,
    addVehicleToTypesense,
    createCollection,
    addVehiclesFromDatabase,
    deleteVehicleFromTypesense,
    updateVehicleInTypesense,
  };
 