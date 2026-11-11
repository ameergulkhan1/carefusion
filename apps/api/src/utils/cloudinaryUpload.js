
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const uploadToCloudinary = (file, folder = 'carefusion/general') => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject(new Error('No file buffer provided'));
    }

    const resourceType =
      file.mimetype === 'application/pdf' ? 'raw' : 'image';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

module.exports = uploadToCloudinary;
