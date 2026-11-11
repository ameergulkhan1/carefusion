// D:\carefusion\apps\api\src\middleware\upload.js
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// ---- Cloudinary config (idempotent – safe to require many times) ----
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  // eslint-disable-next-line no-console
  console.warn(
    '⚠️ Cloudinary env vars missing (CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET). Uploads will fail.'
  );
}

// Folder mapping by field name
const FOLDER_MAP = {
  labReport: 'clinixsol/lab-reports',
  medicalRecord: 'clinixsol/medical-records',
  prescription: 'clinixsol/prescriptions',
  document: 'clinixsol/documents',
  profilePicture: 'clinixsol/profile-images',
  documents: 'clinixsol/documents',
};

// Determine Cloudinary resource_type from mimetype
function resolveResourceType(mimetype) {
  if (mimetype === 'application/pdf' || mimetype?.startsWith('application/')) {
    // PDFs / docs must be 'raw' or 'auto' in Cloudinary
    return 'auto';
  }
  return 'auto'; // Let Cloudinary decide (image for images, raw for docs)
}

// Stream a Buffer to Cloudinary
function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// Build Cloudinary options from a Multer file
function buildOptions(file, overrides = {}) {
  const folder = overrides.folder || FOLDER_MAP[file.fieldname] || 'clinixsol/misc';

  const options = {
    folder,
    resource_type: resolveResourceType(file.mimetype),
    // Preserve original filename (without path)
    public_id: `${Date.now()}-${sanitizeName(
      file.originalname.replace(/\.[^/.]+$/, '') // strip extension
    )}`,
    overwrite: false,
    use_filename: false,
    unique_filename: true,
    // Limit transformations so we don't accidentally resize PDFs
    ...(file.mimetype?.startsWith('image/')
      ? { transformation: [{ quality: 'auto', fetch_format: 'auto' }] }
      : {}),
    ...overrides,
  };

  // Remove `transformation` for non-images (Cloudinary rejects it for raw)
  if (!file.mimetype?.startsWith('image/')) {
    delete options.transformation;
  }

  return options;
}

function sanitizeName(name) {
  return name
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80);
}

// ---- Middleware: single file ----
// Usage: router.post('/x', multer.uploadLabReport, uploadToCloudinary, handler)
async function uploadToCloudinary(req, res, next) {
  try {
    if (!req.file) return next(); // nothing to upload – let downstream handle

    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      buildOptions(req.file)
    );

    req.file.cloudinary = {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
    };

    // Convenience top-level alias
    req.cloudinaryFile = req.file.cloudinary;
    req.uploadedFiles = [req.file.cloudinary];

    next();
  } catch (err) {
    next(err);
  }
}

// ---- Middleware: multiple files ----
async function uploadManyToCloudinary(req, res, next) {
  try {
    const files = req.files || [];
    if (!files.length) return next();

    const uploaded = await Promise.all(
      files.map((f) =>
        uploadBufferToCloudinary(f.buffer, buildOptions(f)).then((result) => ({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format,
          bytes: result.bytes,
          originalName: f.originalname,
          mimetype: f.mimetype,
        }))
      )
    );

    req.uploadedFiles = uploaded;
    next();
  } catch (err) {
    next(err);
  }
}

// ---- Helper: delete by public_id (use when replacing/deleting records) ----
async function destroyCloudinaryFile(publicId, resourceType = 'image') {
  if (!publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Cloudinary destroy failed:', publicId, err.message);
    return null;
  }
}

module.exports = {
  cloudinary,
  uploadBufferToCloudinary,
  uploadToCloudinary,
  uploadManyToCloudinary,
  destroyCloudinaryFile,
  buildOptions,
  FOLDER_MAP,
};