
const fileService = require('./file.service');

class FileService {
  async saveFile(file, category = 'documents') {
    try {
      const result = await fileService.uploadToCloud(file, {
        directory: category,
        resourceType: 'auto',
      });

      return {
        success: true,
        filename: result.filename,
        filepath: result.publicId,
        publicId: result.publicId,
        originalName: result.originalName,
        size: result.size,
        mimetype: result.mimeType,
        url: result.url,
        storage: result.storage,
      };
    } catch (error) {
      console.error('Save file error:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deleteFile(publicId) {
    try {
      const result = await fileService.deleteFromCloud(publicId);

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error('Delete file error:', error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  getFileUrl(publicId) {
    try {
      return fileService.getAuthenticatedFileUrl(publicId);
    } catch (error) {
      console.error('Generate file URL error:', error);
      return null;
    }
  }

  async savePrescription(file) {
    return this.saveFile(file, 'prescriptions');
  }

  async saveLabReport(file) {
    return this.saveFile(file, 'lab-reports');
  }

  async saveMedicalRecord(file) {
    return this.saveFile(file, 'medical-records');
  }

  async saveProfileImage(file) {
    return this.saveFile(file, 'profile-images');
  }
}

module.exports = new FileService();
