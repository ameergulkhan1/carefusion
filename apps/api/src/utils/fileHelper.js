const fs = require('fs').promises;
const path = require('path');
const { AppError } = require('../middleware/errorHandler');

// Delete file
exports.deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Check if file exists
exports.fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

// Get file size
exports.getFileSize = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    throw new AppError('File not found', 404);
  }
};

// Create directory if not exists
exports.ensureDir = async (dirPath) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return true;
  } catch (error) {
    console.error('Error creating directory:', error);
    return false;
  }
};

// Get file extension
exports.getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Generate unique filename
exports.generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  return `${name}-${timestamp}-${random}${ext}`;
};

// Validate file type
exports.isValidFileType = (filename, allowedTypes) => {
  const ext = path.extname(filename).toLowerCase();
  return allowedTypes.includes(ext);
};

// Format file size
exports.formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Read file content
exports.readFile = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    throw new AppError('Error reading file', 500);
  }
};

// Write file content
exports.writeFile = async (filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    throw new AppError('Error writing file', 500);
  }
};
