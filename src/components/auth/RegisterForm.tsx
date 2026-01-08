
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import api, { handleApiError } from "@/lib/api";
import { extractErrorMessage } from "@/lib/apiHelpers";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Form validation schema using zod
const registerFormSchema = z.object({
  fname: z.string().min(1, "First name is required").max(50, "First name is too long"),
  lname: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long")
    .regex(/^[\d\s\-\+\(\)]+$/, "Phone number can only contain digits, spaces, +, -, and parentheses")
    .refine(
      (val) => {
        // Remove all non-digit characters to check actual digit count
        const digitsOnly = val.replace(/\D/g, '');
        return digitsOnly.length >= 10 && digitsOnly.length <= 15;
      },
      { message: "Phone number must contain 10-15 digits" }
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least one special character"),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const navigate = useNavigate();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      fname: "",
      lname: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);

    try {
      // Log the registration request details
      console.log("Registration data:", data);
      console.log("Sending registration request to the API endpoint");
      
      // Explicitly show the full URL being used for debugging
      const apiUrl = '/auth/register/';
      console.log(`Full API URL: ${api.defaults.baseURL}${apiUrl}`);
      
      // Use the API instance with the correct URL (without hardcoding the full URL)
      const response = await api.post(apiUrl, {
        fname: data.fname,
        lname: data.lname,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });

      console.log("Registration response:", response);

      if (response.status === 201) {
        toast({
          title: "Success",
          description: "Account created! Please verify your email.",
        });

        if (onSuccess) onSuccess();
        else navigate("/login");
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Server response:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('No response from server. Request details:', error.request);
        
        // CORS issues often result in error.request without error.response
        if (error.message === 'Network Error' || !error.response) {
          console.error('This might be a CORS issue. Check your Django server configuration:');
          console.error('1. Install django-cors-headers');
          console.error('2. Add corsheaders to INSTALLED_APPS');
          console.error('3. Add corsheaders.middleware.CorsMiddleware to MIDDLEWARE');
          console.error('4. Set CORS_ALLOW_ALL_ORIGINS = True or CORS_ALLOWED_ORIGINS = ["https://preview--hr-hub-navigator.lovable.app"]');
          console.error('5. Set CORS_ALLOW_CREDENTIALS = True');
        }
      } else {
        console.error('Error details:', error.message);
      }

      // Extract error message for display
      const errorMessage = extractErrorMessage(error);
      
      // Set form field errors if available
      const apiErrors = error.response?.data;
      if (apiErrors?.email) form.setError("email", { message: apiErrors.email[0] });
      if (apiErrors?.fname) form.setError("fname", { message: apiErrors.fname[0] });
      if (apiErrors?.lname) form.setError("lname", { message: apiErrors.lname[0] });
      if (apiErrors?.phone) form.setError("phone", { message: apiErrors.phone[0] });
      if (apiErrors?.password) form.setError("password", { message: apiErrors.password[0] });

      toast({
        title: "Registration Failed",
        description: error.message === 'Network Error' 
          ? "Cannot connect to the server. Please check if your backend is running and CORS is properly configured." 
          : (errorMessage || "Please fix the errors and try again."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <FormField
            control={form.control}
            name="fname"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  First Name
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter first name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Last Name */}
          <FormField
            control={form.control}
            name="lname"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Last Name
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Email
              </FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                Phone Number
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., +1 (555) 123-4567 or 5551234567" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                <Lock className="h-4 w-4" />
                Password
              </FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter your password" 
                    {...field} 
                  />
                </FormControl>
                <button 
                  type="button"
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must be 8+ characters with uppercase, lowercase, number, and special character
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full bg-[#5C5470] hover:bg-[#352F44] text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Registering...
              </>
            ) : (
              "Register"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
