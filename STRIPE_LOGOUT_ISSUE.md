# 🔒 Stripe Payment Logout Issue - Analysis & Solution

## Date: 2026-01-09
## Status: 🔍 IDENTIFIED - Solution Proposed

---

## 🐛 **THE PROBLEM**

**User gets logged out after completing Stripe payment instead of seeing success page.**

### **User Flow:**
1. User clicks "Pay" button ✅
2. Redirects to Stripe ✅  
3. Completes payment on Stripe ✅
4. Returns to app → **❌ LOGGED OUT** (should show success page)

---

## 🔍 **ROOT CAUSE ANALYSIS**

### **Why This Happens:**

#### **1. Token Expiration During Stripe Redirect**
```
User on App → Token valid (15-30 min expiry)
↓
Redirect to Stripe (external domain)
↓
User spends 2-10 minutes on Stripe payment
↓
Returns to App → Token EXPIRED
↓
ProtectedRoute checks auth → Token invalid → Redirect to /login
```

#### **2. ProtectedRoute Behavior**
File: `src/components/ProtectedRoute.tsx`

```tsx
// Line 14-38: Authentication Check
useEffect(() => {
  const checkAuth = async () => {
    if (isAuthenticated) {
      setIsLoading(false);
      return;
    }

    if (accessToken) {
      const refreshed = await refreshAccessToken();  // Try to refresh
      if (!refreshed) {
        // ❌ REFRESH FAILED → LOGOUT
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        setRedirectPath(location.pathname);
      }
    } else {
      setRedirectPath(location.pathname);
    }

    setIsLoading(false);
  };

  checkAuth();
}, [accessToken, isAuthenticated, refreshAccessToken, location.pathname, setRedirectPath]);

// Line 48: If not authenticated → Redirect to login
return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
```

#### **3. Success Route is Protected**
File: `src/routes/index.tsx` Line 285

```tsx
{
  path: "/",
  element: <ProtectedRoute />,  // ← Requires authentication
  children: [
    {
      element: <CompanyRegistrationGuard />,  // ← Also requires company
      children: [
        { path: "success", element: <PaymentSuccess /> },  // ← Protected!
      ]
    }
  ]
}
```

---

## 💡 **SOLUTIONS**

### **Option 1: Extend Token Expiry (Backend)**
**Pros:**
- Simple backend change
- No frontend changes needed

**Cons:**
- Security risk (longer token lifetime)
- Doesn't solve issue if user takes >30 min on Stripe

**Implementation:**
```python
# backend settings.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),  # Increase from 15 min
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}
```

---

### **Option 2: Store Timestamp Before Redirect (Frontend)**
**Pros:**
- No backend changes
- Can detect if token might expire

**Cons:**
- Doesn't prevent expiration
- Just detects it

**Implementation:**
```tsx
// Before Stripe redirect
localStorage.setItem('nexhr.stripe_redirect_time', Date.now().toString());

// On return, check if too much time passed
const redirectTime = localStorage.getItem('nexhr.stripe_redirect_time');
if (redirectTime && Date.now() - parseInt(redirectTime) > 15 * 60 * 1000) {
  // More than 15 minutes → Token likely expired
  // Attempt refresh before proceeding
}
```

---

### **Option 3: Make Success Page Public (NOT RECOMMENDED)**
**Pros:**
- Guarantees no logout

**Cons:**
- ❌ **Security risk** - Anyone can access success page
- ❌ Exposes payment information
- ❌ Not recommended

---

### **Option 4: Refresh Token Before Stripe Redirect (RECOMMENDED ✅)**
**Pros:**
- Ensures fresh token before redirect
- Token less likely to expire during payment
- No security risks

**Cons:**
- Requires small frontend change

**Implementation:**
```tsx
const handlePayPayroll = async (payrollId: number) => {
  try {
    setPayingPayrollId(payrollId);
    
    // 1. Refresh token before redirect (ensures 15+ min validity)
    // The axios interceptor will automatically refresh if needed
    // when we call createCheckoutSession
    
    const session = await payrollService.createCheckoutSession(payrollId);

    if (session.url) {
      // 2. Store payroll ID and timestamp
      localStorage.setItem('nexhr.pending_payroll', payrollId.toString());
      localStorage.setItem('nexhr.stripe_redirect_time', Date.now().toString());
      
      // 3. Redirect to Stripe
      window.location.href = session.url;
    }
  } catch (e: any) {
    setPayingPayrollId(null);
    toast({ title: 'Checkout failed', description: e?.message, variant: 'destructive' });
  }
};
```

---

### **Option 5: Add Token Refresh in PaymentSuccess Page (BEST ✅✅)**
**Pros:**
- Handles expired tokens gracefully
- Works even if user takes long time on Stripe
- Most robust solution

**Cons:**
- Requires changes to PaymentSuccess component

**Implementation:**
```tsx
// src/pages/PaymentSuccess.tsx
import { useAuth } from '@/contexts/AuthContext';

const PaymentSuccess: React.FC = () => {
  const { refreshAccessToken, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const handleReturn = async () => {
      // 1. Check if token needs refresh
      if (!isAuthenticated) {
        console.log('Not authenticated, attempting token refresh...');
        const refreshed = await refreshAccessToken();
        
        if (!refreshed) {
          // Token refresh failed → Redirect to login with return URL
          toast({
            title: "Session Expired",
            description: "Please log in again to view payment status.",
            variant: "destructive",
          });
          navigate(`/login?redirect=/success?${searchParams.toString()}`);
          return;
        }
      }
      
      // 2. Proceed with payment confirmation
      const payrollId = searchParams.get('payroll_id') || 
                        localStorage.getItem('nexhr.pending_payroll');
      
      if (payrollId) {
        await confirmPayment(parseInt(payrollId));
      }
    };
    
    handleReturn();
  }, []);
  
  // ... rest of component
};
```

---

## 🎯 **RECOMMENDED ACTION PLAN**

### **Immediate Fix (Option 5):**
1. ✅ Update `PaymentSuccess.tsx` to refresh token on mount
2. ✅ Add graceful handling for expired tokens
3. ✅ Store redirect URL if login required

### **Long-term Fix (Option 1 + 4):**
1. ✅ Extend backend token expiry to 30-60 minutes
2. ✅ Refresh token before Stripe redirect
3. ✅ Add token refresh in PaymentSuccess page

---

## 📋 **FILES TO MODIFY**

1. **`src/pages/PaymentSuccess.tsx`** - Add token refresh logic
2. **`src/pages/Payroll.tsx`** - Store timestamp before redirect
3. **Backend `settings.py`** - Increase token lifetime (optional)

---

## ✅ **TESTING CHECKLIST**

- [ ] User completes payment quickly (<5 min) → Success page shown
- [ ] User takes long time on Stripe (>15 min) → Token refreshed → Success page shown
- [ ] Token refresh fails → Redirected to login with return URL
- [ ] After login → Redirected back to success page
- [ ] Payment status correctly updated in database

---

## 🔐 **SECURITY CONSIDERATIONS**

1. **Don't make success page public** - Keep it protected
2. **Validate payment on backend** - Never trust frontend
3. **Use Stripe webhooks** - Primary source of truth for payment status
4. **Token refresh is safe** - Uses refresh token, not access token

---

**Next Step:** Implement Option 5 (Add token refresh in PaymentSuccess page)

This is the most robust solution that handles all edge cases.
