const User = require('../models/User');
const Patient = require('../models/Patient.model');
const Doctor = require('../models/Doctor');
const Lab = require('../models/Lab');
const Pharmacy = require('../models/Pharmacy');
const crypto = require('crypto');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { sendEmail } = require('../config/email');
const { verifyFirebaseIdToken } = require('../config/firebaseAdmin');

const validRoles = ['patient', 'doctor', 'lab', 'laboratory', 'pharmacy'];

const createRoleProfile = async ({ role, userId, fullName }) => {
  if (role === 'patient') {
    return Patient.create({
      user: userId,
      gender: 'other'
    });
  }

  if (role === 'doctor') {
    return Doctor.create({
      user: userId,
      specialization: 'General',
      qualifications: [],
      consultationFee: 0,
      availability: [],
      isVerified: false
    });
  }

  if (role === 'lab') {
    return Lab.create({
      user: userId,
      userId,
      labName: fullName,
      testCatalog: [],
      isVerified: false
    });
  }

  if (role === 'pharmacy') {
    return Pharmacy.create({
      user: userId,
      pharmacyName: fullName,
      inventory: [],
      isVerified: false
    });
  }

  return null;
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      password, 
      phone, 
      dateOfBirth, 
      role, 
      acceptTerms,
      // Lab-specific fields
      labName,
      licenseNumber,
      address,
      location,
      homeCollectionAvailable,
      homeSampleCollectionCharge
    } = req.body;

    // Validation
    if (!acceptTerms) {
      return res.status(400).json({
        success: false,
        message: 'You must accept the terms and conditions'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Validate role (allow laboratory as well)
    const normalizedRole = role === 'laboratory' ? 'lab' : role;
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Create user - Labs will be pending_approval
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      role: normalizedRole,
      fullName,
      phone: phone || null,
      isVerified: false,
      isActive: true,
      status: (normalizedRole === 'lab') ? 'pending_approval' : 'active'
    });

    // Create role-specific profile
    let roleProfile = null;
    
    if (normalizedRole === 'patient' && dateOfBirth) {
      roleProfile = await Patient.create({
        user: user._id,
        dateOfBirth: new Date(dateOfBirth),
        gender: 'other'
      });
    } else if (normalizedRole === 'patient') {
      roleProfile = await Patient.create({
        user: user._id,
        gender: 'other'
      });
    } else if (normalizedRole === 'doctor') {
      roleProfile = await Doctor.create({
        user: user._id,
        specialization: 'General',
        qualifications: [],
        consultationFee: 0,
        availability: [],
        isVerified: false
      });
    } else if (normalizedRole === 'lab') {
      // Parse location coordinates if provided
      let locationObj = { type: 'Point', coordinates: [0, 0] };
      if (location && location.lat && location.lng) {
        locationObj = { 
          type: 'Point', 
          coordinates: [location.lng, location.lat] // GeoJSON uses [longitude, latitude]
        };
      }

      roleProfile = await Lab.create({
        user: user._id,
        userId: user._id,
        labName: labName || fullName,
        licenseNumber: licenseNumber || undefined,
        address: address || {},
        location: locationObj,
        testCatalog: [],
        isVerified: false,
        homeSampleCollection: {
          available: Boolean(homeCollectionAvailable),
          additionalCharge: homeSampleCollectionCharge || 0
        }
      });
    } else if (normalizedRole === 'pharmacy') {
      // For pharmacy, licenseNumber is truly optional
      const pharmacyData = {
        user: user._id,
        pharmacyName: fullName,
        inventory: [],
        isVerified: false
      };
      // Only set licenseNumber if provided, otherwise leave it undefined
      // to take advantage of sparse: true in schema
      if (licenseNumber) {
        pharmacyData.licenseNumber = licenseNumber;
      }
      roleProfile = await Pharmacy.create(pharmacyData);
    }

    // Generate tokens
    const accessToken = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Send welcome email
    try {
      const emailTemplate = normalizedRole === 'lab' ? 'lab_signup_pending' : 'welcome';
      await sendEmail(
        user.email,
        emailTemplate,
        { name: user.fullName, role: normalizedRole }
      );
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
    }

    // Response
    res.status(201).json({
      success: true,
      message: normalizedRole === 'lab' 
        ? 'Laboratory registration submitted for approval' 
        : 'Account created successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          phone: user.phone,
          isVerified: user.isVerified,
          profilePicture: user.profilePicture
        },
        roleProfile: roleProfile ? {
          id: roleProfile._id,
          ...roleProfile.toObject()
        } : null,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Check if laboratory is pending approval
    if (user.role === 'lab' && user.status === 'pending_approval') {
      return res.status(403).json({
        success: false,
        message: 'Your laboratory registration is pending admin approval. You will be able to access the system once approved.',
        status: 'pending_approval'
      });
    }

    // Check if laboratory has been rejected
    if (user.role === 'lab' && user.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: `Your laboratory registration has been rejected. Reason: ${user.rejectionReason || 'Not specified'}`,
        status: 'rejected'
      });
    }

    // Verify password
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens with extended expiry if rememberMe is true
    const accessToken = generateToken(user._id, user.role, rememberMe ? '30d' : undefined);
    const refreshToken = generateRefreshToken(user._id, rememberMe ? '90d' : undefined);

    // Update refresh token and last login
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // Get role-specific profile
    let roleProfile = null;
    
    if (user.role === 'patient') {
      roleProfile = await Patient.findOne({ $or: [{ user: user._id }, { userId: user._id }] });
    } else if (user.role === 'doctor') {
      roleProfile = await Doctor.findOne({ $or: [{ user: user._id }, { userId: user._id }] });
    } else if (user.role === 'lab') {
      roleProfile = await Lab.findOne({ $or: [{ user: user._id }, { userId: user._id }] });
    } else if (user.role === 'pharmacy') {
      roleProfile = await Pharmacy.findOne({ $or: [{ user: user._id }, { userId: user._id }] });
    }

    // Response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
          phone: user.phone,
          isVerified: user.isVerified,
          profilePicture: user.profilePicture,
          lastLogin: user.lastLogin
        },
        roleProfile: roleProfile ? {
          id: roleProfile._id,
          ...roleProfile.toObject()
        } : null,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.googleFirebaseAuth = async (req, res) => {
  try {
    const { idToken, role } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID token is required'
      });
    }

    const decodedToken = await verifyFirebaseIdToken(idToken);
    const email = decodedToken.email ? decodedToken.email.toLowerCase() : null;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google account email is required'
      });
    }

    const normalizedRole = validRoles.includes(role) ? role : 'patient';
    let user = await User.findOne({ email }).select('+refreshToken');

    if (!user) {
      const fullName = decodedToken.name || email.split('@')[0];
      const generatedPassword = crypto.randomBytes(32).toString('hex');

      user = await User.create({
        email,
        password: generatedPassword,
        role: normalizedRole,
        fullName,
        phone: null,
        profilePicture: decodedToken.picture || null,
        isVerified: true,
        isActive: true
      });

      await createRoleProfile({ role: user.role, userId: user._id, fullName: user.fullName });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    user.lastLogin = new Date();
    if (!user.isVerified) {
      user.isVerified = true;
    }
    if (!user.profilePicture && decodedToken.picture) {
      user.profilePicture = decodedToken.picture;
    }

    const accessToken = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          phone: user.phone,
          isVerified: user.isVerified,
          profilePicture: user.profilePicture,
          lastLogin: user.lastLogin
        },
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  } catch (error) {
    console.error('Google Firebase auth error:', error);
    const isFirebaseConfigError = /projectId is not configured|credentials are not configured/i.test(error.message || '');

    return res.status(isFirebaseConfigError ? 500 : 401).json({
      success: false,
      message: isFirebaseConfigError
        ? 'Google authentication is not configured on server'
        : 'Google authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Find user
    const user = await User.findById(decoded.userId).select('+refreshToken');
    
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newAccessToken = generateToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    // Response
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get role-specific profile
    let roleProfile = null;
    
    if (user.role === 'patient') {
      roleProfile = await Patient.findOne({ userId: user._id });
    } else if (user.role === 'doctor') {
      roleProfile = await Doctor.findOne({ userId: user._id });
    } else if (user.role === 'lab') {
      roleProfile = await Lab.findOne({ userId: user._id });
    } else if (user.role === 'pharmacy') {
      roleProfile = await Pharmacy.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          phone: user.phone,
          isVerified: user.isVerified,
          profilePicture: user.profilePicture,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        },
        roleProfile: roleProfile ? roleProfile.toObject() : null
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user by verification token (implement token-based verification)
    // For now, placeholder implementation
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
