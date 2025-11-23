import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Calendar } from 'lucide-react';
import type { Candidate } from '@/pages/Onboarding';

interface OnboardCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  onConfirm: (salaryData: SalaryData) => void;
}

export interface SalaryData {
  baseSalary: string;
  bonus: string;
  benefits: string;
  startDate: string;
  joiningBonus: string;
  currency: string;
}

const OnboardCandidateModal: React.FC<OnboardCandidateModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onConfirm,
}) => {
  const [salaryData, setSalaryData] = useState<SalaryData>({
    baseSalary: '',
    bonus: '',
    benefits: '',
    startDate: '',
    joiningBonus: '',
    currency: 'PKR',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SalaryData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SalaryData, string>> = {};
    
    if (!salaryData.baseSalary.trim()) {
      newErrors.baseSalary = 'Base salary is required';
    } else if (isNaN(Number(salaryData.baseSalary)) || Number(salaryData.baseSalary) <= 0) {
      newErrors.baseSalary = 'Please enter a valid amount';
    }
    
    if (!salaryData.startDate.trim()) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (salaryData.bonus && (isNaN(Number(salaryData.bonus)) || Number(salaryData.bonus) < 0)) {
      newErrors.bonus = 'Please enter a valid amount';
    }
    
    if (salaryData.joiningBonus && (isNaN(Number(salaryData.joiningBonus)) || Number(salaryData.joiningBonus) < 0)) {
      newErrors.joiningBonus = 'Please enter a valid amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onConfirm(salaryData);
    setIsSubmitting(false);
    handleClose();
  };

  const handleClose = () => {
    setSalaryData({
      baseSalary: '',
      bonus: '',
      benefits: '',
      startDate: '',
      joiningBonus: '',
      currency: 'PKR',
    });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const updateField = (field: keyof SalaryData, value: string) => {
    setSalaryData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-green-700 flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Onboard Candidate
          </DialogTitle>
          <DialogDescription className="text-base">
            Complete salary details for <span className="font-semibold">{candidate.candidateName}</span>
          </DialogDescription>
        </DialogHeader>

        <Card className="border-2 border-blue-100 bg-blue-50/50 mt-4">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Candidate Name</p>
                <p className="font-semibold text-gray-900">{candidate.candidateName}</p>
              </div>
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-semibold text-gray-900">{candidate.candidateEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="baseSalary" className="text-base font-semibold text-gray-900">
                Base Salary (Annual) *
              </Label>
              <div className="flex gap-2 mt-2">
                <select
                  value={salaryData.currency}
                  onChange={(e) => updateField('currency', e.target.value)}
                  className="w-24 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PKR">PKR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                <Input
                  id="baseSalary"
                  type="number"
                  value={salaryData.baseSalary}
                  onChange={(e) => updateField('baseSalary', e.target.value)}
                  placeholder="e.g., 1200000"
                  className="flex-1"
                />
              </div>
              {errors.baseSalary && <p className="text-sm text-red-600 mt-1">{errors.baseSalary}</p>}
            </div>

            <div>
              <Label htmlFor="startDate" className="text-base font-semibold text-gray-900">
                Start Date *
              </Label>
              <Input
                id="startDate"
                type="date"
                value={salaryData.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
                className="mt-2"
              />
              {errors.startDate && <p className="text-sm text-red-600 mt-1">{errors.startDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bonus" className="text-base font-semibold text-gray-900">
                Annual Performance Bonus
              </Label>
              <p className="text-sm text-gray-600 mb-2">Optional</p>
              <Input
                id="bonus"
                type="number"
                value={salaryData.bonus}
                onChange={(e) => updateField('bonus', e.target.value)}
                placeholder="e.g., 100000"
              />
              {errors.bonus && <p className="text-sm text-red-600 mt-1">{errors.bonus}</p>}
            </div>

            <div>
              <Label htmlFor="joiningBonus" className="text-base font-semibold text-gray-900">
                Joining Bonus
              </Label>
              <p className="text-sm text-gray-600 mb-2">Optional, one-time payment</p>
              <Input
                id="joiningBonus"
                type="number"
                value={salaryData.joiningBonus}
                onChange={(e) => updateField('joiningBonus', e.target.value)}
                placeholder="e.g., 50000"
              />
              {errors.joiningBonus && <p className="text-sm text-red-600 mt-1">{errors.joiningBonus}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="benefits" className="text-base font-semibold text-gray-900">
              Benefits & Perks
            </Label>
            <p className="text-sm text-gray-600 mb-2">
              Optional, e.g., health insurance, gym membership, remote work
            </p>
            <Input
              id="benefits"
              value={salaryData.benefits}
              onChange={(e) => updateField('benefits', e.target.value)}
              placeholder="e.g., Health insurance, gym membership, flexible hours..."
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <span className="font-semibold">Note:</span> Once confirmed, an offer letter will be generated 
              and sent to the candidate's email. HR can track onboarding progress in the dashboard.
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Confirm Onboarding
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardCandidateModal;
