const path = require('path');
const { deleteFile, ensureDir, generateUniqueFilename } = require('../utils/fileHelper');

// File storage service
class FileService {
  constructor() {
    this.uploadBasePath = process.env.UPLOAD_PATH || './uploads';
  }

  // Save uploaded file
  async saveFile(file, category = 'documents') {
    try {
      const categoryPath = path.join(this.uploadBasePath, category);
      await ensureDir(categoryPath);

      const filename = generateUniqueFilename(file.originalname);
      const filepath = path.join(categoryPath, filename);

      // File is already saved by multer, just return the path
      return {
        success: true,
        filename: filename,
        filepath: filepath,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      };
    } catch (error) {
      console.error('Save file error:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete file
  async deleteFile(filepath) {
    try {
      const deleted = await deleteFile(filepath);
      return { success: deleted };
    } catch (error) {
      console.error('Delete file error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get file URL
  getFileUrl(filepath) {
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    return `${baseUrl}/${filepath.replace(/\\/g, '/')}`;
  }

  // Save prescription file
  async savePrescription(file) {
    return await this.saveFile(file, 'prescriptions');
  }

  // Save lab report file
  async saveLabReport(file) {
    return await this.saveFile(file, 'lab-reports');
  }

  // Save medical record file
  async saveMedicalRecord(file) {
    return await this.saveFile(file, 'documents');
  }

  // Save profile image
  async saveProfileImage(file) {
    return await this.saveFile(file, 'profile-images');
  }
}

module.exports = new FileService();
