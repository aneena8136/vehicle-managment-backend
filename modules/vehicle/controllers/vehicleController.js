// controllers/VehicleController.js
const { PrismaClient } = require('@prisma/client');
const mime = require('mime-types');
const XLSX = require('xlsx');
const minioClient = require('../../../configs/minioconfig')
const { saveImageToDB, deleteVehicleFromDB, deleteImageFromMinIO, updateVehicleInDB , downloadAndUploadImage } = require('../services/vehicleService');
const { addVehicleToTypesense , deleteVehicleFromTypesense , updateVehicleInTypesense } = require('../../../configs/typesense');

const prisma = new PrismaClient();

class VehicleController {
  async addVehicle({
    name,
    manufacturer,
    model,
    fuelType,
    gearType,
    seats,
    price,
    primaryImageFile,
    secondaryImageFile,
    otherImageFiles,
    availableQty
  }) {
    try {
      // Process primary image
      const { createReadStream: createReadStreamPrimary, filename: filenamePrimary } = await primaryImageFile.promise;
      const streamPrimary = createReadStreamPrimary();
      const mimeTypePrimary = mime.contentType(filenamePrimary);

      console.log(`Uploading primary image: ${filenamePrimary}`);
      await minioClient.putObject('vehicle', filenamePrimary, streamPrimary, {
        'Content-Type': mimeTypePrimary || 'application/octet-stream',
      });
      const primaryImage = await minioClient.presignedGetObject('vehicle', filenamePrimary);

      if (!primaryImage) {
        throw new Error('Failed to upload primary image');
      }
      console.log('Primary image URL:', primaryImage);

      // Process secondary image
      const { createReadStream: createReadStreamSecondary, filename: filenameSecondary } = await secondaryImageFile.promise;
      const streamSecondary = createReadStreamSecondary();
      const mimeTypeSecondary = mime.contentType(filenameSecondary);

      console.log(`Uploading secondary image: ${filenameSecondary}`);
      await minioClient.putObject('vehicle', filenameSecondary, streamSecondary, {
        'Content-Type': mimeTypeSecondary || 'application/octet-stream',
      });
      const secondaryImage = await minioClient.presignedGetObject('vehicle', filenameSecondary);

      if (!secondaryImage) {
        throw new Error('Failed to upload secondary image');
      }
      console.log('Secondary image URL:', secondaryImage);

      let otherImages = [];
      if (otherImageFiles && otherImageFiles.length > 0) {
        console.log('Uploading other images...');
        for (const file of otherImageFiles) {
          const { createReadStream, filename } = await file.promise;
          const stream = createReadStream();
          const mimeType = mime.contentType(filename);
          console.log(`Uploading image: ${filename}`);
          await minioClient.putObject('vehicle', filename, stream, {
            'Content-Type': mimeType || 'application/octet-stream',
          });
          const imageUrl = await minioClient.presignedGetObject('vehicle', filename);

          if (!imageUrl) {
            throw new Error(`Failed to upload image: ${filename}`);
          }

          otherImages.push(imageUrl);
        }
        console.log('Other images URLs:', otherImages);
      }

      console.log('Saving vehicle to the database...');
      const newVehicle = await saveImageToDB({
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
      });

      if (!newVehicle) {
        throw new Error('Failed to save vehicle in the database');
      }

      // Add vehicle to Typesense
      const vehicleData = {
        id: newVehicle.id.toString(),
        name,
        manufacturer,
        model,
        fuelType,
        gearType,
        seats,
        price,
        availableQty,
        primaryImage,
        secondaryImage,
      };

      await addVehicleToTypesense(vehicleData);

      console.log('Vehicle added successfully!', newVehicle);
      return newVehicle;

    } catch (error) {
      console.error('Error in VehicleController.addVehicle:', error);
      throw new Error('Error adding vehicle: ' + error.message);
    }
  }
  async deleteVehicle(id) {
    try {
      // Delete the vehicle from the database and retrieve the deleted vehicle details
      const vehicle = await deleteVehicleFromDB(id);

      // Also delete the vehicle from Typesense
      await deleteVehicleFromTypesense(id);

      // Delete images from MinIO
      const { primaryImage, secondaryImage } = vehicle;

      if (primaryImage) {
        await deleteImageFromMinIO(primaryImage);
      }
      if (secondaryImage) {
        await deleteImageFromMinIO(secondaryImage);
      }

      return `Vehicle with ID ${id} has been successfully deleted.`;
    } catch (error) {
      console.error("Error deleting vehicle", error);
      throw new Error('Error deleting vehicle: ' + error.message);
    }
  }

  async editVehicle({
    id, name, manufacturer, model, fuelType, gearType, seats, price, primaryImageFile, secondaryImageFile, otherImageFiles, availableQty
  }) {
    let primaryImageUrl = null;
    let secondaryImageUrl = null;
    let newOtherImagesUrls = [];
  
    try {
      // Find existing vehicle in the database
      const vehicle = await prisma.vehicle.findUnique({ where: { id: parseInt(id, 10) } });
      if (!vehicle) throw new Error('Vehicle not found');
  
      // Handle primary image upload
      if (primaryImageFile) {
        const { promise } = primaryImageFile;
        if (promise) {
          const { createReadStream, filename } = await promise;
          const stream = createReadStream();
          const mimeType = mime.contentType(filename);
  
          await minioClient.putObject(process.env.MINIO_BUCKET, `primary-${filename}`, stream, {
            'Content-Type': mimeType || 'application/octet-stream',
          });
          primaryImageUrl = await minioClient.presignedGetObject(process.env.MINIO_BUCKET, `primary-${filename}`);
        } else {
          console.log('Primary image promise is undefined');
        }
      }
  
      // Handle secondary image upload
      if (secondaryImageFile) {
        const { promise } = secondaryImageFile;
        if (promise) {
          const { createReadStream, filename } = await promise;
          const stream = createReadStream();
          const mimeType = mime.contentType(filename);
  
          await minioClient.putObject(process.env.MINIO_BUCKET, `secondary-${filename}`, stream, {
            'Content-Type': mimeType || 'application/octet-stream',
          });
          secondaryImageUrl = await minioClient.presignedGetObject(process.env.MINIO_BUCKET, `secondary-${filename}`);
        } else {
          console.log('Secondary image promise is undefined');
        }
      }
  
      // Handle other images upload
      if (otherImageFiles && otherImageFiles.length > 0) {
        console.log(`Uploading ${otherImageFiles.length} new other images`);
        newOtherImagesUrls = await Promise.all(
          otherImageFiles.map(async (file, index) => {
            const { promise } = file;
            if (promise) {
              const { createReadStream, filename } = await promise;
              const stream = createReadStream();
              const mimeType = mime.contentType(filename);
  
              const uniqueFilename = `other-${Date.now()}-${index}-${filename}`;
              await minioClient.putObject(process.env.MINIO_BUCKET, uniqueFilename, stream, {
                'Content-Type': mimeType || 'application/octet-stream',
              });
              const imageUrl = await minioClient.presignedGetObject(process.env.MINIO_BUCKET, uniqueFilename);
              return imageUrl;
            } else {
              console.warn(`Other image ${index + 1} promise is undefined.`);
              return null;
            }
          })
        );
  
        // Filter out null values from newOtherImagesUrls
        newOtherImagesUrls = newOtherImagesUrls.filter((imageUrl) => imageUrl !== null);
      }
  
      // Prepare updated data
      const updatedOtherImages = newOtherImagesUrls.length > 0 ? newOtherImagesUrls : vehicle.otherImages;
      const updateData = {
        name: name || vehicle.name,
        manufacturer: manufacturer || vehicle.manufacturer,
        model: model || vehicle.model,
        fuelType: fuelType || vehicle.fuelType,
        gearType: gearType || vehicle.gearType,
        seats: seats !== undefined ? seats : vehicle.seats,
        price: price !== undefined ? price : vehicle.price,
        primaryImage: primaryImageUrl || vehicle.primaryImage,
        secondaryImage: secondaryImageUrl || vehicle.secondaryImage,
        otherImages: updatedOtherImages,
        availableQty: availableQty !== undefined ? availableQty : vehicle.availableQty,
      };
  
      // Update vehicle details in the database
      const updatedVehicle = await updateVehicleInDB(id, updateData);
  
      // Update vehicle details in Typesense
      await updateVehicleInTypesense(updatedVehicle);
  
      return updatedVehicle;
    } catch (error) {
      console.error('Error in editVehicle:', error);
      throw new Error('Error updating vehicle: ' + error.message);
    }
  }

  static async importVehicles(file) {
    try {
      console.log('Received file:', file);
      const resolvedFile = await file.promise;
      console.log('Resolved file object:', resolvedFile);

      const { filename, createReadStream } = resolvedFile;
      if (!createReadStream || typeof createReadStream !== 'function') {
        throw new Error('createReadStream is not a function');
      }

      console.log('File name:', filename);
      const stream = createReadStream();
      const chunks = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const errors = [];
      const fuelTypeEnum = ['PETROL', 'DIESEL', 'EV', 'CNG'];
      const gearTypeEnum = ['MANUAL', 'AUTOMATIC'];

      for (const row of sheet) {
        const { name, manufacturer, model, fuelType, gearType, seats, price, primaryImage, secondaryImage, otherImages, availableQty } = row;

        // Validation checks remain the same...
        if (!name || !manufacturer || !model || !fuelType || !gearType || seats === undefined || price === undefined || availableQty === undefined) {
          errors.push(`Row ${sheet.indexOf(row) + 1}: Missing required field(s)`);
          continue;
        }

        // Validate data types
        if (typeof name !== 'string' || typeof manufacturer !== 'string' || typeof model !== 'string') {
          errors.push(`Row ${sheet.indexOf(row) + 1}: Name, Manufacturer, and Model must be strings`);
        }
        if (!fuelTypeEnum.includes(fuelType)) {
          errors.push(`Row ${sheet.indexOf(row) + 1}: Invalid fuel type '${fuelType}'. Valid options are: ${fuelTypeEnum.join(', ')}`);
        }
        if (!gearTypeEnum.includes(gearType)) {
          errors.push(`Row ${sheet.indexOf(row) + 1}: Invalid gear type '${gearType}'. Valid options are: ${gearTypeEnum.join(', ')}`);
        }
        if (typeof seats !== 'number' || seats <= 0) {
          errors.push(`Row ${sheet.indexOf(row) + 1}: Seats must be a positive number`);
        }
        if (typeof price !== 'number' || price < 0) {
          errors.push(`Row ${sheet.indexOf(row) + 1}: Price must be a non-negative number`);
        }
        if (typeof availableQty !== 'number' || availableQty < 0) {
          errors.push(`Row ${sheet.indexOf(row) + 1}: Available quantity must be a non-negative number`);
        }

        // Skip if there's a duplicate in the database
        const existingVehicle = await prisma.vehicle.findFirst({
          where: { name, manufacturer, model },
        });
        if (existingVehicle) {
          continue;
        }

        // Download and upload images to MinIO
        const primaryImageUrl = await downloadAndUploadImage(primaryImage, 'primary', `${name}_${manufacturer}_${model}`);
        const secondaryImageUrl = await downloadAndUploadImage(secondaryImage, 'secondary', `${name}_${manufacturer}_${model}`);

        // Handle otherImages
        let otherImageUrls = [];
        if (otherImages && typeof otherImages === 'string') {
          const otherImagesArray = otherImages.split(',');
          otherImageUrls = await Promise.all(otherImagesArray.map(async (imageUrl, index) => {
            return await downloadAndUploadImage(imageUrl.trim(), `other_${index}`, `${name}_${manufacturer}_${model}`);
          }));
        }

        if (!primaryImageUrl) {
          errors.push(`Row ${sheet.indexOf(row) + 1}: Primary image upload failed`);
          continue;
        }

        // Create the vehicle in the database
        const newVehicle = await prisma.vehicle.create({
          data: {
            name,
            manufacturer,
            model,
            fuelType,
            gearType,
            seats: parseInt(seats, 10),
            price: parseFloat(price),
            primaryImage: primaryImageUrl,
            secondaryImage: secondaryImageUrl,
            otherImages: otherImageUrls,
            availableQty: parseInt(availableQty, 10),
          }
        });

        // Create vehicleData for Typesense after successful database insertion
        const vehicleData = {
          id: newVehicle.id.toString(),
          name,
          manufacturer,
          model,
          fuelType,
          gearType,
          seats,
          price,
          availableQty,
          primaryImage: primaryImageUrl,
          secondaryImage: secondaryImageUrl,
          otherImages: otherImageUrls,
        };

        // Add the vehicle to Typesense
        await addVehicleToTypesense(vehicleData);
      }

      if (errors.length > 0) {
        throw new Error(`Validation errors: ${errors.join(' | ')}`);
      }

      return `File ${filename} imported successfully!`;
    } catch (error) {
      console.error('Error in importVehicles:', error);
      throw new Error(`Failed to import vehicles: ${error.message}`);
    }
  }
}

module.exports = VehicleController;