// services/vehicleService.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');
const mime = require('mime-types');
const minioClient = require('../../../configs/minioconfig');

const saveImageToDB = async ({ name, manufacturer, model, fuelType, gearType, seats, price, primaryImage, secondaryImage, otherImages, availableQty }) => {
  try {
    const newVehicle = await prisma.vehicle.create({
      data: {
        name,
        manufacturer,
        model,
        fuelType,
        gearType,
        seats,
        price,
        primaryImage,
        secondaryImage,
        otherImages,
        availableQty,
      },
    });
    return newVehicle; // Ensure this is returning the newly created vehicle
  } catch (error) {
    console.error('Error saving vehicle to database:', error);
    throw new Error('Database error: ' + error.message);
  }
};

const deleteVehicleFromDB = async (id) => {
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: parseInt(id) },
      });
      
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }
  
      await prisma.vehicle.delete({
        where: { id: parseInt(id) },
      });
  
      return vehicle; // Return the vehicle details for further deletion of images
    } catch (error) {
      console.error('Error deleting vehicle from database:', error);
      throw new Error('Database error: ' + error.message);
    }
  };

  const deleteImageFromMinIO = async (imageUrl) => {
    try {
      const bucketName = process.env.MINIO_BUCKET; // e.g., 'vehicle'
  
      // Extract the file name from the image URL
      let fileName = path.basename(imageUrl);
  
      // Decode URL to handle encoded characters (e.g., %20 for spaces)
      fileName = decodeURIComponent(fileName);
  
      // Sanitize the file name to ensure there are no unsupported characters
      fileName = fileName.replace(/[^a-zA-Z0-9._-]/g, ''); // Only allow alphanumeric, dots, underscores, and hyphens
  
      if (!fileName) {
        throw new Error('Invalid file name after sanitization.');
      }
  
      // Delete the object from MinIO
      await minioClient.removeObject(bucketName, fileName);
      console.log(`Deleted ${fileName} from MinIO`);
    } catch (error) {
      console.error('Error deleting image from MinIO:', error.message);
    }
  };

  const updateVehicleInDB = async (id, updateData) => {
    try {
      const updatedVehicle = await prisma.vehicle.update({
        where: { id: parseInt(id, 10) },
        data: updateData,
      });
      return updatedVehicle;
    } catch (error) {
      console.error('Error updating vehicle in database:', error);
      throw new Error('Database error: ' + error.message);
    }
  };

  async function downloadAndUploadImage(imageUrl, imageType, uniqueIdentifier) {
    if (!imageUrl) return null;
  
    try {
      // Download the image
      const response = await axios.get(imageUrl, { responseType: 'stream' });
      const contentType = response.headers['content-type'];
  
      // Generate a unique filename
      const fileExtension = mime.extension(contentType);
      const filename = `${imageType}_${uniqueIdentifier}_${Date.now()}.${fileExtension}`;
  
      // Upload to MinIO
      await minioClient.putObject('vehicle', filename, response.data, {
        'Content-Type': contentType,
      });
  
      // Get the presigned URL
      const presignedUrl = await minioClient.presignedGetObject('vehicle', filename);
  
      return presignedUrl;
    } catch (error) {
      console.error(`Error processing ${imageType} image:`, error);
      return null;
    }
  }

module.exports = {
  saveImageToDB,
  deleteVehicleFromDB,
  deleteImageFromMinIO,
  updateVehicleInDB,
  downloadAndUploadImage,
};
