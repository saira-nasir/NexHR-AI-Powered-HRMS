# NexHR Attendance Features - Manual Testing Guide

## 🎯 Overview
This guide will help you test the new attendance features we just implemented:
1. **Employee Dropdown** for face registration
2. **Company Location Settings**
3. **Geolocation Capture** for check-in/out

## ⚠️ Prerequisites

### Backend Must Be Running
The frontend is currently stuck on a loading screen because the backend API is not accessible. You need to:

1. **Start the Backend Server**
   - Navigate to your backend directory
   - Start the Django/Python backend server
   - Ensure it's running on the expected port (usually `http://localhost:8000`)

2. **Verify Backend Endpoints**
   Make sure these endpoints are available:
   - `GET /company-users/` - For fetching employee list
   - `GET /company/location/` - For fetching company coordinates (NEW)
   - `POST /company/location/` - For saving company coordinates (NEW)
   - `POST /attendance/register-face/` - For face registration (MODIFIED to accept `employee_id`)
   - `POST /attendance/mark-attendance-face/` - For face check-in (MODIFIED to accept `latitude`, `longitude`)
   - `POST /attendance/manual-attendance/` - For manual check-in/out (MODIFIED to accept `latitude`, `longitude`)

## 🚀 Testing Steps

### Step 1: Access the Application

1. Open your browser
2. Navigate to: **http://localhost:8080/**
3. Log in with your credentials
4. You should see the dashboard

### Step 2: Test Register Face Page

#### A. Navigate to Register Face
1. From the dashboard, click on **"Register Face"** or navigate to `/register-face`
2. You should see **three tabs**: Camera, Upload Photo, and Settings

#### B. Test Employee Dropdown
1. Look for the **"Select Employee"** card at the top
2. Click on the dropdown
3. **Expected Result**: 
   - You should see a list of all employees
   - Each employee shows: `FirstName LastName (email@example.com)`
4. Select an employee from the list
5. **Expected Result**: The selected employee is highlighted

#### C. Test Face Registration with Selected Employee
1. With an employee selected, go to the **"Camera"** tab
2. Click **"Capture Photo"** to take a photo
3. **Expected Result**: 
   - Photo is captured
   - API call is made with `employee_id` parameter
   - Success message: "Face Registered Successfully"
   - The face is registered for the SELECTED employee, not the logged-in user

**OR**

1. Go to the **"Upload Photo"** tab
2. Click **"Select Photo"** and choose an image file
3. Click **"Register Face"**
4. **Expected Result**: Same as above

#### D. Test Company Location Settings
1. Click on the **"Settings"** tab
2. You should see:
   - **Latitude** input field
   - **Longitude** input field
   - A tip about getting coordinates from Google Maps
   - **"Save Company Location"** button

3. **Get Coordinates** (Example):
   - Go to [Google Maps](https://maps.google.com)
   - Right-click on your company location
   - Click on the coordinates (e.g., `40.7128, -74.0060`)
   - Copy the latitude (first number) and longitude (second number)

4. **Enter Coordinates**:
   - Latitude: `40.7128` (example)
   - Longitude: `--74.0060` (example)

5. Click **"Save Company Location"**
6. **Expected Result**:
   - Success toast: "Company location saved successfully"
   - Coordinates are saved to backend
   - If you refresh the page, the coordinates should still be there

### Step 3: Test Attendance with Geolocation

#### A. Navigate to Attendance Page
1. From the dashboard, click on **"Attendance & Leave"** or navigate to `/attendance-leave`
2. You should see the attendance page with check-in/out buttons

#### B. Test Face Check-In with Geolocation
1. Click **"Face Check In"** button
2. **Browser Permission Prompt**: 
   - Browser will ask: "Allow [site] to access your location?"
   - Click **"Allow"**

3. **Expected Result**:
   - Webcam activates
   - Take a photo
   - Console log shows: `User location captured: { userLatitude: XX.XXXX, userLongitude: XX.XXXX }`
   - API call includes `latitude` and `longitude` in FormData
   - Success toast: "Check-In Successful"

4. **If Location is Denied**:
   - Warning toast: "Location access denied - Continuing without location data"
   - Check-in still works, but without coordinates

#### C. Test Manual Check-In with Geolocation
1. Click **"Manual Check In"** button
2. **Browser Permission Prompt** (if not already granted)
3. **Expected Result**:
   - Console log shows: `User location captured: { userLatitude: XX.XXXX, userLongitude: XX.XXXX }`
   - API call includes `latitude` and `longitude` in payload
   - Success toast: "Check-In Successful"

#### D. Test Check-Out with Geolocation
1. After checking in, click **"Check Out"** button
2. Confirm the checkout
3. **Expected Result**:
   - Console log shows: `User location captured: { userLatitude: XX.XXXX, userLongitude: XX.XXXX }`
   - API call includes `latitude` and `longitude` in payload
   - Success toast: "Check-Out Successful"
   - Work hours are calculated and displayed

### Step 4: Verify Backend Data

#### A. Check Database
After testing, verify in your database:

1. **Company Location Table**:
   ```sql
   SELECT * FROM company_location;
   ```
   - Should show the latitude and longitude you saved

2. **Attendance Records**:
   ```sql
   SELECT * FROM attendance ORDER BY id DESC LIMIT 5;
   ```
   - Should show recent check-ins with `latitude` and `longitude` columns populated

3. **Face Registration**:
   ```sql
   SELECT * FROM face_registration ORDER BY id DESC LIMIT 5;
   ```
   - Should show the `employee_id` of the selected employee

#### B. Check API Logs
Look at your backend server logs to see:
- API calls being made
- Parameters being received
- Any errors or warnings

## 🔍 What to Look For

### Browser Console (F12)
Open Developer Tools and check:

1. **Console Tab**:
   - Look for: `User location captured: { userLatitude: ..., userLongitude: ... }`
   - Look for: `🔄 Fetching company employees...`
   - Look for any errors (red text)

2. **Network Tab**:
   - Filter by: `XHR` or `Fetch`
   - Look for API calls to:
     - `/company-users/`
     - `/company/location/`
     - `/attendance/register-face/`
     - `/attendance/mark-attendance-face/`
     - `/attendance/manual-attendance/`
   - Check the **Payload** tab to see if coordinates are being sent

### Expected API Payloads

#### Face Registration (FormData)
```
reference_image: [File]
employee_id: "123"
```

#### Face Check-In (FormData)
```
captured_image: [File]
photo: [File]
latitude: "40.7128"
longitude: "-74.0060"
```

#### Manual Check-In (JSON)
```json
{
  "checkin": true,
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

#### Manual Check-Out (JSON)
```json
{
  "checkout": true,
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

## ✅ Test Checklist

Use this checklist to track your testing:

### Register Face Page
- [ ] Page loads successfully
- [ ] Three tabs are visible (Camera, Upload, Settings)
- [ ] Employee dropdown loads and shows employees
- [ ] Can select an employee from dropdown
- [ ] Face registration works with Camera tab
- [ ] Face registration works with Upload tab
- [ ] Face is registered for selected employee (check backend)
- [ ] Settings tab shows latitude/longitude inputs
- [ ] Can enter and save company location
- [ ] Saved location persists after page refresh

### Attendance Page
- [ ] Page loads successfully
- [ ] Face Check-In button is visible
- [ ] Manual Check-In button is visible
- [ ] Check-Out button is visible (disabled until checked in)

### Geolocation Capture
- [ ] Browser requests location permission on first check-in
- [ ] Location coordinates appear in console log
- [ ] Face Check-In includes coordinates in API call
- [ ] Manual Check-In includes coordinates in API call
- [ ] Check-Out includes coordinates in API call
- [ ] System works when location permission is denied
- [ ] Warning toast shown when location is denied

### Backend Verification
- [ ] Company location saved in database
- [ ] Attendance records include latitude/longitude
- [ ] Face registration includes correct employee_id
- [ ] API logs show correct payloads

## 🐛 Troubleshooting

### Issue: Loading Screen Stuck
**Solution**: Backend is not running. Start your Django/Python backend server.

### Issue: Employee Dropdown is Empty
**Solution**: 
- Check if `/company-users/` endpoint is working
- Verify there are employees in the database
- Check browser console for errors

### Issue: Location Permission Not Requested
**Solution**:
- Make sure you're using HTTPS or localhost (HTTP is blocked for geolocation)
- Check browser settings - location may be blocked for the site
- Try a different browser

### Issue: "Failed to save company location"
**Solution**:
- Verify `/company/location/` POST endpoint exists in backend
- Check backend logs for errors
- Ensure database table exists

### Issue: Coordinates Not in Database
**Solution**:
- Check backend is receiving the `latitude` and `longitude` parameters
- Verify database columns exist for storing coordinates
- Check backend logs for any validation errors

## 📝 Notes

1. **HTTPS Requirement**: Modern browsers require HTTPS for geolocation API. Localhost is exempt from this requirement.

2. **Location Accuracy**: The `enableHighAccuracy: true` option requests GPS-level accuracy, which may take longer to acquire.

3. **Timeout**: Geolocation has a 10-second timeout. If it takes longer, it will fail gracefully.

4. **Privacy**: Users can deny location permission, and the system will continue to work without coordinates.

5. **Browser Compatibility**: Geolocation API is supported in all modern browsers (Chrome, Firefox, Safari, Edge).

## 🎉 Success Criteria

Your testing is successful if:
1. ✅ Employee dropdown loads and allows selection
2. ✅ Face registration applies to selected employee
3. ✅ Company location can be saved and retrieved
4. ✅ Browser requests location permission
5. ✅ Coordinates are captured and logged to console
6. ✅ Coordinates are sent in API payloads
7. ✅ Coordinates are stored in database
8. ✅ System works gracefully when location is denied

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Check the backend server logs
3. Verify all endpoints are implemented
4. Ensure database tables/columns exist
5. Review the `IMPLEMENTATION_SUMMARY.md` for technical details

---

**Happy Testing! 🚀**
