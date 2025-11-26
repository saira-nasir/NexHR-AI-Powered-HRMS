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
  baseSalary: string; // USD
  startDate: string;
  allowances: string;
  justification: string;
}

const OnboardCandidateModal: React.FC<OnboardCandidateModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onConfirm,
}) => {
  const [salaryData, setSalaryData] = useState<SalaryData>({
    baseSalary: '',
    startDate: '',
    allowances: '',
    justification: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SalaryData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SalaryData, string>> = {};

    if (!salaryData.baseSalary.trim()) {
      newErrors.baseSalary = 'Base salary is required';
    } else if (isNaN(Number(salaryData.baseSalary)) || Number(salaryData.baseSalary) <= 0) {
      newErrors.baseSalary = 'Base salary must be a positive amount';
    }

    if (!salaryData.startDate.trim()) {
      newErrors.startDate = 'Start date is required';
    } else {
      // Ensure start date is in the future (strictly after today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(salaryData.startDate);
      selected.setHours(0, 0, 0, 0);
      if (!(selected instanceof Date) || isNaN(selected.getTime())) {
        newErrors.startDate = 'Please enter a valid date';
      } else if (selected <= today) {
        newErrors.startDate = 'Start date must be in the future';
      }
    }

    if (salaryData.allowances && (isNaN(Number(salaryData.allowances)) || Number(salaryData.allowances) < 0)) {
      newErrors.allowances = 'Please enter a valid amount (cannot be negative)';
    }

    if (!salaryData.justification.trim()) {
      newErrors.justification = 'Justification is required for onboarding';
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
      startDate: '',
      allowances: '',
      justification: '',
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
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-700">USD</span>
                <Input
                  id="baseSalary"
                  type="number"
                  min={0}
                  value={salaryData.baseSalary}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (parseFloat(val) < 0) return;
                    updateField('baseSalary', val);
                  }}
                  placeholder="e.g., 120000"
                  className="pl-12"
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

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="allowances" className="text-base font-semibold text-gray-900">
                Allowances (Annual)
              </Label>
              <p className="text-sm text-gray-600 mb-2">Optional - additional allowances in USD</p>
              <Input
                id="allowances"
                type="number"
                min={0}
                value={salaryData.allowances}
                onChange={(e) => {
                  const val = e.target.value;
                  if (parseFloat(val) < 0) return;
                  updateField('allowances', val);
                }}
                placeholder="e.g., 5000"
              />
              {errors.allowances && <p className="text-sm text-red-600 mt-1">{errors.allowances}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="justification" className="text-base font-semibold text-gray-900">
              Onboarding Justification *
            </Label>
            <p className="text-sm text-gray-600 mb-2">Provide a short justification for onboarding this candidate (required)</p>
            <textarea
              id="justification"
              value={salaryData.justification}
              onChange={(e) => updateField('justification', e.target.value)}
              placeholder="e.g., Candidate accepted offer due to relocation support and competitive package..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
            {errors.justification && <p className="text-sm text-red-600 mt-1">{errors.justification}</p>}
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
