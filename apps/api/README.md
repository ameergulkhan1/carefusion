# carefusion Backend API

🏥 Complete Node.js/Express backend for ClinixSol healthcare platform with MongoDB, JWT authentication, Socket.IO, and background jobs.

## 🚀 Features

- ✅ **RESTful API** - Complete authentication and user management
- ✅ **JWT Authentication** - Access & refresh tokens with role-based access control
- ✅ **Multi-Role System** - Patient, Doctor, Lab, Pharmacy, Admin
- ✅ **Real-time Communication** - Socket.IO for chat, video calls, and notifications
- ✅ **File Upload** - Multer integration for prescriptions, lab reports, medical records
- ✅ **Email Service** - Nodemailer with pre-built templates
- ✅ **Background Jobs** - Cron jobs for reminders and cleanup
- ✅ **Security** - Helmet, CORS, rate limiting, password hashing
- ✅ **Logging** - Winston logger with file rotation
- ✅ **Validation** - Express-validator for request validation
- ✅ **Error Handling** - Global error handler with proper status codes

## 📁 Project Structure

```
src/
├── config/              # Configuration files
│   ├── database.js      # MongoDB connection
│   ├── jwt.js           # JWT token management
│   ├── email.js         # Email templates
│   ├── multer.js        # File upload config
│   └── socket.js        # Socket.IO config
├── models/              # Mongoose models
│   ├── User.js          # Base user model
│   ├── Patient.js       # Patient profile
│   ├── Doctor.js        # Doctor profile
│   ├── Lab.js           # Laboratory profile
│   ├── Pharmacy.js      # Pharmacy profile
│   └── Appointment.js   # Appointments
├── controllers/         # Request handlers
│   ├── authController.js
│   └── passwordController.js
├── middleware/          # Express middleware
│   ├── auth.js          # JWT verification
│   ├── roleCheck.js     # Role-based access
│   ├── validation.js    # Request validation
│   ├── errorHandler.js  # Error handling
│   ├── rateLimiter.js   # Rate limiting
│   ├── upload.js        # File upload
│   ├── logger.js        # Winston logger
│   └── audit.js         # Audit logging
├── routes/              # API routes
│   └── auth.js          # Auth endpoints
├── services/            # Business logic
│   ├── emailService.js
│   ├── notificationService.js
│   └── fileService.js
├── sockets/             # Socket.IO handlers
│   ├── index.js         # Socket initialization
│   ├── chatSocket.js    # Chat functionality
│   ├── videoSocket.js   # Video call signaling
│   └── notificationSocket.js
├── jobs/                # Background jobs
│   ├── index.js
│   ├── appointmentReminder.js
│   └── cleanup.js
├── utils/               # Utility functions
│   ├── constants.js
│   ├── pagination.js
│   ├── dateHelper.js
│   ├── fileHelper.js
│   └── validator.js
└── server.js            # Entry point
```

## 🛠️ Installation

### Prerequisites
- Node.js 16+ and npm
- MongoDB 5.0+
- Gmail account (for email service)

### 1. Install Dependencies
```bash
cd clinixsol-backend
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/clinixsol

# JWT Secrets (change in production!)
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_REFRESH_SECRET=your_refresh_secret_key

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@clinixsol.com

# Frontend
FRONTEND_URL=http://localhost:3000

# Security
BCRYPT_ROUNDS=10
```

### 3. Start MongoDB
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

### 4. Run Server
```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

Server will start on `http://localhost:5000`

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
POST   /api/auth/refresh-token     - Refresh access token
POST   /api/auth/logout            - Logout user (protected)
GET    /api/auth/me                - Get current user (protected)
GET    /api/auth/verify-email/:token - Verify email
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password/:token - Reset password
POST   /api/auth/change-password   - Change password (protected)
```

### Health Check
```
GET    /health                     - Server health status
```

See [AUTH_API_DOCS.md](./AUTH_API_DOCS.md) for detailed API documentation.

## 🔐 Authentication Flow

1. **Register**: `POST /api/auth/register` → Returns tokens
2. **Login**: `POST /api/auth/login` → Returns tokens
3. **Use Token**: Add `Authorization: Bearer <accessToken>` header
4. **Refresh**: `POST /api/auth/refresh-token` when token expires
5. **Logout**: `POST /api/auth/logout` → Invalidates refresh token

## 🎭 User Roles

- **Patient**: Book appointments, view medical records, chat with doctors
- **Doctor**: Manage appointments, prescribe medicines, video consultations
- **Lab**: Manage lab tests, upload results, process orders
- **Pharmacy**: Manage inventory, process prescriptions, handle deliveries
- **Admin**: Full system access, user management, analytics

## 🔌 Socket.IO Namespaces

### Chat (`/chat`)
```javascript
socket.emit('join', userId);
socket.emit('message:send', { conversationId, message });
socket.on('message:received', callback);
socket.emit('typing:start', { conversationId, userId });
```

### Video (`/video`)
```javascript
socket.emit('join:consultation', consultationId);
socket.emit('webrtc:offer', { consultationId, offer });
socket.emit('webrtc:answer', { answer, targetSocketId });
socket.emit('video:toggle', { consultationId, enabled });
```

### Notifications (`/notifications`)
```javascript
socket.emit('join', userId);
socket.on('notification:new', callback);
socket.emit('notification:read', { notificationId, userId });
```

## ⏰ Background Jobs

### Appointment Reminders
- Runs every hour
- Sends email 24 hours before appointment

### Cleanup Jobs
- **Temp Files**: Daily at 2 AM
- **Expired Sessions**: Daily at 3 AM
- **Old Notifications**: Weekly on Sunday at 4 AM

## 📧 Email Templates

Available templates:
- Welcome email
- Password reset
- Appointment confirmation
- Appointment reminder
- Lab results ready
- Prescription ready

## 🔒 Security Features

- Password hashing with bcrypt (10 rounds)
- JWT access tokens (7 days) & refresh tokens (30 days)
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation & sanitization
- SQL injection prevention (MongoDB)
- XSS protection
- Audit logging for critical actions

## 📊 Logging

Logs are stored in `/logs` directory:
- `error.log` - Error level logs
- `combined.log` - All logs
- Console output in development

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 📦 File Upload

Supported file types:
- Images: JPEG, PNG
- Documents: PDF, DOC, DOCX

Categories:
- `/uploads/prescriptions/`
- `/uploads/lab-reports/`
- `/uploads/documents/`
- `/uploads/profile-images/`

Max file size: 10MB

## 🚧 Development

### Add New Route Module

1. Create model in `src/models/`
2. Create controller in `src/controllers/`
3. Create route in `src/routes/`
4. Register route in `src/server.js`

### Add New Socket Event

1. Add handler in appropriate socket file
2. Update socket initialization in `src/sockets/index.js`

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### MongoDB Connection Error
- Ensure MongoDB service is running
- Check `MONGODB_URI` in `.env`
- Verify network connectivity

### Email Not Sending
- Enable "Less secure app access" in Gmail
- Use App Password instead of regular password
- Check firewall settings for SMTP port 587

## 📝 TODO

- [ ] Add remaining route modules (patients, doctors, appointments, etc.)
- [ ] Implement Google OAuth integration
- [ ] Add payment gateway integration
- [ ] Create database seeds for testing
- [ ] Add API documentation with Swagger
- [ ] Implement Redis for session management
- [ ] Add unit and integration tests
- [ ] Docker containerization
- [ ] CI/CD pipeline

## 🤝 Contributing

1. Follow existing code structure
2. Add validation for all inputs
3. Include error handling
4. Update documentation
5. Add tests for new features

## 📄 License

MIT License - see LICENSE file

## 👥 Team

ClinixSol Development Team

---

**Status**: ✅ Authentication Module Complete | 🚧 Other Modules In Progress
**Version**: 1.0.0
**Last Updated**: February 2026
