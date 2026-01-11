# 🔍 Payslip PDF Loading Issue - Diagnostic Guide

## Status: ⚠️ PDF Failed to Load

---

## 🐛 **Possible Causes**

### **1. PDF File Not Generated**
The backend might not have created the PDF file yet.

**Check:**
```bash
# In backend directory, check if PDF exists
ls media/payslips/
# Should show: payslip_13.pdf or similar
```

**Solution:**
- Ensure `confirm-payment` endpoint generates the PDF
- Check backend logs for PDF generation errors

---

### **2. Backend Media Serving Not Configured**

Django needs to serve media files in development.

**Check `urls.py`:**
```python
# backend/urls.py or backend/project_name/urls.py
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... your other URLs
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

**Check `settings.py`:**
```python
# backend/settings.py
import os

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

---

### **3. CORS Issue**

The backend might be blocking cross-origin requests to media files.

**Check `settings.py`:**
```python
# backend/settings.py

CORS_ALLOWED_ORIGINS = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

# Allow credentials
CORS_ALLOW_CREDENTIALS = True

# If using django-cors-headers, ensure it's in MIDDLEWARE
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Should be near the top
    'django.middleware.common.CommonMiddleware',
    # ... other middleware
]
```

---

### **4. PDF Not Generated Yet**

The payslip record exists but the PDF file wasn't created.

**Backend Code Check:**
```python
# In confirm-payment view or payslip creation
from reportlab.pdfgen import canvas
import os

def generate_payslip_pdf(payslip):
    # Create media/payslips directory if it doesn't exist
    pdf_dir = os.path.join(settings.MEDIA_ROOT, 'payslips')
    os.makedirs(pdf_dir, exist_ok=True)
    
    # Generate PDF filename
    pdf_filename = f'payslip_{payslip.id}.pdf'
    pdf_path = os.path.join(pdf_dir, pdf_filename)
    
    # Create PDF using reportlab
    c = canvas.Canvas(pdf_path)
    c.drawString(100, 750, f"Payslip #{payslip.id}")
    # ... add more content
    c.save()
    
    # Save URL to database
    payslip.payslip_pdf_url = f'/media/payslips/{pdf_filename}'
    payslip.save()
```

---

## 🧪 **Diagnostic Steps**

### **Step 1: Check Browser Console**

1. Open **Developer Tools** (F12)
2. Go to **Network** tab
3. Click "Download" button
4. Look for the PDF request
5. Check:
   - **Request URL**: Should be `http://localhost:8000/media/payslips/payslip_X.pdf`
   - **Status Code**: Should be `200 OK` (not 404 or 500)
   - **Response**: Should be PDF content

### **Step 2: Test Direct Access**

Try accessing the PDF directly in browser:
```
http://localhost:8000/media/payslips/payslip_13.pdf
```

**Expected:**
- ✅ PDF opens/downloads

**If 404:**
- File doesn't exist → Backend didn't generate it

**If 403:**
- Permission issue → Check file permissions

**If 500:**
- Backend error → Check Django logs

### **Step 3: Check Backend Logs**

```bash
# In backend terminal
# Look for errors when generating payslip
```

### **Step 4: Verify Database**

```python
# Django shell
python manage.py shell

from payroll.models import Payslip
payslip = Payslip.objects.get(id=13)
print(payslip.payslip_pdf_url)  # Should be: /media/payslips/payslip_13.pdf

# Check if file exists
import os
from django.conf import settings
pdf_path = os.path.join(settings.MEDIA_ROOT, 'payslips', 'payslip_13.pdf')
print(os.path.exists(pdf_path))  # Should be: True
```

---

## ✅ **Quick Fixes**

### **Fix 1: Ensure Media Serving (Development)**

**File: `backend/urls.py`**
```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ... existing URLs
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### **Fix 2: Create Media Directory**

```bash
# In backend directory
mkdir -p media/payslips
chmod 755 media/payslips
```

### **Fix 3: Test PDF Generation**

```python
# Django shell
from payroll.models import Payroll, Payslip
from payroll.views import generate_payslip_pdf  # or wherever it's defined

payroll = Payroll.objects.get(id=13)
# Trigger PDF generation
# This depends on your backend implementation
```

---

## 🔧 **Frontend Debugging**

Add console logging to see what URL is being used:

**File: `src/pages/Payroll.tsx`**
```tsx
// In the download button onClick
if (payslip?.payslip_pdf_url) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const pdfUrl = payslip.payslip_pdf_url.startsWith('http') 
    ? payslip.payslip_pdf_url 
    : `${baseUrl}${payslip.payslip_pdf_url}`;
  
  console.log('📄 Opening PDF:', pdfUrl);  // Add this
  console.log('📄 Base URL:', baseUrl);     // Add this
  console.log('📄 PDF URL from DB:', payslip.payslip_pdf_url);  // Add this
  
  window.open(pdfUrl, '_blank');
}
```

---

## 📋 **Checklist**

- [ ] Backend `MEDIA_ROOT` and `MEDIA_URL` configured
- [ ] Backend serves media files in development (urls.py)
- [ ] CORS allows requests from frontend
- [ ] PDF file actually exists in `media/payslips/`
- [ ] Payslip record has correct `payslip_pdf_url`
- [ ] Direct URL access works: `http://localhost:8000/media/payslips/payslip_X.pdf`
- [ ] Frontend uses correct base URL (`http://localhost:8000`)

---

## 🎯 **Most Likely Issue**

Based on the error "Failed to load PDF document", the most common causes are:

1. **Backend not serving media files** (missing `static()` in urls.py)
2. **PDF file doesn't exist** (generation failed)
3. **CORS blocking** (frontend can't access backend media)

**Next Step:** Check the browser console Network tab to see the actual error!
