# LikaFood Authentication Testing Guide

## 🚀 Quick Start

### Prerequisites
1. **Backend Server Running**: `cd backend && npm run dev`
2. **Frontend Server Running**: `npm start` (should be on http://localhost:3000)
3. **MongoDB Atlas Connected**: Check backend logs for connection confirmation

### Test the Complete Authentication Flow

#### Step 1: Registration
1. Open http://localhost:3000 in your browser
2. You should see the login page (no auto-login in development)
3. Enter a **new phone number** (e.g., `+1234567891`)
4. Click "Send OTP" - this should prompt for registration
5. Fill in:
   - **Business Name**: "Test Restaurant"
   - **Owner Name**: "Test Owner"
6. Click "Register" - this sends OTP

#### Step 2: OTP Verification
1. Check the **backend terminal logs** for the OTP code
2. Look for a message like:
   ```
   📱 MOCK SMS SERVICE
   ═══════════════════
   📞 To: +1234567891
   💬 Message: Bienvenue sur LikaFood! Votre code de vérification est: 123456
   🔑 OTP Code: 123456
   ═══════════════════
   ```
3. Enter the **6-digit OTP code** in the frontend
4. Click "Verify" - this should log you in

#### Step 3: Verify Login Success
1. You should be redirected to the main dashboard
2. Check that you're logged in (user info should be displayed)
3. Try navigating to different pages

## 🔧 Troubleshooting

### Backend Issues
- **Connection Refused**: Make sure backend is running on port 5001
- **MongoDB Issues**: Check `.env` file for correct `MONGODB_URI`
- **OTP Not Generated**: Check backend logs for errors

### Frontend Issues
- **API Errors**: Check browser console for network errors
- **Login Loop**: Clear localStorage and try again
- **Page Not Loading**: Make sure React dev server is on port 3000

### Common Solutions
```bash
# Restart backend
cd backend && npm run dev

# Restart frontend
npm start

# Clear browser data
# Go to Developer Tools > Application > Storage > Clear storage

# Check if servers are running
lsof -i :3000  # Frontend
lsof -i :5001  # Backend
```

## 📱 Test Different Scenarios

### 1. New User Registration
- Use a phone number that hasn't been used before
- Complete the full registration flow

### 2. Existing User Login
- Try to "Send OTP" with an existing phone number
- Should go directly to OTP verification (skip registration)

### 3. Invalid OTP
- Enter wrong OTP code
- Should show error message

### 4. Expired OTP
- Wait 10 minutes and try to use an old OTP
- Should show expiration error

## 🎯 Expected Behavior

### Registration Flow
1. Phone number entry → Registration form
2. Registration form → OTP sent
3. OTP verification → Login success

### Login Flow (Existing User)
1. Phone number entry → OTP sent directly
2. OTP verification → Login success

### Error Handling
- Invalid phone format → Error message
- Missing fields → Validation errors
- Network issues → Fallback to mock data (if enabled)
- Invalid OTP → Clear error message

## 📊 Database Verification

Run this to check if data is being saved:
```bash
cd backend && node check-database.js
```

This will show:
- Number of users in database
- Number of OTP records
- Sample user data

## 🔐 Security Notes

- OTPs expire after 10 minutes
- Rate limiting prevents spam
- JWT tokens are used for session management
- Phone numbers are validated and formatted
- All API endpoints require proper authentication

## 🚀 Next Steps After Testing

1. **SMS Integration**: Replace mock SMS with real service (Twilio)
2. **Email Notifications**: Add email verification
3. **Menu Management**: Build dish creation features
4. **Order System**: Implement order processing
5. **Analytics**: Add business insights dashboard

---

**Happy Testing! 🎉**

If you encounter any issues, check the backend logs first, then the browser console for frontend errors.