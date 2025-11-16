import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  Calendar, 
  PieChart, 
  Shield, 
  Database,
  MessageSquare,
  Menu,
  X,
  ChevronRight,
  CheckCircle,
  Star,
  ArrowRight,
  Search,
  UserCheck,
  Bot,
  Building2,
  Linkedin,
  Slack,
  Zap,
  TrendingUp,
  Globe,
  Smartphone,
  FileText,
  BarChart3,
  Settings,
  CreditCard,
  MapPin,
  Eye,
  Brain,
  Workflow
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';

export default function NexHRProductPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const keyHighlights = [
    {
      title: "Smart Recruitment",
      description: "AI-powered candidate matching and streamlined hiring process",
      icon: <Search size={32} className="text-[#5d5471]" />,
      color: "from-blue-500 to-purple-600"
    },
    {
      title: "Face Recognition Attendance",
      description: "Biometric attendance with geo-fencing and real-time tracking",
      icon: <Eye size={32} className="text-[#5d5471]" />,
      color: "from-green-500 to-teal-600"
    },
    {
      title: "AI-powered HR Chatbot",
      description: "24/7 intelligent assistance for employees and HR queries",
      icon: <Bot size={32} className="text-[#5d5471]" />,
      color: "from-orange-500 to-red-600"
    },
    {
      title: "Seamless Payroll",
      description: "Automated salary processing with tax compliance",
      icon: <CreditCard size={32} className="text-[#5d5471]" />,
      color: "from-purple-500 to-pink-600"
    }
  ];

  const detailedFeatures = [
    {
      title: "Recruitment & Onboarding",
      description: "Simplify job postings, track candidates, and integrate with LinkedIn for seamless hiring.",
      features: ["Smart job matching", "LinkedIn integration", "Candidate pipeline", "Automated onboarding"],
      icon: <UserCheck size={48} className="text-[#5d5471]" />,
      image: "/images/recruitment-dashboard.png"
    },
    {
      title: "Employee Dashboard",
      description: "Self-service portal for leave requests, performance insights, and personal information management.",
      features: ["Leave management", "Performance tracking", "Document access", "Personal updates"],
      icon: <Users size={48} className="text-[#5d5471]" />,
      image: "/images/employee-dashboard.png"
    },
    {
      title: "HR Dashboard",
      description: "Centralized control center for approvals, analytics, and comprehensive HR management.",
      features: ["Centralized control", "Approval workflows", "Advanced analytics", "Team management"],
      icon: <BarChart3 size={48} className="text-[#5d5471]" />,
      image: "/images/hr-dashboard.png"
    },
    {
      title: "Payroll & Compliance",
      description: "Automated salary processing with tax compliance and comprehensive reporting.",
      features: ["Salary processing", "Tax compliance", "Automated reports", "Regulatory updates"],
      icon: <CreditCard size={48} className="text-[#5d5471]" />,
      image: "/images/payroll-dashboard.png"
    },
    {
      title: "Attendance & Leave Management",
      description: "Face recognition attendance, geo-fencing, and flexible leave management system.",
      features: ["Face recognition", "Geo-fencing", "Flexible leaves", "Real-time tracking"],
      icon: <Clock size={48} className="text-[#5d5471]" />,
      image: "/images/attendance-dashboard.png"
    },
    {
      title: "AI-powered Chatbot",
      description: "Natural language processing for HR queries and task automation.",
      features: ["Natural language", "Task automation", "Database integration", "24/7 support"],
      icon: <Brain size={48} className="text-[#5d5471]" />,
      image: "/images/chatbot-dashboard.png"
    },
    {
      title: "Company Structure",
      description: "Visualize organizational hierarchy with role-based permissions and access control.",
      features: ["Hierarchy visualization", "Role management", "Permission control", "Access management"],
      icon: <Building2 size={48} className="text-[#5d5471]" />,
      image: "/images/company-structure.png"
    },
    {
      title: "Workflow Automation",
      description: "Streamline HR processes with customizable workflows and approval chains.",
      features: ["Custom workflows", "Approval chains", "Process automation", "Status tracking"],
      icon: <Workflow size={48} className="text-[#5d5471]" />,
      image: "/images/workflow-dashboard.png"
    }
  ];

  const integrations = [
    {
      name: "LinkedIn",
      description: "Seamless job posting and candidate sourcing",
      icon: <Linkedin size={32} className="text-blue-600" />,
      status: "Active"
    },
    {
      name: "Slack",
      description: "Team communication and notifications",
      icon: <Slack size={32} className="text-purple-600" />,
      status: "Coming Soon"
    },
    {
      name: "Microsoft Teams",
      description: "Enterprise collaboration and integration",
      icon: <MessageSquare size={32} className="text-blue-600" />,
      status: "Coming Soon"
    },
    {
      name: "Zapier",
      description: "Connect with 5000+ apps and services",
      icon: <Zap size={32} className="text-orange-600" />,
      status: "Active"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "HR Director, TechCorp Inc.",
      content: "NexHR has transformed our HR operations. The AI chatbot alone saves us 10+ hours weekly on routine queries.",
      rating: 5,
      company: "TechCorp Inc."
    },
    {
      name: "Michael Chen",
      role: "CEO, GrowthWave",
      content: "The face recognition attendance and seamless payroll integration have streamlined our entire workforce management.",
      rating: 5,
      company: "GrowthWave"
    },
    {
      name: "Priya Sharma",
      role: "HR Manager, GlobalHealth",
      content: "The recruitment features with LinkedIn integration have reduced our time-to-hire by 40%. Outstanding platform!",
      rating: 5,
      company: "GlobalHealth"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header & Navigation */}
      <header className="bg-transparent sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            {/* Left Side - Combined Logo & Navigation Pill */}
            <div className="flex items-center">
              <div className="bg-white/95 backdrop-blur-md rounded-full px-8 py-4 shadow-lg flex items-center space-x-8">
                {/* Logo Section */}
                <div className="flex items-center space-x-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative group"
                  >
                    <div className="bg-gradient-to-r from-[#342f43] to-[#5d5471] rounded-full p-2 shadow-sm">
                      <img 
                        src="/images/nexhr-logo.png" 
                        alt="NexHR Logo" 
                        className="h-6 w-6 object-contain"
                      />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"
                    />
                  </motion.div>
                  
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-[#342f43]">
                      Nex
                    </span>
                    <span className="text-2xl font-bold text-[#5d5471] ml-1">
                      HR
                    </span>
                  </div>
                </div>
                
                {/* Navigation Tabs */}
                <div className="flex items-center space-x-8">
                  {[
                    { href: "#features", label: "Features" },
                    { href: "#highlights", label: "Highlights" },
                    { href: "#integrations", label: "Integrations" },
                    { href: "#testimonials", label: "Testimonials" },
                    { href: "#pricing", label: "Pricing" }
                  ].map((item, index) => (
                    <motion.a
                      key={index}
                      href={item.href}
                      whileHover={{ y: -1 }}
                      className="text-[#342f43]/90 hover:text-[#342f43] font-medium transition-all duration-300 relative group"
                    >
                      {item.label}
                      <motion.div
                        className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#5d5471] rounded-full group-hover:w-full transition-all duration-300"
                        initial={{ width: 0 }}
                        whileHover={{ width: "100%" }}
                      />
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Right Section - CTA Buttons */}
<div className="hidden md:flex items-center space-x-4">
  {/* Login Button */}
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <Link to="/login">
      <Button 
        variant="ghost" 
        className="bg-white/95 backdrop-blur-md border border-white/20 text-[#342f43] hover:text-[#5d5471] hover:bg-white rounded-full px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300"
      >
        Login
      </Button>
    </Link>
  </motion.div>

  {/* Book Demo Button - Primary CTA */}
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Link to="/demo">
      <Button className="bg-gradient-to-r from-[#342f43] to-[#5d5471] hover:from-[#5d5471] hover:to-[#342f43] text-white rounded-full px-8 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold">
        Book Demo
      </Button>
    </Link>
  </motion.div>
</div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="bg-white/95 backdrop-blur-md border border-white/20 text-[#342f43] hover:text-[#5d5471] hover:bg-white rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </Button>
              </motion.div>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.nav 
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="md:hidden mt-6 pt-6"
            >
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg">
                <div className="space-y-4">
                  {[
                    { href: "#features", label: "Features" },
                    { href: "#highlights", label: "Highlights" },
                    { href: "#integrations", label: "Integrations" },
                    { href: "#testimonials", label: "Testimonials" },
                    { href: "#pricing", label: "Pricing" }
                  ].map((item, index) => (
                    <motion.a
                      key={index}
                      href={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="block text-[#342f43] font-medium hover:text-[#5d5471] transition-colors py-2 px-4 rounded-lg hover:bg-white/60"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </motion.a>
                  ))}
                  
                  <div className="pt-4 space-y-3">
                    <Button 
                      variant="outline" 
                      asChild 
                      className="w-full bg-white/80 border-[#5d5471]/20 text-[#342f43] hover:text-[#5d5471] hover:bg-white rounded-full py-2.5"
                    >
                      <a href='/login'>Login</a>
                    </Button>
                    <Button className="w-full bg-gradient-to-r from-[#342f43] to-[#5d5471] hover:from-[#5d5471] hover:to-[#342f43] text-white rounded-full py-2.5 font-semibold">
                      Book Demo
                    </Button>
                  </div>
                </div>
              </div>
            </motion.nav>
          )}
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#292438] via-[#342f43] to-[#5d5471] overflow-hidden min-h-screen flex items-center">
        {/* Enhanced Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#292438] to-[#342f43] opacity-90"></div>
          
          {/* Floating Geometric Shapes */}
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-[#5d5471] to-[#dbd8e3] rounded-full mix-blend-multiply filter blur-xl opacity-30"
          />
          
          <motion.div 
            animate={{ 
              rotate: -360,
              y: [0, -20, 0],
            }}
            transition={{ 
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-[#dbd8e3] to-[#5d5471] rounded-full mix-blend-multiply filter blur-xl opacity-20"
          />
          
          <motion.div 
            animate={{ 
              rotate: 360,
              x: [0, 30, 0],
            }}
            transition={{ 
              rotate: { duration: 30, repeat: Infinity, ease: "linear" },
              x: { duration: 8, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute bottom-20 left-1/2 w-80 h-80 bg-gradient-to-br from-[#342f43] to-[#5d5471] rounded-full mix-blend-multiply filter blur-xl opacity-25"
          />
          
          {/* Animated Grid Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(219, 216, 227, 0.3) 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }} />
          </div>
          
          {/* Floating Particles - Galaxy Effect */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -100, 0],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 8 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
              className="absolute w-2 h-2 bg-[#dbd8e3] rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`,
              }}
            />
          ))}
          
          {/* Additional Galaxy Bubbles - Various Sizes */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`bubble-${i}`}
              animate={{
                y: [0, -150, 0],
                x: [0, Math.sin(i) * 50, 0],
                opacity: [0.1, 0.6, 0.1],
                scale: [0.3, 1.2, 0.3],
              }}
              transition={{
                duration: 10 + i * 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              }}
              className="absolute bg-white/20 rounded-full backdrop-blur-sm"
              style={{
                width: `${2 + (i % 4) * 2}px`,
                height: `${2 + (i % 4) * 2}px`,
                left: `${15 + (i * 7) % 70}%`,
                top: `${20 + (i * 11) % 60}%`,
              }}
            />
          ))}
          
          {/* Large Floating Orbs */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`orb-${i}`}
              animate={{
                y: [0, -80, 0],
                x: [0, Math.cos(i) * 40, 0],
                opacity: [0.05, 0.3, 0.05],
                scale: [0.8, 1.5, 0.8],
              }}
              transition={{
                duration: 15 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 1.5,
              }}
              className="absolute bg-white/10 rounded-full backdrop-blur-md"
              style={{
                width: `${20 + i * 8}px`,
                height: `${20 + i * 8}px`,
                left: `${25 + (i * 20) % 50}%`,
                top: `${15 + (i * 25) % 50}%`,
              }}
            />
          ))}
          
          {/* Twinkling Stars */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              animate={{
                opacity: [0.1, 1, 0.1],
                scale: [0.5, 1.5, 0.5],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.4,
              }}
              className="absolute bg-white rounded-full"
              style={{
                width: `${1 + (i % 3)}px`,
                height: `${1 + (i % 3)}px`,
                left: `${10 + (i * 12) % 80}%`,
                top: `${25 + (i * 15) % 70}%`,
              }}
            />
          ))}
          
          {/* Drifting Nebula Clouds */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`nebula-${i}`}
              animate={{
                y: [0, -60, 0],
                x: [0, Math.sin(i * 2) * 30, 0],
                opacity: [0.02, 0.15, 0.02],
                scale: [1, 1.8, 1],
              }}
              transition={{
                duration: 20 + i * 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 3,
              }}
              className="absolute bg-white/5 rounded-full backdrop-blur-sm"
              style={{
                width: `${60 + i * 20}px`,
                height: `${40 + i * 15}px`,
                left: `${30 + (i * 30) % 40}%`,
                top: `${35 + (i * 20) % 40}%`,
              }}
            />
          ))}
        </div>
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
          >
            <div className="space-y-8">
              {/* Animated Badge */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 text-[#dbd8e3] text-sm font-medium"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="w-2 h-2 bg-[#5d5471] rounded-full"
                />
                <span>🚀 #1 HRMS Platform 2025</span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
              >
                Reinventing{' '}
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                  className="bg-gradient-to-r from-[#dbd8e3] via-white to-[#5d5471] bg-clip-text text-transparent"
                >
                  HR Management
                </motion.span>
                {' '}with{' '}
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
                  className="bg-gradient-to-r from-[#5d5471] via-[#dbd8e3] to-white bg-clip-text text-transparent"
                >
                  NexHR
                </motion.span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                className="text-xl md:text-2xl text-[#dbd8e3] leading-relaxed"
              >
                Transform your HR operations with{' '}
                <span className="text-white font-semibold">AI-powered recruitment</span>,{' '}
                <span className="text-white font-semibold">face recognition attendance</span>, and{' '}
                <span className="text-white font-semibold">seamless payroll integration</span>.
              </motion.p>
              
              {/* Feature Highlights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
                className="flex flex-wrap gap-4 text-sm text-[#dbd8e3]"
              >
                {['✨ AI-Powered', '🔒 Secure', '📱 Mobile-First', '🌐 Cloud-Native'].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.9 + index * 0.1, ease: "easeOut" }}
                    className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2"
                  >
                    <span>{feature}</span>
                  </motion.div>
                ))}
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
                className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" className="px-10 py-5 bg-gradient-to-r from-[#5d5471] to-[#342f43] hover:from-[#342f43] hover:to-[#5d5471] text-white font-bold text-lg rounded-xl shadow-2xl transition-all duration-300">
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      Book a Demo
                    </motion.span>
                    <ArrowRight size={20} className="ml-2" />
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" variant="outline" className="px-10 py-5 border-2 border-[#dbd8e3] text-[#dbd8e3] hover:bg-[#dbd8e3] hover:text-[#342f43] font-bold text-lg rounded-xl backdrop-blur-sm transition-all duration-300">
                    Get Started
                  </Button>
                </motion.div>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 50, rotateY: 15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
              className="relative"
            >
              {/* Main Dashboard Image */}
              <motion.div
                whileHover={{ scale: 1.02, rotateY: 5 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <img 
                  src="/images/hero-illustration.png" 
                  alt="NexHR Dashboard" 
                  className="w-full h-auto rounded-3xl shadow-2xl"
                />
                
                {/* Floating UI Elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-4 -right-4 bg-white p-4 rounded-2xl shadow-xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-[#342f43]">Live</span>
                  </div>
                </motion.div>
                
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-4 -left-4 bg-white p-4 rounded-2xl shadow-xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-[#342f43]">Online</span>
                  </div>
                </motion.div>
              </motion.div>
              
              {/* Stats Card */}
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
                className="absolute -bottom-8 -left-8 bg-white p-6 rounded-3xl shadow-2xl"
              >
                <div className="flex items-center space-x-4">
                  <motion.div 
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 bg-gradient-to-br from-[#342f43] via-[#5d5471] to-[#dbd8e3] rounded-3xl flex items-center justify-center"
                  >
                    <TrendingUp size={32} className="text-white" />
                  </motion.div>
                  <div>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.5 }}
                      className="text-3xl font-bold text-[#342f43]"
                    >
                      5,000+
                    </motion.p>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 1.7 }}
                      className="text-[#5d5471] text-sm font-medium"
                    >
                      Active Users
                    </motion.p>
                  </div>
                </div>
              </motion.div>
              
              {/* Success Metrics */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1.4, ease: "easeOut" }}
                className="absolute -top-8 -right-8 bg-gradient-to-r from-[#5d5471] to-[#342f43] p-4 rounded-2xl shadow-xl text-white"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-2xl font-bold mb-1"
                  >
                    98%
                  </motion.div>
                  <div className="text-xs opacity-90">Satisfaction</div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Key Highlights Section */}
      <section id="highlights" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#342f43] mb-6">
              Why Choose NexHR?
            </h2>
            <p className="text-xl text-[#5d5471]">
              Cutting-edge features that set the standard for modern HR management
            </p>
          </motion.div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {keyHighlights.map((highlight, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${highlight.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      {highlight.icon}
                    </div>
                    <CardTitle className="text-xl text-[#342f43]">{highlight.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-[#5d5471] text-base">
                      {highlight.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* Detailed Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#342f43] mb-6">
              Comprehensive HR Solutions
            </h2>
            <p className="text-xl text-[#5d5471]">
              Every module designed to streamline your HR operations and boost productivity
            </p>
          </motion.div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-20"
          >
            {detailedFeatures.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
                }`}>
                  <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                      <div className="mb-6 bg-gradient-to-br from-[#dbd8e3] to-[#f3f4f6] w-20 h-20 rounded-2xl flex items-center justify-center">
                        {feature.icon}
                      </div>
                      <h3 className="text-3xl font-bold text-[#342f43] mb-4">{feature.title}</h3>
                      <p className="text-lg text-[#5d5471] mb-6">{feature.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {feature.features.map((feat, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                            <span className="text-[#5d5471]">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={index % 2 === 1 ? 'lg:col-start-1' : ''}>
                    <div className="relative">
                      <img 
                        src={feature.image} 
                        alt={feature.title} 
                        className="w-full h-auto rounded-2xl shadow-2xl"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* Integrations Section */}
      <section id="integrations" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#342f43] mb-6">
              Seamless Integrations
            </h2>
            <p className="text-xl text-[#5d5471]">
              Connect NexHR with your favorite tools and platforms
            </p>
          </motion.div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {integrations.map((integration, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      {integration.icon}
                    </div>
                    <CardTitle className="text-xl text-[#342f43]">{integration.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-[#5d5471] text-base mb-4">
                      {integration.description}
                    </CardDescription>
                    <Badge 
                      variant={integration.status === 'Active' ? 'default' : 'secondary'}
                      className={integration.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    >
                      {integration.status}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#342f43] mb-6">
              What Our Customers Say
            </h2>
            <p className="text-xl text-[#5d5471]">
              Trusted by HR professionals and business leaders worldwide
            </p>
          </motion.div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
                  <CardContent className="p-8">
                    <div className="flex mb-6">
                      {Array(5).fill(0).map((_, i) => (
                        <Star 
                          key={i} 
                          size={20} 
                          className={i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
                        />
                      ))}
                    </div>
                    <blockquote className="text-lg text-[#5d5471] mb-6 italic">
                      "{testimonial.content}"
                    </blockquote>
                    <div className="border-t border-gray-100 pt-4">
                      <p className="font-bold text-[#342f43] text-lg">{testimonial.name}</p>
                      <p className="text-[#5d5471] text-sm">{testimonial.role}</p>
                      <p className="text-[#5d5471] text-sm font-medium">{testimonial.company}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#292438] via-[#342f43] to-[#5d5471]">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Start Your HR Transformation Today
            </h2>
            <p className="text-xl text-[#dbd8e3] mb-8">
              Join thousands of companies already using NexHR to revolutionize their HR operations
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
              <Button size="lg" className="px-8 py-4 bg-[#5d5471] hover:bg-[#342f43] text-white font-bold text-lg">
                Book a Demo
                <ArrowRight size={20} className="ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-4 border-2 border-[#dbd8e3] text-[#dbd8e3] hover:bg-[#dbd8e3] hover:text-[#342f43] font-bold text-lg">
                Start Free Trial
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-[#292438] text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/images/nexhr-logo.png" alt="NexHR Logo" className="h-10 w-auto object-contain" />
                <div className="flex items-center">
                  <span className="text-2xl font-bold bg-gradient-to-r from-[#dbd8e3] to-white bg-clip-text text-transparent">
                    Nex
                  </span>
                  <span className="text-2xl font-bold text-[#dbd8e3]">
                    HR
                  </span>
                </div>
              </div>
              <p className="text-[#dbd8e3] mb-4">
                Revolutionizing HR management with AI-powered solutions for modern businesses.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4 text-[#dbd8e3]">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-[#dbd8e3] hover:text-white transition-colors">Features</a></li>
                <li><a href="#highlights" className="text-[#dbd8e3] hover:text-white transition-colors">Highlights</a></li>
                <li><a href="#integrations" className="text-[#dbd8e3] hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#testimonials" className="text-[#dbd8e3] hover:text-white transition-colors">Testimonials</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4 text-[#dbd8e3]">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-[#dbd8e3] hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-[#dbd8e3] hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-[#dbd8e3] hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="text-[#dbd8e3] hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4 text-[#dbd8e3]">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-[#dbd8e3] hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-[#dbd8e3] hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-[#dbd8e3] hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-[#dbd8e3] hover:text-white transition-colors">Webinars</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-[#342f43] flex flex-col md:flex-row justify-between items-center">
            <div className="text-[#dbd8e3] mb-4 md:mb-0">
              © 2025 NexHR. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-[#dbd8e3] hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-[#dbd8e3] hover:text-white text-sm transition-colors">Terms of Service</a>
              <a href="#" className="text-[#dbd8e3] hover:text-white text-sm transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}