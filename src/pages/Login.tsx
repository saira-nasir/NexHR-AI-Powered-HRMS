import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRedirect } from '@/contexts/RedirectContext';
import { Eye, EyeOff } from "lucide-react";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";


interface LoginErrors {
  email?: string;
  password?: string;
  credentials?: string;
}

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { redirectPath, setRedirectPath } = useRedirect();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const desktopAnimationContainer = useRef<HTMLDivElement>(null);
  const mobileAnimationContainer = useRef<HTMLDivElement>(null);
  const [showPassword, setShowPassword] = useState(false);


  // useEffect(() => {
  //   if (isAuthenticated) 
  //     navigate(redirectPath);
  // }, [isAuthenticated, navigate]);

  useEffect(() => {
    const loadLottie = async () => {
      const lottieModule = await import("lottie-web");
      const lottie = lottieModule.default;

      const isMobile = window.innerWidth < 768;
      const container = isMobile
        ? mobileAnimationContainer.current
        : desktopAnimationContainer.current;

      if (container) {
        const anim = lottie.loadAnimation({
          container,
          renderer: "svg",
          loop: true,
          autoplay: true,
          path: "/lottieFiles/login.json",
        });

        return () => anim.destroy();
      }
    };

    loadLottie();
  }, []);

  const inputClass = (fieldError?: string) =>
    `w-full p-2 border rounded-lg focus:outline-none text-[#363636] 
     placeholder:normal-case placeholder:text-sm normal-case 
     ${fieldError ? "border-red-500 focus:ring-2 focus:ring-red-500" : "border-gray-300 focus:ring-2 focus:ring-[#5C5470]"}`;

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof LoginErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof LoginErrors];
        return newErrors;
      });
    }
  };
  

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: LoginErrors = {};
    if (!form.email.trim()) newErrors.email = "Email is required.";
    if (!form.password.trim()) newErrors.password = "Password is required.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(form.email, form.password);
      if (result.success) {
        
        toast({ title: "Login successful", description: "Welcome back!" });
        navigate(redirectPath || '/dashboard', { replace: true });
        setRedirectPath(null);

      } else {
        toast({
          title: "Login failed",
          description: result.message || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
        setErrors({
          credentials: result.message || "Invalid credentials. Please try again.",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Connection error",
        description: "Could not connect to the server. Please try again later.",
        variant: "destructive",
      });
      setErrors({
        credentials: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = () => {
    console.log("Google login successful, redirecting...", isAuthenticated);
    if (isAuthenticated) {
      setTimeout(() => {
        navigate(redirectPath || '/dashboard', { replace: true });
        setRedirectPath(null);
      }, 100);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2A2438] px-4 py-8">
      <div className="relative w-full max-w-5xl p-[3px] bg-gradient-to-r from-[#5C5470] to-[#DBD8E3] rounded-[5rem] shadow-2xl">
        <div className="flex flex-col md:flex-row bg-[#F2F1F7] rounded-[5rem] overflow-hidden">
          {/* Left animation (desktop only) */}
          <div className="hidden md:flex md:w-1/2 md:items-center md:justify-center p-8">
            <div
              ref={desktopAnimationContainer}
              className="w-full h-full"
              style={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}
            />
          </div>

          {/* Vertical divider */}
          <div className="hidden md:block w-[2px] bg-gradient-to-b from-[#352F44] to-[#5C5470] shadow-[0_0_10px_3px_rgba(80,0,80,0.8)]" />

          {/* Right form */}
          <div className="w-full md:w-1/2 p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold text-[#352F44]">Login</h1>
              <p className="text-gray-600 mt-2">Enter your details to access your dashboard.</p>
            </div>

            {/* Mobile animation */}
            <div className="md:hidden w-full h-48 mb-6">
              <div ref={mobileAnimationContainer} className="w-full h-full" />
            </div>

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-1">Email address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={inputClass(errors.email)}
                  required
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    className={inputClass(errors.password)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="mr-2"
                  />
                  <label htmlFor="rememberMe" className="text-sm text-gray-700">
                    Remember Me
                  </label>
                </div>
                <Link to="/forgot-password" className="text-sm text-[#5C5470] hover:text-[#352F44] hover:underline">
                  Forgot your password?
                </Link>
              </div>

              {errors.credentials && <p className="text-red-500 text-xs mb-4">{errors.credentials}</p>}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#5C5470] text-white py-2 rounded-lg hover:bg-[#352F44] transition duration-300"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    LOGGING IN...
                  </>
                ) : (
                  "LOGIN"
                )}
              </Button>
            </form>

            <div className="mt-6">
              <p className="text-center text-gray-600 mb-4">Or log in with:</p>
              <div className="flex justify-center">
                <GoogleLoginButton onSuccess={handleGoogleSuccess} />
              </div>
            </div>

            <p className="text-center mt-6 text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-[#5C5470] hover:text-[#352F44] hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
