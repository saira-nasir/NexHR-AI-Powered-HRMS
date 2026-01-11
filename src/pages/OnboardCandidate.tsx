import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Check, ChevronRight, DollarSign, Calendar as CalendarIcon, Loader2, Info } from 'lucide-react';
import { applicationService } from '@/services/jobPortalservice';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// --- Types ---
interface SalaryData {
  baseSalary: string;
  startDate: Date | undefined;
  allowances: string;
  justification: string;
}

interface OfferJSON {
  header: {
    companyName: string;
  };
  body: {
    content: string;
  };
  footer: {
    closingLine: string;
    signOff: string;
    signerName: string;
    signerDesignation: string;
    companyName: string;
    contactInfo: string;
  };
}

const OnboardCandidatePage: React.FC = () => {
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const location = useLocation();
  const candidate: any = (location.state as any)?.candidate || null;

  // --- State ---
  const [activeTab, setActiveTab] = useState<'details' | 'offer'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [salaryData, setSalaryData] = useState<SalaryData>({
    baseSalary: '',
    startDate: undefined,
    allowances: '',
    justification: ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SalaryData, string>>>({});

  // Offer Letter State structure as requested
  const [offerContent, setOfferContent] = useState<OfferJSON>({
    header: {
      companyName: 'NexHR Pvt Ltd',
    },
    body: {
      content: `Dear ${candidate?.candidateName || 'Candidate'},\n\nWe are pleased to offer you the position. This offer is conditional upon satisfactory pre-employment checks.\n\nStart Date: [Start Date]\nBase Salary: [Base Salary]\n\nPlease sign and return this letter to confirm your acceptance.`,
    },
    footer: {
      closingLine: `Congratulations and welcome to NexHR Pvt Ltd.`,
      signOff: 'Warm regards,',
      signerName: '[Your Name]',
      signerDesignation: '[Designation]',
      companyName: 'NexHR Pvt Ltd',
      contactInfo: '[Contact Information]',
    }
  });

  const wordCount = offerContent.body.content.trim().split(/\s+/).filter(Boolean).length;
  const isOfferValid = wordCount > 0 && wordCount <= 255;

  // --- Effects ---
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        let userData = null;
        const storedUser = localStorage.getItem('user');
        const storedAuthState = localStorage.getItem('authState');

        if (storedUser) {
          userData = JSON.parse(storedUser);
        } else if (storedAuthState) {
          const parsedAuth = JSON.parse(storedAuthState);
          userData = parsedAuth.user;
        }

        if (userData) {
          console.log("Loaded user from storage:", userData);
          const fullName = (userData.fname || userData.lname)
            ? `${userData.fname || ''} ${userData.lname || ''}`.trim()
            : '';
          const contact = [userData.phone, userData.email].filter(Boolean).join(' | ');
          const company = userData.company || 'NexHR Pvt Ltd';

          setOfferContent(prev => ({
            ...prev,
            header: {
              companyName: company
            },
            footer: {
              ...prev.footer,
              closingLine: `Congratulations and welcome to ${company}.`,
              signerName: fullName || prev.footer.signerName,
              signerDesignation: userData.roles?.[0] || 'HR Manager',
              companyName: company,
              contactInfo: contact || prev.footer.contactInfo
            }
          }));
        }
      } catch (err) {
        console.error("Failed to parse user from local storage", err);
      }
    };
    loadFromStorage();
  }, []);

  // --- Handlers ---
  const updateSalaryField = (field: keyof SalaryData, value: any) => {
    setSalaryData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const updateOfferContent = (section: keyof OfferJSON, field: string, value: string) => {
    setOfferContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SalaryData, string>> = {};

    if (!salaryData.baseSalary.trim()) newErrors.baseSalary = 'Required';
    else if (isNaN(Number(salaryData.baseSalary)) || Number(salaryData.baseSalary) <= 0) newErrors.baseSalary = 'Invalid amount';

    if (!salaryData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (salaryData.startDate <= today) newErrors.startDate = 'Must be in the future';
    }

    // Normalize allowances: empty -> '0'
    if (!salaryData.allowances || salaryData.allowances.trim() === '') {
      salaryData.allowances = '0';
    }
    if (isNaN(Number(salaryData.allowances)) || Number(salaryData.allowances) < 0) newErrors.allowances = 'Invalid amount';
    if (!salaryData.justification.trim()) newErrors.justification = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      const formattedDate = salaryData.startDate ? format(salaryData.startDate, 'PPP') : '[Start Date]';
      const formattedSalary = salaryData.baseSalary ? `$${Number(salaryData.baseSalary).toLocaleString()}` : '[Base Salary]';

      // Update body placeholders
      const updatedBody = offerContent.body.content
        .replace('[Start Date]', formattedDate)
        .replace(/\[Base Salary\]|\$\d+(,\d{3})*(\.\d{2})?/, formattedSalary); // Simple regex to replace if exists or placeholder

      setOfferContent(prev => ({
        ...prev,
        body: { ...prev.body, content: updatedBody }
      }));
      setActiveTab('offer');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const appId = applicationId ?? (candidate?.applicationId ?? candidate?.candidateId);

    // Construct the nested payload as required
    const salaryDetails = {
      base_salary: Number(salaryData.baseSalary) || 0,
      allowances: Number(salaryData.allowances) || 0,
      effective_from: salaryData.startDate ? format(salaryData.startDate, 'yyyy-MM-dd') : '',
      hiring_justification: salaryData.justification,
    };

    const finalPayload = {
      onboarding: {
        salaryDetails: salaryDetails,
        offerLetter: offerContent
      }
    };

    // Console log the complete onboarding object as requested
    console.log(finalPayload);

    try {
      if (!appId) throw new Error('Missing application id');
      // Pass the final nested payload to the service
      const resp = await applicationService.onboardApplication(Number(appId), finalPayload);
      if (resp.success) {
        navigate('/onboarding');
      } else {
        console.error('Onboard failed:', resp.message);
      }
    } catch (err) {
      console.error('Onboard error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50/50 py-10">
        <div className="max-w-4xl mx-auto px-6">

          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={() => activeTab === 'offer' ? setActiveTab('details') : navigate('/onboarding')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {activeTab === 'offer' ? 'Edit Details' : 'Back to List'}
            </Button>
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full transition-colors ${activeTab === 'details' ? 'bg-indigo-600' : 'bg-gray-300'}`} />
              <div className={`h-2.5 w-2.5 rounded-full transition-colors ${activeTab === 'offer' ? 'bg-indigo-600' : 'bg-gray-300'}`} />
            </div>
          </div>

          {activeTab === 'details' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Onboard {candidate?.candidateName || 'Candidate'}</h1>
                <p className="text-gray-500 mt-2">Finalize the employment terms to generate the offer.</p>
              </div>

              <Card className="p-8 border-0 shadow-xl shadow-indigo-50/50 bg-white/80 backdrop-blur-sm ring-1 ring-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Annual Base Salary</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        value={salaryData.baseSalary}
                        onChange={(e) => updateSalaryField('baseSalary', e.target.value)}
                        onKeyDown={(e) => {
                          const allowed = ['Backspace','Tab','Enter','ArrowLeft','ArrowRight','Delete'];
                          if (allowed.includes(e.key)) return;
                          if (!/^[0-9.]$/.test(e.key)) e.preventDefault();
                          if (e.key === '.' && (e.currentTarget as HTMLInputElement).value.includes('.')) e.preventDefault();
                        }}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (!v) updateSalaryField('baseSalary', '0');
                          else {
                            const num = Number(v.replace(/[^0-9.]/g, '')) || 0;
                            updateSalaryField('baseSalary', String(num));
                          }
                        }}
                        className="pl-10 h-11 text-lg"
                        placeholder="0.00"
                      />
                    </div>
                    {errors.baseSalary && <p className="text-sm text-red-500">{errors.baseSalary}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full h-11 justify-start text-left font-normal text-lg",
                            !salaryData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {salaryData.startDate ? format(salaryData.startDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={salaryData.startDate}
                          onSelect={(date) => updateSalaryField('startDate', date)}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.startDate && <p className="text-sm text-red-500">{errors.startDate}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Allowances (Optional)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <Input
                        value={salaryData.allowances}
                        onChange={(e) => updateSalaryField('allowances', e.target.value)}
                        onKeyDown={(e) => {
                          const allowed = ['Backspace','Tab','Enter','ArrowLeft','ArrowRight','Delete'];
                          if (allowed.includes(e.key)) return;
                          if (!/^[0-9.]$/.test(e.key)) e.preventDefault();
                          if (e.key === '.' && (e.currentTarget as HTMLInputElement).value.includes('.')) e.preventDefault();
                        }}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (!v) updateSalaryField('allowances', '0');
                          else {
                            const num = Number(v.replace(/[^0-9.]/g, '')) || 0;
                            updateSalaryField('allowances', String(num));
                          }
                        }}
                        className="pl-10 h-11 text-lg"
                        placeholder="0.00"
                      />
                    </div>
                    {errors.allowances && <p className="text-sm text-red-500">{errors.allowances}</p>}
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <Label className="text-base font-medium">Justification</Label>
                  <Textarea
                    value={salaryData.justification}
                    onChange={(e) => updateSalaryField('justification', e.target.value)}
                    className="min-h-[100px] text-lg resize-none"
                    placeholder="Reason for hiring..."
                  />
                  {errors.justification && <p className="text-sm text-red-500">{errors.justification}</p>}
                </div>

                <div className="mt-10 flex justify-end">
                  <Button onClick={handleNext} className="h-12 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                    Generate Offer <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r shadow-sm">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-bold text-blue-800">Review & Edit Offer</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Please review the offer letter below. You can edit the text as needed, but please ensure the body content does not exceed 255 words.
                    </p>
                  </div>
                </div>
              </div>

              <Card className="max-w-[210mm] mx-auto bg-white shadow-2xl p-16 min-h-[297mm] ring-1 ring-gray-900/5 relative">

                {/* Header Section (Editable) */}
                <div className="mb-12">
                  <Input
                    value={offerContent.header.companyName}
                    onChange={(e) => updateOfferContent('header', 'companyName', e.target.value)}
                    className="text-4xl font-extrabold text-gray-900 border-none shadow-none focus-visible:ring-0 p-0 h-auto uppercase tracking-tighter w-full bg-transparent placeholder:text-gray-300"
                    placeholder="COMPANY NAME"
                  />
                </div>

                {/* Date - Auto */}
                <div className="text-right text-gray-500 mb-8 font-serif">
                  {format(new Date(), 'MMMM d, yyyy')}
                </div>

                {/* Body Section (Editable) */}
                {/* Body Section (Editable) with Word Count */}
                <div className="mb-12 relative group">
                  <Textarea
                    value={offerContent.body.content}
                    onChange={(e) => {
                      const val = e.target.value;
                      const words = val.trim().split(/\s+/).filter(Boolean).length;
                      if (words <= 255) {
                        updateOfferContent('body', 'content', val);
                      }
                    }}
                    className="w-full min-h-[400px] border-none shadow-none focus-visible:ring-0 resize-none text-lg leading-relaxed font-serif bg-transparent p-0 placeholder:text-gray-300 text-justify"
                  />
                  <div className={`absolute bottom-0 right-0 text-xs font-medium px-2 py-1 rounded transition-colors ${offerContent.body.content.trim().split(/\s+/).filter(Boolean).length >= 250 ? 'text-amber-600 bg-amber-50' : 'text-gray-400 bg-gray-50'
                    }`}>
                    {offerContent.body.content.trim().split(/\s+/).filter(Boolean).length} / 255 Words
                  </div>
                </div>

                {/* Footer Section (Editable) */}
                <div className="space-y-6 text-lg font-serif text-gray-900">
                  <div>
                    <Input
                      value={offerContent.footer.closingLine}
                      onChange={(e) => updateOfferContent('footer', 'closingLine', e.target.value)}
                      className="font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto w-full bg-transparent"
                    />
                  </div>

                  <div className="mt-8">
                    <Input
                      value={offerContent.footer.signOff}
                      onChange={(e) => updateOfferContent('footer', 'signOff', e.target.value)}
                      className="font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto w-full bg-transparent mb-8"
                    />

                    <div className="space-y-1">
                      <Input
                        value={offerContent.footer.signerName}
                        onChange={(e) => updateOfferContent('footer', 'signerName', e.target.value)}
                        className="font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto w-full bg-transparent"
                      />
                      <Input
                        value={offerContent.footer.signerDesignation}
                        onChange={(e) => updateOfferContent('footer', 'signerDesignation', e.target.value)}
                        className="font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto w-full bg-transparent"
                      />
                      <Input
                        value={offerContent.footer.companyName}
                        onChange={(e) => updateOfferContent('footer', 'companyName', e.target.value)}
                        className="font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto w-full bg-transparent"
                      />
                      <Input
                        value={offerContent.footer.contactInfo}
                        onChange={(e) => updateOfferContent('footer', 'contactInfo', e.target.value)}
                        className="font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto w-full bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Candidate Signature Block (Fixed/Static layout per instruction) */}
                <div className="mt-20 pt-10 border-t-2 border-gray-100">
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-10">Accepted and Agreed By Candidate:</p>
                  <div className="flex gap-20">
                    <div className="flex-1 space-y-2">
                      <div className="h-10 border-b-2 border-gray-900"></div>
                      <p className="font-bold uppercase text-sm">{candidate?.candidateName || 'Candidate Name'}</p>
                      <p className="text-xs text-gray-400 uppercase">Signature</p>
                    </div>
                    <div className="w-48 space-y-2">
                      <div className="h-10 border-b-2 border-gray-900"></div>
                      <p className="font-bold uppercase text-sm">Date</p>
                    </div>
                  </div>
                </div>

              </Card>

              {/* Actions */}
              <div className="max-w-[210mm] mx-auto mt-8 flex justify-end gap-4 pb-20">
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/50 px-3 py-1 rounded-full">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Letter is ready to send</span>
                </div>
                <Button onClick={handleSubmit} disabled={isSubmitting || !isOfferValid} className="h-12 px-8 bg-black hover:bg-gray-800 text-white shadow-xl">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm & Send Offer'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OnboardCandidatePage;
