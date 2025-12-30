# Backend Implementation Guide - Company Location & Geolocation

## 🎯 Missing Endpoint: `/api/company/location/`

Your backend logs show:
```
Not Found: /api/company/location/
[29/Dec/2025 07:27:12] "POST /api/company/location/ HTTP/1.1" 404 10534
```

You need to implement this endpoint to save and retrieve company location coordinates.

---

## 📝 Step-by-Step Implementation

### Step 1: Create the Model

Add this to your `models.py` (in your company or core app):

```python
from django.db import models
from django.contrib.auth.models import User

class CompanyLocation(models.Model):
    """Store company's official location coordinates for attendance verification"""
    company = models.OneToOneField(
        'Company',  # Replace with your actual Company model
        on_delete=models.CASCADE,
        related_name='location'
    )
    latitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6,
        help_text="Company latitude coordinate"
    )
    longitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6,
        help_text="Company longitude coordinate"
    )
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='company_locations_created'
    )

    class Meta:
        db_table = 'company_location'
        verbose_name = 'Company Location'
        verbose_name_plural = 'Company Locations'

    def __str__(self):
        return f"{self.company.name} - ({self.latitude}, {self.longitude})"
```

### Step 2: Create the Serializer

Add this to your `serializers.py`:

```python
from rest_framework import serializers
from .models import CompanyLocation

class CompanyLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyLocation
        fields = ['id', 'latitude', 'longitude', 'address', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_latitude(self, value):
        """Validate latitude is within valid range"""
        if not -90 <= float(value) <= 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        return value

    def validate_longitude(self, value):
        """Validate longitude is within valid range"""
        if not -180 <= float(value) <= 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        return value
```

### Step 3: Create the View

Add this to your `views.py`:

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import CompanyLocation
from .serializers import CompanyLocationSerializer

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def company_location(request):
    """
    GET: Retrieve company location
    POST: Create or update company location
    """
    
    # Get user's company
    try:
        company = request.user.company  # Adjust based on your User-Company relationship
    except AttributeError:
        return Response(
            {'error': 'User is not associated with any company'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if request.method == 'GET':
        try:
            location = CompanyLocation.objects.get(company=company)
            serializer = CompanyLocationSerializer(location)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CompanyLocation.DoesNotExist:
            return Response(
                {'message': 'Company location not set'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    elif request.method == 'POST':
        try:
            # Check if location already exists
            location = CompanyLocation.objects.filter(company=company).first()
            
            if location:
                # Update existing location
                serializer = CompanyLocationSerializer(location, data=request.data, partial=True)
            else:
                # Create new location
                serializer = CompanyLocationSerializer(data=request.data)
            
            if serializer.is_valid():
                if location:
                    serializer.save()
                    message = 'Company location updated successfully'
                else:
                    serializer.save(company=company, created_by=request.user)
                    message = 'Company location created successfully'
                
                return Response({
                    'message': message,
                    'data': serializer.data
                }, status=status.HTTP_200_OK)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

### Step 4: Add URL Route

Add this to your `urls.py`:

```python
from django.urls import path
from . import views

urlpatterns = [
    # ... your existing URLs ...
    path('company/location/', views.company_location, name='company-location'),
]
```

### Step 5: Run Migrations

```bash
# Create migration
python manage.py makemigrations

# Apply migration
python manage.py migrate
```

---

## 🔧 Update Attendance Models (Optional but Recommended)

To store user location with attendance records, update your Attendance model:

```python
class Attendance(models.Model):
    # ... your existing fields ...
    
    # Add these fields for geolocation
    checkin_latitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        null=True, 
        blank=True,
        help_text="User's latitude at check-in"
    )
    checkin_longitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        null=True, 
        blank=True,
        help_text="User's longitude at check-in"
    )
    checkout_latitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        null=True, 
        blank=True,
        help_text="User's latitude at check-out"
    )
    checkout_longitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        null=True, 
        blank=True,
        help_text="User's longitude at check-out"
    )
    
    # Optional: Calculate distance from company location
    distance_from_office = models.FloatField(
        null=True, 
        blank=True,
        help_text="Distance in kilometers from company location"
    )
```

### Update Attendance Views

Modify your attendance check-in/check-out views to accept and store coordinates:

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def manual_attendance(request):
    """Handle manual check-in and check-out with geolocation"""
    
    # Get coordinates from request
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')
    
    if request.data.get('checkin'):
        # Create attendance record
        attendance = Attendance.objects.create(
            employee=request.user,
            date=timezone.now().date(),
            check_in=timezone.now(),
            checkin_latitude=latitude,
            checkin_longitude=longitude
        )
        
        # Optional: Calculate distance from company location
        if latitude and longitude:
            try:
                company_location = CompanyLocation.objects.get(company=request.user.company)
                distance = calculate_distance(
                    float(latitude), 
                    float(longitude),
                    float(company_location.latitude),
                    float(company_location.longitude)
                )
                attendance.distance_from_office = distance
                attendance.save()
            except CompanyLocation.DoesNotExist:
                pass
        
        return Response({
            'message': 'Checked in successfully',
            'checkin_time': attendance.check_in
        })
    
    elif request.data.get('checkout'):
        # Update attendance record
        attendance = Attendance.objects.filter(
            employee=request.user,
            date=timezone.now().date()
        ).first()
        
        if attendance:
            attendance.check_out = timezone.now()
            attendance.checkout_latitude = latitude
            attendance.checkout_longitude = longitude
            attendance.save()
            
            return Response({
                'message': 'Checked out successfully',
                'checkout_time': attendance.check_out
            })
        
        return Response(
            {'error': 'No check-in record found'},
            status=status.HTTP_400_BAD_REQUEST
        )
```

### Helper Function: Calculate Distance

```python
from math import radians, sin, cos, sqrt, atan2

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two coordinates using Haversine formula
    Returns distance in kilometers
    """
    # Earth's radius in kilometers
    R = 6371.0
    
    # Convert to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    distance = R * c
    
    return round(distance, 2)
```

---

## 🎯 Update Face Registration Endpoint

Modify your face registration view to accept `employee_id`:

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_face(request):
    """Register face for a specific employee"""
    
    reference_image = request.FILES.get('reference_image')
    employee_id = request.data.get('employee_id')
    
    if not reference_image:
        return Response(
            {'error': 'No image uploaded'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # If employee_id is provided, use it; otherwise use current user
    if employee_id:
        try:
            employee = User.objects.get(id=employee_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Employee not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    else:
        employee = request.user
    
    # Save face registration
    face_registration, created = FaceRegistration.objects.update_or_create(
        employee=employee,
        defaults={'reference_image': reference_image}
    )
    
    return Response({
        'message': f'Face registered successfully for {employee.get_full_name()}',
        'employee': employee.id,
        'created': created
    }, status=status.HTTP_201_CREATED)
```

---

## ✅ Testing Checklist

After implementing the above:

1. **Run migrations**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

2. **Restart your Django server**

3. **Test the endpoints**:
   - POST `/api/company/location/` with `{"latitude": 40.7580, "longitude": -73.9855}`
   - GET `/api/company/location/` to retrieve saved location
   - POST `/api/attendance/manual-attendance/` with coordinates
   - POST `/api/attendance/register-face/` with `employee_id`

4. **Check your backend logs** - You should see:
   ```
   [29/Dec/2025 XX:XX:XX] "POST /api/company/location/ HTTP/1.1" 200 XXX
   ```

---

## 📊 Database Schema

After migrations, you'll have:

**company_location table:**
- id (PK)
- company_id (FK)
- latitude (Decimal)
- longitude (Decimal)
- address (Text, optional)
- created_at (DateTime)
- updated_at (DateTime)
- created_by_id (FK to User)

**attendance table (updated):**
- ... existing fields ...
- checkin_latitude (Decimal, nullable)
- checkin_longitude (Decimal, nullable)
- checkout_latitude (Decimal, nullable)
- checkout_longitude (Decimal, nullable)
- distance_from_office (Float, nullable)

---

## 🚀 Next Steps

1. Copy the code above to your backend
2. Run migrations
3. Restart your Django server
4. Test in the frontend - the 404 error should be gone!

Let me know if you need help with any specific part!
