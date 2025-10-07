# 🚀 Quick Test Guide - Smart Auth Hub

## ⚡ **Instant Testing (5 Minutes)**

### **Step 1: Create Admin User**
```bash
cd backend
npm run create-admin
```

### **Step 2: Test Regular User Flow**
1. **Open browser preview** → http://localhost:5173
2. **Enter email**: `user@example.com`
3. **Click "Send OTP"**
4. **Check backend console** for OTP (e.g., `123456`)
5. **Enter OTP** → Should reach user dashboard

### **Step 3: Test Admin Flow**
1. **Click "Logout"** (if logged in)
2. **Enter email**: `admin@example.com`
3. **Get OTP from console** and login
4. **Navigate to**: http://localhost:5173/admin
5. **Explore admin dashboard**

## 🎯 **Key Features to Test**

### **Authentication**
- ✅ Email OTP: `test@example.com`
- ✅ Phone OTP: `+1234567890`
- ✅ Resend OTP button
- ✅ Rate limiting (try 6+ requests)

### **User Dashboard**
- ✅ Login statistics
- ✅ Location tracking
- ✅ Login history
- ✅ Security tips

### **Admin Dashboard**
- ✅ User management
- ✅ Login monitoring
- ✅ Search/filter functionality
- ✅ Security analytics

### **Security Features**
- ✅ Location detection
- ✅ Anomaly detection
- ✅ Session management
- ✅ Route protection

## 🔍 **Testing Routes**

| Route | Access | Purpose |
|-------|--------|---------|
| `/` | Public | Authentication |
| `/dashboard` | User | User dashboard |
| `/admin` | Admin only | Admin panel |

## 📊 **Test Data**

### **Regular Users**
- `user1@example.com`
- `user2@example.com`
- `+1234567890`
- `+9876543210`

### **Admin User**
- `admin@example.com` (created by script)

## 🐛 **Quick Troubleshooting**

| Issue | Solution |
|-------|----------|
| No OTP received | Check backend console |
| Can't access admin | Run `npm run create-admin` |
| Dashboard not loading | Check browser console |
| Location shows "Local" | Normal for localhost |

## ✅ **5-Minute Test Checklist**

- [ ] Regular user login works
- [ ] Admin user login works
- [ ] Dashboard displays correctly
- [ ] Admin panel accessible
- [ ] OTPs appear in console
- [ ] Location tracking works
- [ ] Logout functionality works

**All working? You're ready to deploy! 🎉**
