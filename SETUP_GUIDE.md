# 🚀 Smart Auth Hub - Setup Guide

## 🎯 **Quick Start (No Setup Required)**

The app works immediately in development mode:
1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Test Login**: Enter email/phone → Check backend console for OTP
4. **Enter OTP**: Complete authentication flow

## 📧 **Email Setup (Gmail)**

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification → Turn On

### Step 2: Generate App Password
1. Security → 2-Step Verification → App passwords
2. Select app: "Mail" → Select device: "Other"
3. Name it: "Smart Auth Hub"
4. **Copy the 16-character password**

### Step 3: Update .env
```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

## 📱 **SMS Setup (Twilio)**

### Step 1: Create Twilio Account
1. Sign up at [Twilio.com](https://www.twilio.com/)
2. Verify your phone number
3. Get $15 free trial credit

### Step 2: Get Credentials
1. **Account SID**: Dashboard → Account Info
2. **Auth Token**: Dashboard → Account Info → Show
3. **Phone Number**: Phone Numbers → Manage → Buy a number

### Step 3: Update .env
```bash
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TOKEN=your_auth_token_here
TWILIO_PHONE=+1234567890
```

## 🗄️ **Database Setup**

### Option 1: Local MongoDB
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod --dbpath /path/to/data/directory
```

### Option 2: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Update .env:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-auth-hub
```

## 🐍 **Python Microservice (Optional)**

### Setup
```bash
cd python-service
pip install -r requirements.txt
python app.py
```

### Features
- Advanced anomaly detection
- ML-based risk scoring
- Location analysis

## 🧪 **Testing the Application**

### 1. **Development Mode (Current)**
- Enter email: `test@example.com`
- Check backend console for OTP: `123456`
- Enter OTP to complete login

### 2. **With Email Configured**
- Enter your real email
- Check your inbox for OTP
- Enter OTP to login

### 3. **With SMS Configured**
- Enter phone: `+1234567890`
- Check your phone for SMS
- Enter OTP to login

### 4. **Admin Features**
- Create admin user in database:
```javascript
// In MongoDB
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```
- Login and access `/admin` route

## 🔒 **Security Features to Test**

### Location Tracking
- Login from different locations (use VPN)
- Check dashboard for location history
- Observe suspicious login detection

### Rate Limiting
- Try multiple OTP requests quickly
- System will block after 5 requests in 15 minutes

### Anomaly Detection
- Login from new country/city
- Check risk scoring in admin panel

## 🚨 **Troubleshooting**

### Backend Issues
```bash
# Check MongoDB connection
npm run dev
# Look for "✅ Connected to MongoDB"

# Check OTP in console
# Look for "🔐 OTP sent to..."
```

### Frontend Issues
```bash
# Clear browser cache
# Check browser console for errors
# Verify API calls to http://localhost:3001
```

### Email Issues
```bash
# Verify Gmail app password (16 characters)
# Check "Less secure app access" if needed
# Test with a simple email first
```

### SMS Issues
```bash
# Verify Twilio credentials
# Check account balance
# Ensure phone number is verified
```

## 📊 **Current Status**

✅ **Working Now:**
- User registration and login
- OTP generation (console output)
- JWT authentication
- Location tracking
- User dashboard
- Admin panel
- MongoDB integration

🔧 **Needs Setup:**
- Email delivery (optional)
- SMS delivery (optional)
- Python microservice (optional)

## 🎉 **Ready to Use!**

The application is **fully functional** right now in development mode. You can:
1. Test the complete authentication flow
2. Explore user and admin dashboards
3. See location tracking in action
4. Experience the modern UI/UX

**Optional:** Set up email/SMS for production-ready OTP delivery.

---

**Need Help?** Check the main README.md for detailed documentation.
