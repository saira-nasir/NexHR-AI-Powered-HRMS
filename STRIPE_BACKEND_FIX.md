# 🔧 Stripe Redirect URL Configuration - Backend Fix Required

## Date: 2026-01-09
## Status: ⚠️ BACKEND CONFIGURATION ISSUE

---

## 🎯 **THE ACTUAL PROBLEM**

**Stripe is NOT redirecting to `http://localhost:8080/success` after payment.**

This is a **backend configuration issue**, not a frontend logout issue!

---

## 🔍 **What's Happening:**

1. User clicks "Pay" ✅
2. Frontend calls: `POST /api/payroll/create-checkout-session/{payroll_id}/` ✅
3. Backend creates Stripe checkout session
4. **Backend sets wrong success_url** ❌
5. Stripe redirects to wrong URL after payment ❌
6. User gets logged out or sees error ❌

---

## ✅ **What Backend Needs to Do:**

### **Backend File to Modify:**
Likely in: `payroll/views.py` or `payroll/stripe_views.py`

### **Current Code (Probably):**
```python
# ❌ WRONG - Hardcoded or missing success URL
stripe.checkout.Session.create(
    payment_method_types=['card'],
    line_items=[{
        'price_data': {
            'currency': 'usd',
            'product_data': {'name': f'Payroll #{payroll_id}'},
            'unit_amount': int(net_salary * 100),
        },
        'quantity': 1,
    }],
    mode='payment',
    # ❌ Missing or wrong URLs
    success_url='http://localhost:8000/success',  # Wrong domain!
    cancel_url='http://localhost:8000/cancel',
)
```

### **Correct Code:**
```python
# ✅ CORRECT - Dynamic URLs based on environment
import os

# Get frontend URL from environment variable
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:8080')

stripe.checkout.Session.create(
    payment_method_types=['card'],
    line_items=[{
        'price_data': {
            'currency': 'usd',
            'product_data': {'name': f'Payroll #{payroll_id}'},
            'unit_amount': int(net_salary * 100),
        },
        'quantity': 1,
    }],
    mode='payment',
    # ✅ Correct frontend URLs with query parameters
    success_url=f'{FRONTEND_URL}/success?session_id={{CHECKOUT_SESSION_ID}}&payroll_id={payroll_id}',
    cancel_url=f'{FRONTEND_URL}/payroll',
    metadata={
        'payroll_id': payroll_id,
        'employee_id': payroll.employee.id,
    }
)
```

---

## 🌍 **Environment Configuration:**

### **Development (.env):**
```bash
FRONTEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:8000
```

### **Production (.env.production):**
```bash
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

---

## 📋 **Backend Checklist:**

- [ ] Find Stripe checkout session creation code
- [ ] Add `FRONTEND_URL` environment variable
- [ ] Update `success_url` to use `FRONTEND_URL`
- [ ] Update `cancel_url` to use `FRONTEND_URL`
- [ ] Include `session_id` and `payroll_id` in success URL
- [ ] Test with `http://localhost:8080/success`
- [ ] Verify redirect works after payment

---

## 🔍 **How to Find the Backend Code:**

### **Search for:**
```bash
# In Django backend
grep -r "checkout.Session.create" .
grep -r "create-checkout-session" .
grep -r "stripe.checkout" .
```

### **Likely Files:**
- `payroll/views.py`
- `payroll/stripe_views.py`
- `payroll/api/views.py`
- `api/payroll/views.py`

---

## 🧪 **Testing:**

### **1. Check Current Stripe Session:**
```python
# In Django shell or view
session = stripe.checkout.Session.create(...)
print(session.success_url)  # Should be: http://localhost:8080/success?session_id=...
print(session.cancel_url)   # Should be: http://localhost:8080/payroll
```

### **2. Test Payment Flow:**
1. Click "Pay" button
2. Complete payment on Stripe
3. Should redirect to: `http://localhost:8080/success?session_id=cs_test_...&payroll_id=123`
4. Should see success page (not login page)

---

## 📝 **Example Backend Implementation:**

```python
# payroll/views.py or similar

from django.conf import settings
import stripe
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['POST'])
def create_checkout_session(request, payroll_id):
    try:
        payroll = Payroll.objects.get(id=payroll_id)
        
        # Get frontend URL from settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:8080')
        
        # Create Stripe checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'Payroll for {payroll.employee.get_full_name()}',
                        'description': f'Period: {payroll.period_start} to {payroll.period_end}',
                    },
                    'unit_amount': int(float(payroll.net_salary) * 100),  # Convert to cents
                },
                'quantity': 1,
            }],
            mode='payment',
            # ✅ Correct URLs
            success_url=f'{frontend_url}/success?session_id={{CHECKOUT_SESSION_ID}}&payroll_id={payroll_id}',
            cancel_url=f'{frontend_url}/payroll',
            metadata={
                'payroll_id': payroll_id,
                'employee_id': payroll.employee.id,
            },
        )
        
        return Response({
            'url': session.url,
            'session_id': session.id,
        })
        
    except Payroll.DoesNotExist:
        return Response({'error': 'Payroll not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
```

### **Add to settings.py:**
```python
# settings.py

# Frontend URL for Stripe redirects
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:8080')
```

---

## 🚨 **Common Mistakes:**

### **❌ Wrong:**
```python
success_url='http://localhost:8000/success'  # Backend URL, not frontend!
success_url='http://localhost:3000/success'  # Wrong port!
success_url='/success'  # Relative URL doesn't work with Stripe!
```

### **✅ Correct:**
```python
success_url='http://localhost:8080/success?session_id={CHECKOUT_SESSION_ID}&payroll_id=123'
```

---

## 📞 **Next Steps:**

1. **Backend Team:** Update Stripe checkout session creation
2. **Add Environment Variable:** `FRONTEND_URL=http://localhost:8080`
3. **Test:** Complete a payment and verify redirect
4. **Production:** Update `FRONTEND_URL` to production domain

---

## 🎯 **Expected Result:**

After payment on Stripe:
```
User on Stripe → Payment Complete
↓
Stripe redirects to: http://localhost:8080/success?session_id=cs_test_abc123&payroll_id=42
↓
Frontend shows PaymentSuccess page ✅
↓
Payment confirmed ✅
↓
User stays logged in ✅
```

---

**This is a backend configuration issue. The backend needs to update the Stripe success_url to point to the frontend!**
