import React, { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { User, Lock, Bell, Moon, Globe } from 'lucide-react';

const Settings = () => {
    const { toast } = useToast();
    const user = useSelector((state: RootState) => state.auth.user);

    // Local state for form fields
    const [profileData, setProfileData] = useState({
        firstName: user?.first_name || user?.fname || '',
        lastName: user?.last_name || user?.lname || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

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

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSecurityData({ ...securityData, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = () => {
        // Mock API call
        toast({
            title: "Profile updated",
            description: "Your profile information has been saved successfully.",
        });
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

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px] mb-8">
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" /> Profile
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" /> Security
                    </TabsTrigger>

                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Update your personal details here.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        value={profileData.firstName}
                                        onChange={handleProfileChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        value={profileData.lastName}
                                        onChange={handleProfileChange}
                                    />
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
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button onClick={handleSaveProfile}>Save Changes</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Password & Security</CardTitle>
                            <CardDescription>
                                Manage your password and security preferences.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type="password"
                                    value={securityData.currentPassword}
                                    onChange={handleSecurityChange}
                                />
                            </div>
                            <Separator className="my-4" />
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    value={securityData.newPassword}
                                    onChange={handleSecurityChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={securityData.confirmPassword}
                                    onChange={handleSecurityChange}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button onClick={handleSaveSecurity}>Update Password</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>


            </Tabs>
            </div>
        </DashboardLayout>
    );
};

export default Settings;
