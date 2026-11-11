
const cloudinary = require('../config/cloudinary');

class FileService {
  /**
   * Upload an in-memory Multer file to authenticated Cloudinary storage.
   * Requires multer.memoryStorage() so file.buffer is available.
   */
  async uploadToCloud(file, options = {}) {
    try {
      if (!file || !file.buffer) {
        throw new Error('Invalid file or file buffer is missing');
      }

      const folder = options.directory || 'carefusion';
      const resourceType = options.resourceType || 'auto';

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `carefusion/${folder}`,
            resource_type: resourceType,
            type: 'authenticated',
            use_filename: false,
            unique_filename: true,
            overwrite: false,
          },
          (error, uploadedFile) => {
            if (error) return reject(error);
            resolve(uploadedFile);
          }
        );

        stream.end(file.buffer);
      });

      return {
        success: true,
        filename: file.originalname,
        originalName: file.originalname,
        publicId: result.public_id,
        cloudinaryId: result.public_id,
        url: result.secure_url,
        secureUrl: result.secure_url,
        size: result.bytes,
        mimeType: file.mimetype,
        resourceType: result.resource_type,
        format: result.format,
        storage: 'cloudinary-authenticated',
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);

      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Compatibility method for existing controllers.
   */
  async saveFile(file, category = 'documents') {
    return this.uploadToCloud(file, {
      directory: category,
    });
  }

  /**
   * Delete an authenticated Cloudinary asset using its public ID.
   */
  async deleteFromCloud(publicId, options = {}) {
    try {
      if (!publicId) {
        throw new Error('Cloudinary public ID is required');
      }

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: options.resourceType || 'image',
        type: 'authenticated',
        invalidate: true,
      });

      return {
        success: result.result === 'ok',
        result: result.result,
      };
    } catch (error) {
      console.error('Cloudinary delete error:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Retrieve metadata for an authenticated asset.
   */
  async getFileInfo(publicId, options = {}) {
    try {
      if (!publicId) {
        throw new Error('Cloudinary public ID is required');
      }

      return await cloudinary.api.resource(publicId, {
        resource_type: options.resourceType || 'image',
        type: 'authenticated',
      });
    } catch (error) {
      console.error('File information error:', error);
      return null;
    }
  }

  /**
   * Generate a signed authenticated delivery URL.
   * Protect this URL and only return it to an authorized user.
   */
  getAuthenticatedFileUrl(publicId, options = {}) {
    if (!publicId) {
      throw new Error('Cloudinary public ID is required');
    }

    return cloudinary.url(publicId, {
      secure: true,
      type: 'authenticated',
      sign_url: true,
      resource_type: options.resourceType || 'image',
      format: options.format,
    });
  }

  async savePrescription(file) {
    return this.uploadToCloud(file, {
      directory: 'prescriptions',
      resourceType: 'auto',
    });
  }

  async saveLabReport(file) {
    return this.uploadToCloud(file, {
      directory: 'lab-reports',
      resourceType: 'auto',
    });
  }

  async saveMedicalRecord(file) {
    return this.uploadToCloud(file, {
      directory: 'medical-records',
      resourceType: 'auto',
    });
  }

  async saveProfileImage(file) {
    return this.uploadToCloud(file, {
      directory: 'profile-images',
      resourceType: 'image',
    });
  }
}

module.exports = new FileService();
