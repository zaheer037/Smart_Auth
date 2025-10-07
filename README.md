# 🔐 Smart Authentication Hub

A passwordless OTP-based authentication system built with MERN stack and Python microservice for anomaly detection.

## 🏗️ Project Structure

```
smart-auth-hub/
├── frontend/           # React.js + Vite + shadcn/ui
├── backend/           # Node.js + Express + MongoDB
├── python-service/    # Flask microservice for anomaly detection
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- Python 3.8+
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd smart-auth-hub
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Python Service Setup (Optional)
```bash
cd python-service
pip install -r requirements.txt
python app.py
```

## 🔧 Environment Configuration

### Backend (.env)
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/smart-auth-hub

# JWT Secret (generate a strong secret)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Email Configuration (Gmail example)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Twilio Configuration (for SMS)
TWILIO_SID=your_twilio_account_sid
TWILIO_TOKEN=your_twilio_auth_token
TWILIO_PHONE=+1234567890

# Python Service
PYTHON_SERVICE_URL=http://localhost:5000

# Server
PORT=3001
NODE_ENV=development
```

### Python Service (.env)
```bash
FLASK_ENV=development
PORT=5000
```

## 📋 Features

### ✅ Core Authentication
- **Passwordless Login:** Email/Phone OTP verification
- **Secure Sessions:** JWT-based authentication
- **Rate Limiting:** Protection against brute force attacks
- **Input Validation:** Comprehensive data validation

### ✅ Security Features
- **Location Tracking:** IP-based geolocation
- **Anomaly Detection:** ML-powered suspicious login detection
- **Risk Scoring:** Real-time risk assessment
- **Session Management:** Secure token handling

### ✅ User Experience
- **Modern UI:** Built with shadcn/ui components
- **Responsive Design:** Mobile-first approach
- **Real-time Feedback:** Toast notifications
- **Accessibility:** WCAG compliant components

### ✅ Admin Features
- **User Management:** View and manage all users
- **Login Monitoring:** Real-time login activity
- **Security Dashboard:** Comprehensive analytics
- **Risk Analysis:** Detailed security insights

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Axios** - HTTP client for API calls
- **React Router** - Client-side routing

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for auth
- **bcryptjs** - Password hashing
- **Nodemailer** - Email sending
- **Twilio** - SMS service
- **geoip-lite** - IP geolocation

### Python Microservice
- **Flask** - Lightweight web framework
- **NumPy** - Numerical computing
- **scikit-learn** - Machine learning library
- **Flask-CORS** - Cross-origin resource sharing

## 🔒 Security Implementation

### Authentication Flow
1. User enters email/phone
2. System generates 6-digit OTP
3. OTP sent via email/SMS
4. User verifies OTP
5. JWT token issued for session

### Anomaly Detection
- **Location Analysis:** Detects impossible travel
- **Time Patterns:** Identifies unusual login times
- **Device Fingerprinting:** Tracks device changes
- **Risk Scoring:** 0-100 risk assessment

### Security Measures
- **Rate Limiting:** 5 OTP requests per 15 minutes
- **OTP Expiry:** 2-minute expiration
- **Attempt Limiting:** Max 3 verification attempts
- **IP Tracking:** Comprehensive logging
- **CORS Protection:** Configured origins
- **Helmet.js:** Security headers

## 📊 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP & login
- `POST /api/auth/resend-otp` - Resend OTP

### User Management
- `GET /api/user/profile` - Get user profile
- `GET /api/user/login-history` - Get login history
- `GET /api/user/stats` - Get user statistics
- `PUT /api/user/profile` - Update profile

### Admin Panel
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/users` - All users with pagination
- `GET /api/admin/logins` - All login history
- `GET /api/admin/user/:id` - Specific user details

### Python Microservice
- `POST /analyze-login` - Analyze login for anomalies
- `GET /get-risk-factors` - Get risk factor weights

## 🚀 Deployment

### Frontend (Netlify/Vercel)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Render/Railway)
```bash
# Set environment variables
# Deploy from GitHub
```

### Python Service (Azure/Railway)
```bash
pip install -r requirements.txt
python app.py
```

## 🧪 Testing

### Manual Testing Flow
1. **Registration:** Enter email/phone → Receive OTP
2. **Verification:** Enter OTP → Login successful
3. **Dashboard:** View login history and stats
4. **Admin Panel:** Monitor users and security

### Test Accounts
- Create admin user by setting `role: 'admin'` in database
- Test with different locations using VPN
- Test rate limiting with multiple requests

## 🐛 Troubleshooting

### Common Issues
1. **MongoDB Connection:** Ensure MongoDB is running
2. **CORS Errors:** Check frontend/backend URLs
3. **OTP Not Received:** Check email/SMS configuration
4. **Port Conflicts:** Change ports in .env files

### Development Tips
- Use MongoDB Compass for database visualization
- Check browser console for frontend errors
- Monitor backend logs for API issues
- Test with different browsers and devices

## 📈 Performance Metrics

- **OTP Delivery:** < 5 seconds
- **Login Verification:** < 2 seconds
- **Dashboard Load:** < 3 seconds
- **API Response:** < 500ms average

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

**Zaheer Maseed**  
Full-Stack Developer  
October 2025
