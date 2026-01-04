import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import payrollService from '@/services/payrollService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Save } from 'lucide-react';
import { toast } from 'sonner';

interface BankInfo {
  id?: number;
  employee?: number; // Optional for form state, required when creating
  bank_name: string;
  account_number: string;
  routing_number?: string;
  stripe_account_id?: string;
}

const BankInfo: React.FC = () => {
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bank_name: '',
    account_number: '',
    routing_number: '',
    stripe_account_id: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Decode user id from JWT access token
  const getUserId = (): number | null => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('⚠️ [BankInfo] No access token found');
        return null;
      }
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.user_id || payload.id || null;
      console.log('🔑 [BankInfo] JWT Token decoded:', {
        fullPayload: payload,
        user_id: payload.user_id,
        id: payload.id,
        extractedUserId: userId
      });
      return userId;
    } catch (error) {
      console.error('❌ [BankInfo] Error decoding JWT token:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchBankInfo = async () => {
      try {
        const userId = getUserId();
        if (!userId) {
          setLoading(false);
          return;
        }

        // Fetch bank info filtered by current user's employee ID
        const data = await payrollService.listBankInfo();

        // Normalize userId to number for consistent comparison
        const normalizedUserId = Number(userId);
        
        if (data && Array.isArray(data)) {
          // Find bank info for current user - use normalized comparison
          const userBankInfo = data.find((bi: any) => Number(bi.employee) === normalizedUserId);
          if (userBankInfo) {
            setBankInfo(userBankInfo);
          }
        } else if (data && typeof data === 'object' && !Array.isArray(data)) {
          // If we get a single object, check if it belongs to current user
          const bankData = data as any;
          if (Number(bankData.employee) === normalizedUserId) {
            setBankInfo(bankData);
          }
        }
      } catch (error) {
        console.log('No existing bank info found, will create new one');
        // Bank info might not exist yet, that's okay
      } finally {
        setLoading(false);
      }
    };

    fetchBankInfo();
  }, []);

  const validateIBAN = (iban: string) => {
    // Basic IBAN validation:
    // 1. Length check (15-34 characters)
    // 2. Pattern check (2 letters, 2 digits, followed by alphanumeric)
    const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;
    const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

    if (cleanIBAN.length < 15 || cleanIBAN.length > 34) {
      return { valid: false, message: 'IBAN must be between 15 and 34 characters' };
    }

    if (!ibanRegex.test(cleanIBAN)) {
      return { valid: false, message: 'Invalid IBAN format. Must start with 2 letters (Country Code) and 2 digits.' };
    }

    return { valid: true, cleanIBAN };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate IBAN
    const ibanValidation = validateIBAN(bankInfo.account_number);
    if (!ibanValidation.valid) {
      toast.error(ibanValidation.message);
      return;
    }

    setSaving(true);

    try {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      // Use the cleaned/formatted IBAN
      const finalBankInfo = {
        ...bankInfo,
        account_number: ibanValidation.cleanIBAN || bankInfo.account_number
      };

      // Ensure userId is a number for consistency
      const normalizedUserId = Number(userId);
      
      console.log('💾 [BankInfo] Saving bank info:', {
        userId: userId,
        normalizedUserId: normalizedUserId,
        hasExistingId: !!bankInfo.id,
        existingId: bankInfo.id,
        bankInfoData: finalBankInfo
      });
      
      // If bankInfo has an id, it means we're updating existing data
      if (bankInfo.id) {
        const payload = {
          ...finalBankInfo,
          employee: normalizedUserId
        };
        console.log('🔄 [BankInfo] Updating bank info with payload:', payload);
        const updated = await payrollService.updateBankInfo(bankInfo.id, payload);
        console.log('✅ [BankInfo] Update response:', updated);
        toast.success('Bank information updated successfully');
        // Update state with response data (includes ID)
        if (updated) {
          console.log('✅ [BankInfo] Updated bank info state with:', updated);
          setBankInfo(updated);
        }
      } else {
        // Create new bank info - ensure employee ID is provided as number
        const bankInfoWithEmployee = {
          ...finalBankInfo,
          employee: normalizedUserId
        };
        console.log('🆕 [BankInfo] Creating bank info with payload:', bankInfoWithEmployee);
        const created = await payrollService.createBankInfo(bankInfoWithEmployee);
        console.log('✅ [BankInfo] Create response:', created);
        toast.success('Bank information saved successfully');
        // Update state with response data (includes ID) - CRITICAL for future updates
        if (created) {
          console.log('✅ [BankInfo] Created bank info state with:', created);
          setBankInfo(created);
        }
      }

      // Refresh bank info after save to ensure we have latest data
      // This is a fallback in case response doesn't include all fields
      try {
        console.log('🔄 [BankInfo] Refreshing bank info list after save...');
        const data = await payrollService.listBankInfo();
        console.log('📋 [BankInfo] All bank info from API:', data);
        if (data && Array.isArray(data)) {
          console.log(`🔍 [BankInfo] Looking for bank info with employee ID: ${normalizedUserId}`);
          console.log('🔍 [BankInfo] Available bank info employee IDs:', data.map((bi: any) => ({
            id: bi.id,
            employee: bi.employee,
            employeeType: typeof bi.employee,
            normalized: Number(bi.employee)
          })));
          // Use normalized comparison to handle type mismatches
          const userBankInfo = data.find((bi: any) => Number(bi.employee) === normalizedUserId);
          if (userBankInfo) {
            console.log('✅ [BankInfo] Found bank info after refresh:', userBankInfo);
            setBankInfo(userBankInfo);
          } else {
            console.warn(`⚠️ [BankInfo] Bank info NOT found for employee ${normalizedUserId} after save!`);
            console.warn('⚠️ [BankInfo] This might indicate an employee ID mismatch issue.');
          }
        }
      } catch (refreshError) {
        console.error('❌ [BankInfo] Could not refresh bank info after save:', refreshError);
        // Not critical - we already updated from response
      }
    } catch (error: any) {
      console.error('Bank info save error:', error);
      const errorMessage = error.response?.data?.detail ||
        error.response?.data?.message ||
        'Failed to save bank information';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading bank information...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in bg-gradient-to-br from-background via-muted/5 to-background min-h-screen">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bank Information</h1>
          <p className="text-muted-foreground">Manage your banking details for salary deposits</p>
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Banking Details</CardTitle>
                  <CardDescription>Update your bank account information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    placeholder="e.g., Habib Bank Limited"
                    value={bankInfo.bank_name}
                    onChange={(e) => setBankInfo({ ...bankInfo, bank_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_number">IBAN / Account Number</Label>
                  <Input
                    id="account_number"
                    placeholder="e.g., PK12HABB000123456789"
                    value={bankInfo.account_number}
                    onChange={(e) => setBankInfo({ ...bankInfo, account_number: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="routing_number">Routing Number / SWIFT Code</Label>
                  <Input
                    id="routing_number"
                    placeholder="e.g., HABBPKKA"
                    value={bankInfo.routing_number || ''}
                    onChange={(e) => setBankInfo({ ...bankInfo, routing_number: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stripe_account_id">Stripe Account ID (Optional)</Label>
                  <Input
                    id="stripe_account_id"
                    placeholder="e.g., acct_1ABCxyz"
                    value={bankInfo.stripe_account_id || ''}
                    onChange={(e) => setBankInfo({ ...bankInfo, stripe_account_id: e.target.value })}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:opacity-90"
                  disabled={saving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Bank Information'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BankInfo;
