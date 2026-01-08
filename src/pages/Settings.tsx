import React, { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { /* Tabs removed - single profile view */ } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar as UIShadCalendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setUser } from '@/store/authSlice';
import { apiGet, apiPatch } from '@/lib/api';
import { User, Lock, Bell, Moon, Globe } from 'lucide-react';

const Settings = () => {
    const { toast } = useToast();
    const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch();

    // Local state for form fields
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        joining_date: '',
        branch: '' as number | string,
        department: '' as number | string,
    });

    const [profileErrors, setProfileErrors] = useState<Record<string,string>>({});
    const [isFetching, setIsFetching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [securityData, setSecurityData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        marketing: false,
    });

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
        setProfileErrors(prev => ({ ...prev, [e.target.name]: '' }));
    };

    const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSecurityData({ ...securityData, [e.target.name]: e.target.value });
    };

    const fetchProfile = async () => {
        setIsFetching(true);
        try {
            const data = await apiGet('/auth/profile/');
            // Map API fields to local state keys
            setProfileData({
                firstName: data.fname || data.first_name || '',
                lastName: data.lname || data.last_name || '',
                email: data.email || '',
                phone: data.phone || data.phone_number || '',
                joining_date: data.joining_date || '',
                branch: data.branch ?? '',
                department: data.department ?? '',
            });
            // Update localStorage user object and Redux auth user so other components reflect new data
            try {
                const ls = localStorage.getItem('user');
                if (ls) {
                    const parsed = JSON.parse(ls);
                    const merged = {
                        ...parsed,
                        fname: data.fname || data.first_name || parsed.fname || parsed.first_name,
                        lname: data.lname || data.last_name || parsed.lname || parsed.last_name,
                        email: data.email || parsed.email,
                        phone: data.phone || data.phone_number || parsed.phone,
                        joining_date: data.joining_date ?? parsed.joining_date,
                        branch: data.branch ?? parsed.branch,
                        department: data.department ?? parsed.department,
                    };
                    localStorage.setItem('user', JSON.stringify(merged));
                    // Also update Redux auth user
                    try {
                        dispatch(setUser({
                            id: parsed?.id,
                            email: merged.email,
                            firstName: merged.fname || merged.first_name,
                            lastName: merged.lname || merged.last_name,
                            company: parsed.company || null,
                            roles: parsed.roles || parsed.role ? (parsed.roles || [parsed.role]) : undefined,
                            role: parsed.role || (parsed.roles && parsed.roles[0]),
                        } as any));
                    } catch (e) {
                        console.warn('Could not dispatch setUser:', e);
                    }
                }
            } catch (e) {
                console.warn('Could not update localStorage user:', e);
            }
        } catch (error: any) {
            console.error('Failed to fetch profile:', error);
            toast({ title: 'Error', description: 'Failed to load profile.', variant: 'destructive' });
        } finally {
            setIsFetching(false);
        }
    };

    React.useEffect(() => {
        fetchProfile();
    }, []);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        setProfileErrors({});
        try {
            const payload: any = {
                fname: profileData.firstName,
                lname: profileData.lastName,
                phone: profileData.phone,
                joining_date: profileData.joining_date || null,
            };
            // Only include branch/department if provided as numbers
            if (profileData.branch !== '') payload.branch = Number(profileData.branch) || null;
            if (profileData.department !== '') payload.department = Number(profileData.department) || null;

            const res = await apiPatch('/auth/profile/', payload);

            toast({ title: 'Success', description: 'Profile updated successfully.' });
            // Refresh local state
            await fetchProfile();
        } catch (error: any) {
            console.error('Profile update failed:', error);
            const apiErrors = error?.response?.data || {}; 
            // Map field errors
            const newErrors: Record<string,string> = {};
            if (typeof apiErrors === 'string') {
                toast({ title: 'Error', description: apiErrors, variant: 'destructive' });
            } else {
                Object.keys(apiErrors).forEach((key) => {
                    const val = apiErrors[key];
                    if (Array.isArray(val)) newErrors[key] = val.join(' ');
                    else if (typeof val === 'string') newErrors[key] = val;
                });
                setProfileErrors(newErrors);
                toast({ title: 'Error', description: 'Please fix the highlighted errors.', variant: 'destructive' });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveSecurity = () => {
        if (securityData.newPassword !== securityData.confirmPassword) {
            toast({
                title: "Error",
                description: "New passwords do not match.",
                variant: "destructive",
            });
            return;
        }
        toast({
            title: "Password updated",
            description: "Your password has been changed successfully.",
        });
        setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto py-8 max-w-5xl animate-in fade-in duration-500">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your account settings and preferences.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>
                            Update your personal details here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isFetching ? (
                            <div className="py-8 text-center">
                                <div className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                        <div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        value={profileData.firstName}
                                        onChange={handleProfileChange}
                                    />
                                    {profileErrors.fname && <p className="text-xs text-destructive">{profileErrors.fname}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        value={profileData.lastName}
                                        onChange={handleProfileChange}
                                    />
                                    {profileErrors.lname && <p className="text-xs text-destructive">{profileErrors.lname}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    value={profileData.email}
                                    disabled
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">Email cannot be changed. Contact admin for assistance.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={profileData.phone}
                                    onChange={handleProfileChange}
                                />
                                {profileErrors.phone && <p className="text-xs text-destructive">{profileErrors.phone}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="joining_date">Joining Date</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button type="button" className="w-full text-left border rounded px-3 py-2 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                                                            <span>
                                                                {profileData.joining_date ? format(new Date(profileData.joining_date), 'PPP') : 'Select date'}
                                                            </span>
                                                        </div>
                                                        <div className="ml-2 text-xs text-muted-foreground">Change</div>
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <UIShadCalendar
                                                        mode="single"
                                                        selected={profileData.joining_date ? new Date(profileData.joining_date) : undefined}
                                                        onSelect={(date) => {
                                                            if (!date) return;
                                                            const iso = format(date as Date, 'yyyy-MM-dd');
                                                            setProfileData((p) => ({ ...p, joining_date: iso }));
                                                            setProfileErrors((prev) => ({ ...prev, joining_date: '' }));
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            {profileErrors.joining_date && <p className="text-xs text-destructive">{profileErrors.joining_date}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="branch">Branch (ID)</Label>
                                    <Input id="branch" name="branch" type="number" value={profileData.branch as any} onChange={handleProfileChange} />
                                    {profileErrors.branch && <p className="text-xs text-destructive">{profileErrors.branch}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="department">Department (ID)</Label>
                                <Input id="department" name="department" type="number" value={profileData.department as any} onChange={handleProfileChange} />
                                {profileErrors.department && <p className="text-xs text-destructive">{profileErrors.department}</p>}
                            </div>
                        </div>
                        )}
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button onClick={handleSaveProfile} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
                    </CardFooter>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default Settings;
