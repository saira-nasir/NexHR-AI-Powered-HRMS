import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { applicationService } from '@/services/jobPortalservice';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SignedOffer {
    application_id: number;
    candidate_name: string;
    candidate_email: string;
    job_name: string;
    offer_letter_url: string;
}

const ReviewOfferLetters: React.FC = () => {
    const [offers, setOffers] = useState<SignedOffer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Action State
    const [selectedOffer, setSelectedOffer] = useState<SignedOffer | null>(null);
    const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);
    const [reason, setReason] = useState('');
    const [joiningDate, setJoiningDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        setIsLoading(true);
        try {
            const response = await applicationService.getSignedOffers();
            if (response.success && response.data) {
                setOffers(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch offers:', error);
            toast.error('Failed to load signed offer letters');
        } finally {
            setIsLoading(false);
        }
    };

    const handleActionClick = (offer: SignedOffer, type: 'accept' | 'reject') => {
        setSelectedOffer(offer);
        setActionType(type);
        setReason('');
        setJoiningDate('');
    };

    const handleCloseDialog = () => {
        setSelectedOffer(null);
        setActionType(null);
    };

    const handleSubmitReview = async () => {
        if (!selectedOffer || !actionType) return;

        // Validation
        if (actionType === 'reject' && !reason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }
        // Joining date is optional for accept, but good to have logic if needed

        setIsSubmitting(true);
        try {
            const payload = {
                action: actionType,
                ...(actionType === 'reject' && { reason }),
                ...(actionType === 'accept' && joiningDate && { joining_date: joiningDate })
            };

            const response = await applicationService.reviewSignedOffer(selectedOffer.application_id, payload);

            if (response.success) {
                toast.success(`Offer ${actionType === 'accept' ? 'approved' : 'rejected'} successfully`);
                // Remove from list
                setOffers(prev => prev.filter(o => o.application_id !== selectedOffer.application_id));
                handleCloseDialog();
            } else {
                toast.error(response.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Submit review error:', error);
            toast.error('An error occurred while submitting');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50 p-6 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <FileText className="h-8 w-8 text-indigo-600" />
                            Review Offer Letters
                        </h1>
                        <p className="text-gray-500 mt-1">Review and approve signed offer letters from candidates.</p>
                    </div>
                    <Button variant="outline" onClick={fetchOffers} disabled={isLoading} className="gap-2">
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh List
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : offers.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-lg font-medium text-gray-600">No pending offer letters to review</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {offers.map((offer) => (
                            <Card key={offer.application_id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-semibold text-gray-900">{offer.candidate_name}</CardTitle>
                                    <CardDescription>{offer.job_name}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-sm text-gray-600">
                                        <p className="mb-1"><span className="font-medium">Email:</span> {offer.candidate_email}</p>
                                        <p><span className="font-medium">Application ID:</span> #{offer.application_id}</p>
                                    </div>

                                    <div className="pt-2">
                                        <a
                                            href={offer.offer_letter_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-1.5" />
                                            View Signed PDF
                                        </a>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => handleActionClick(offer, 'accept')}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" /> Approve
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            onClick={() => handleActionClick(offer, 'reject')}
                                        >
                                            <XCircle className="h-4 w-4 mr-2" /> Reject
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Action Dialog */}
                <Dialog open={!!selectedOffer} onOpenChange={(open) => !open && handleCloseDialog()}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {actionType === 'accept' ? 'Approve Offer Letter' : 'Reject Offer Letter'}
                            </DialogTitle>
                            <DialogDescription>
                                {actionType === 'accept'
                                    ? `Are you sure you want to approve the offer for ${selectedOffer?.candidate_name}?`
                                    : `Please provide a reason for rejecting ${selectedOffer?.candidate_name}'s offer letter.`
                                }
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-4">
                            {actionType === 'accept' && (
                                <div className="space-y-2">
                                    <Label>Joining Date (Optional)</Label>
                                    <Input
                                        type="date"
                                        value={joiningDate}
                                        onChange={(e) => setJoiningDate(e.target.value)}
                                    />
                                </div>
                            )}

                            {actionType === 'reject' && (
                                <div className="space-y-2">
                                    <Label>Rejection Reason <span className="text-red-500">*</span></Label>
                                    <Textarea
                                        placeholder="e.g. Signature mismatch, document incomplete..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmitReview}
                                disabled={isSubmitting}
                                className={actionType === 'accept' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                            >
                                {isSubmitting ? 'Submitting...' : actionType === 'accept' ? 'Confirm Approval' : 'Confirm Rejection'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default ReviewOfferLetters;
