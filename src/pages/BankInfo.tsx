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
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user_id || payload.id || null;
    } catch {
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

        if (data && Array.isArray(data)) {
          // Find bank info for current user
          const userBankInfo = data.find((bi: any) => bi.employee === userId);
          if (userBankInfo) {
            setBankInfo(userBankInfo);
          }
        } else if (data && typeof data === 'object' && !Array.isArray(data)) {
          // If we get a single object, check if it belongs to current user
          const bankData = data as any;
          if (bankData.employee === userId) {
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

      // If bankInfo has an id, it means we're updating existing data
      if (bankInfo.id) {
        await payrollService.updateBankInfo(bankInfo.id, {
          ...finalBankInfo,
          employee: userId
        });
        toast.success('Bank information updated successfully');
      } else {
        // Create new bank info - ensure employee ID is provided
        const bankInfoWithEmployee = {
          ...finalBankInfo,
          employee: userId
        };

        await payrollService.createBankInfo(bankInfoWithEmployee);
        toast.success('Bank information saved successfully');
      }

      // Refresh bank info after save
      const data = await payrollService.listBankInfo();
      if (data && Array.isArray(data)) {
        const userBankInfo = data.find((bi: any) => bi.employee === userId);
        if (userBankInfo) {
          setBankInfo(userBankInfo);
        }
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
