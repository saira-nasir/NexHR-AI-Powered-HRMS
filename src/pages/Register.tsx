import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaGoogle, FaWindows, FaLinkedin, FaFacebook, FaTwitter, FaApple } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useRedirect } from '@/contexts/RedirectContext';
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";



const RegisterPage = () => {
  const navigate = useNavigate();
  const desktopAnimationContainer = useRef<HTMLDivElement>(null);
  const mobileAnimationContainer = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();
  const { redirectPath, setRedirectPath } = useRedirect();
  


  useEffect(() => {
    const loadLottie = async () => {
      const lottie = (await import("lottie-web")).default;

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
          path: "/lottieFiles/register.json",
        });

        return () => anim.destroy();
      }
    };

    loadLottie();
  }, []);


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
          
          {/* Left Side: Lottie Animation - Desktop */}
          <div className="hidden md:flex md:w-1/2 md:items-center md:justify-center p-8">
            <div
              ref={desktopAnimationContainer}
              className="w-full h-full"
              style={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}
            />
          </div>

          {/* Neon vertical gradient divider */}
          <div className="hidden md:block w-[2px] bg-gradient-to-b from-[#352F44] to-[#5C5470] shadow-[0_0_10px_3px_rgba(80,0,80,0.8)]" />

          {/* Right Side: Register Form */}
          <div className="w-full md:w-1/2 p-8">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-extrabold text-[#352F44]">Sign Up</h1>
              <p className="text-gray-600 mt-2">
                Experience NexHR—Get started today!
              </p>
            </div>

            {/* Mobile animation container */}
            <div className="md:hidden w-full h-48 mb-4">
              <div ref={mobileAnimationContainer} className="w-full h-full" />
            </div>

            <RegisterForm onSuccess={() => navigate('/login')} />

            {/* Social Login Buttons */}
            <div className="mt-6">
              <p className="text-center text-gray-600 mb-4">Or log in with:</p>
              <div className="flex justify-center">
                <GoogleLoginButton onSuccess={handleGoogleSuccess} />
              </div>
            </div>

            <p className="text-center mt-6 text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-[#5C5470] hover:text-[#352F44] hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
