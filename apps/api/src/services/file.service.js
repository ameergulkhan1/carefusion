const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class FileService {
  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.documentsDir = path.join(this.uploadDir, 'medical-records');
    this.profilesDir = path.join(this.uploadDir, 'profiles');
    this.ensureDirectories();
  }

  /**
   * Ensure upload directories exist
   */
  async ensureDirectories() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      await fs.mkdir(this.documentsDir, { recursive: true });
      await fs.mkdir(this.profilesDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directories:', error);
    }
  }

  /**
   * Generate unique filename
   */
  generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${sanitizedName}_${timestamp}_${randomString}${ext}`;
  }

  /**
   * Validate file
   */
  validateFile(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
      ]
    } = options;

    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`);
    }

    // Check mime type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`);
    }

    return true;
  }

  /**
   * Save file to local storage
   * In production, this would upload to cloud storage (S3/Cloudinary)
   */
  async saveFile(file, directory = 'medical-records') {
    try {
      this.validateFile(file);

      const uniqueFilename = this.generateUniqueFilename(file.originalname);
      const targetDir = directory === 'profiles' ? this.profilesDir : this.documentsDir;
      const filePath = path.join(targetDir, uniqueFilename);

      // Move file from temp location to target directory
      await fs.writeFile(filePath, file.buffer);

      // Generate URL that can be accessed from frontend
      // In development: http://localhost:5000/uploads/medical-records/filename.jpg
      // In production: full cloud URL would be used
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
      const url = `${baseUrl}/uploads/${directory}/${uniqueFilename}`;

      return {
        url,
        originalName: file.originalname,
        filename: uniqueFilename,
        size: file.size,
        mimeType: file.mimetype,
        path: filePath
      };
    } catch (error) {
      throw new Error(`Failed to save file: ${error.message}`);
    }
  }

  /**
   * Upload to cloud (placeholder for actual cloud storage)
   * This would be implemented with Cloudinary, AWS S3, etc.
   */
  async uploadToCloud(file, options = {}) {
    try {
      // For now, save locally
      const result = await this.saveFile(file, options.directory);

      // In production, implement actual cloud upload:
      /*
      const cloudinary = require('cloudinary').v2;
      const uploadResult = await cloudinary.uploader.upload(result.path, {
        folder: 'clinixsol/medical-records',
        resource_type: 'auto',
        ...options.cloudinaryOptions
      });
      
      // Delete local file after cloud upload
      await fs.unlink(result.path);
      
      return {
        url: uploadResult.secure_url,
        originalName: file.originalname,
        filename: uploadResult.public_id,
        size: file.size,
        mimeType: file.mimetype,
        cloudinaryId: uploadResult.public_id
      };
      */

      return result;
    } catch (error) {
      throw new Error(`Failed to upload to cloud: ${error.message}`);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Delete from cloud (placeholder)
   */
  async deleteFromCloud(fileUrl) {
    try {
      // Extract filename from URL
      const filename = path.basename(fileUrl);
      const filePath = path.join(this.documentsDir, filename);
      
      // Try to delete from both directories
      try {
        await this.deleteFile(filePath);
      } catch (error) {
        const profilePath = path.join(this.profilesDir, filename);
        await this.deleteFile(profilePath);
      }

      // In production, implement cloud deletion:
      /*
      const cloudinary = require('cloudinary').v2;
      const publicId = extractPublicIdFromUrl(fileUrl);
      await cloudinary.uploader.destroy(publicId);
      */

      return true;
    } catch (error) {
      throw new Error(`Failed to delete from cloud: ${error.message}`);
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  /**
   * Generate thumbnail for images
   */
  async generateThumbnail(filePath) {
    // Placeholder - in production, use sharp or similar library
    // const sharp = require('sharp');
    // const thumbnailPath = filePath.replace(/(\.[^.]+)$/, '_thumb$1');
    // await sharp(filePath)
    //   .resize(200, 200, { fit: 'inside' })
    //   .toFile(thumbnailPath);
    // return thumbnailPath;
    
    return null; // Return null for now
  }
}

module.exports = new FileService();
