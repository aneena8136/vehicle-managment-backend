const Minio = require('minio');
require('dotenv').config(); // Load environment variables

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT, // MinIO endpoint from .env
    port: parseInt(process.env.MINIO_PORT) || 9000, // Port (default is 9000)
    useSSL: process.env.MINIO_USE_SSL === 'true', // Use SSL (true/false)
    accessKey: process.env.MINIO_ACCESS_KEY, // Access key from .env
    secretKey: process.env.MINIO_SECRET_KEY, // Secret key from .env
});
  
module.exports = minioClient;
