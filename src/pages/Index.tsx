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
  TrendingUp,
  Globe,
  Smartphone,
  FileText,
  BarChart3,
  Settings,
  CreditCard,
  Video,
  Mail,
  MapPin,
  Eye,
  Brain,
  Workflow,
  Twitter,
  Facebook,
  Instagram
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
      name: "Stripe",
      description: "Secure payroll and expense management",
      icon: <CreditCard size={32} className="text-indigo-600" />,
      status: "Active"
    },
    {
      name: "Google Meet",
      description: "Integrated video interviewing and meetings",
      icon: <Video size={32} className="text-green-600" />,
      status: "Active"
    },
    {
      name: "Gmail",
      description: "Email synchronization and communication",
      icon: <Mail size={32} className="text-red-600" />,
      status: "Active"
    },
    {
      name: "Google Calendar",
      description: "Interview scheduling and event management",
      icon: <Calendar size={32} className="text-blue-500" />,
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
      <header className="fixed top-0 w-full z-50 transition-all duration-300 bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Logo */}
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative group cursor-pointer"
              >
                <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl p-2 shadow-lg shadow-violet-500/20">
                  <img
                    src="/images/nexhr-logo.png"
                    alt="NexHR Logo"
                    className="h-6 w-6 object-contain"
                  />
                </div>
              </motion.div>

              <div className="flex items-center">
                <span className="text-2xl font-bold text-white tracking-tight">
                  Nex<span className="text-violet-400">HR</span>
                </span>
              </div>
            </div>

            {/* Center - Navigation */}
            <div className="hidden md:flex items-center space-x-1 bg-white/5 backdrop-blur-md rounded-full px-2 py-1.5 border border-white/10">
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
                  className="px-5 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors relative group rounded-full hover:bg-white/10"
                >
                  {item.label}
                </motion.a>
              ))}
            </div>

            {/* Right Section - CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/job-portal">
                <Button
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-white/10 rounded-full px-6 font-medium transition-all duration-300"
                >
                  Job Portal
                </Button>
              </Link>

              <Link to="/login">
                <Button
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-white/10 rounded-full px-6 font-medium transition-all duration-300"
                >
                  Login
                </Button>
              </Link>

              <Link to="/demo">
                <Button className="bg-white text-violet-900 hover:bg-gray-100 rounded-full px-8 py-2.5 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 font-bold">
                  Book Demo
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:bg-white/10 rounded-full"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className="md:hidden mt-4"
            >
              <div className="bg-[#1a1625]/95 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                <div className="space-y-2">
                  {[
                    { href: "#features", label: "Features" },
                    { href: "#highlights", label: "Highlights" },
                    { href: "#integrations", label: "Integrations" },
                    { href: "#testimonials", label: "Testimonials" },
                    { href: "#pricing", label: "Pricing" }
                  ].map((item, index) => (
                    <a
                      key={index}
                      href={item.href}
                      className="block text-gray-300 font-medium hover:text-white hover:bg-white/5 transition-all py-3 px-4 rounded-xl"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  ))}

                  <div className="pt-4 space-y-3 border-t border-white/10 mt-4">
                    <Button
                      variant="outline"
                      asChild
                      className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent rounded-xl h-12"
                    >
                      <Link to='/job-portal'>Job Portal</Link>
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                      className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent rounded-xl h-12"
                    >
                      <Link to='/login'>Login</Link>
                    </Button>
                    <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-12 font-semibold shadow-lg shadow-violet-500/25">
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
      <section className="relative bg-[#0f0c15] overflow-hidden min-h-screen flex items-center pt-20">
        {/* Deep Space Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/40 via-[#0f0c15] to-[#0f0c15]"></div>

        {/* Animated Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-violet-600/20 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] bg-indigo-600/20 rounded-full blur-[100px]"
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 text-center lg:text-left">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-2"
              >
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-sm font-medium text-violet-200">#1 HR Platform of 2025</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight"
              >
                The Future of <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 animate-gradient-x">
                  Workforce Management
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl text-gray-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
              >
                Streamline your entire HR lifecycle with our AI-powered platform. From smart recruitment to seamless payroll, we've got you covered.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-6"
              >
                <Button size="lg" className="h-14 px-8 bg-white text-violet-950 hover:bg-gray-100 rounded-full font-bold text-lg shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all duration-300 w-full sm:w-auto">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <Button size="lg" className="h-14 px-8 bg-transparent border border-white/20 text-white hover:bg-white/10 rounded-full font-semibold text-lg backdrop-blur-sm w-full sm:w-auto">
                  <div className="mr-2 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                    <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-1"></div>
                  </div>
                  Watch Demo
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="pt-8 flex items-center justify-center lg:justify-start space-x-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
              >
                {/* Trust Badges / Logos would go here */}
                <span className="text-sm font-semibold text-white/40 uppercase tracking-widest">Trusted by 500+ Companies</span>
              </motion.div>
            </div>

            {/* Hero Visual - Glass Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotateY: -20 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
              className="relative perspective-1000"
            >
              <div className="relative z-10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl shadow-violet-500/20 transform hover:scale-[1.02] transition-transform duration-500">
                {/* Mockup Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                      <Users className="text-violet-300" size={24} />
                    </div>
                    <div>
                      <div className="h-2 w-24 bg-white/20 rounded-full mb-2"></div>
                      <div className="h-2 w-16 bg-white/10 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                  </div>
                </div>

                {/* Mockup Content Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Users size={16} className="text-blue-300" />
                      </div>
                      <span className="text-xs text-green-400">+12%</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">1,234</div>
                    <div className="text-xs text-gray-400">Total Employees</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Clock size={16} className="text-purple-300" />
                      </div>
                      <span className="text-xs text-green-400">98%</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">98.2%</div>
                    <div className="text-xs text-gray-400">On-Time Attendance</div>
                  </div>
                </div>

                {/* Mockup Chart Area */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 h-32 flex items-end justify-between space-x-2">
                  {[40, 70, 45, 90, 65, 85, 50].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ duration: 1, delay: 1 + i * 0.1 }}
                      className="w-full bg-gradient-to-t from-violet-600/50 to-indigo-400/50 rounded-t-lg relative group"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/10 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        {h}%
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-8 top-20 bg-[#1a1625] border border-white/10 p-4 rounded-2xl shadow-xl z-20"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm">JS</div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1a1625] rounded-full"></div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">New Candidate</div>
                      <div className="text-xs text-gray-400">Applied 2m ago</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -left-8 bottom-20 bg-[#1a1625] border border-white/10 p-4 rounded-2xl shadow-xl z-20"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle size={20} className="text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Payroll Run</div>
                      <div className="text-xs text-gray-400">Completed Successfully</div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Background Glow behind dashboard */}
              <div className="absolute inset-0 bg-violet-600/30 blur-[60px] -z-10 transform translate-y-10"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Highlights Section */}
      <section id="highlights" className="py-24 bg-[#0f0c15] relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[5%] w-96 h-96 bg-violet-900/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[20%] right-[5%] w-96 h-96 bg-indigo-900/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Why Choose <span className="text-violet-400">NexHR</span>?
            </h2>
            <p className="text-xl text-gray-400">
              Experience the next generation of HR tools designed for the modern workforce.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {keyHighlights.map((highlight, index) => (
              <motion.div key={index} variants={itemVariants}>
                <div className="group relative h-full">
                  <div className={`absolute inset-0 bg-gradient-to-br ${highlight.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500 blur-xl`}></div>
                  <Card className="h-full bg-white/5 backdrop-blur-lg border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-2 overflow-hidden relative">
                    <CardHeader className="text-center pb-4 relative z-10">
                      <div className={`w-20 h-20 bg-gradient-to-br ${highlight.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-500`}>
                        {React.cloneElement(highlight.icon as React.ReactElement, { className: "text-white w-10 h-10" })}
                      </div>
                      <CardTitle className="text-xl font-bold text-white">{highlight.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center relative z-10">
                      <CardDescription className="text-gray-400 text-base leading-relaxed">
                        {highlight.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Detailed Features Section */}
      <section id="features" className="py-32 bg-white relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-24"
          >
            <span className="text-violet-600 font-semibold tracking-wider uppercase text-sm mb-4 block">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold text-[#1a1625] mb-6 tracking-tight">
              Comprehensive HR Solutions
            </h2>
            <p className="text-xl text-gray-500">
              Every module designed to streamline your HR operations and boost productivity
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-32"
          >
            {detailedFeatures.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
                  }`}>
                  <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                    <div className="relative">
                      <div className="absolute -left-8 -top-8 w-24 h-24 bg-violet-100 rounded-full opacity-50 blur-2xl"></div>
                      <div className="mb-8 inline-flex p-4 bg-violet-50 rounded-2xl text-violet-600">
                        {React.cloneElement(feature.icon as React.ReactElement, { size: 32 })}
                      </div>
                      <h3 className="text-3xl md:text-4xl font-bold text-[#1a1625] mb-6 leading-tight">{feature.title}</h3>
                      <p className="text-lg text-gray-600 mb-8 leading-relaxed">{feature.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {feature.features.map((feat, i) => (
                          <div key={i} className="flex items-center space-x-3 group">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500 transition-colors duration-300">
                              <CheckCircle size={14} className="text-green-600 group-hover:text-white transition-colors duration-300" />
                            </div>
                            <span className="text-gray-700 font-medium">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={index % 2 === 1 ? 'lg:col-start-1' : ''}>
                    <div className="relative group perspective-1000">
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-indigo-600/20 rounded-3xl transform rotate-3 scale-105 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-3xl p-8 shadow-2xl overflow-hidden min-h-[400px] flex items-center justify-center">
                        {/* Abstract Feature Visualization since images are missing */}
                        <div className="absolute inset-0 opacity-30">
                          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
                        </div>

                        <div className="relative z-10 w-full max-w-sm">
                          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-4 transform group-hover:-translate-y-2 transition-transform duration-500">
                            <div className="flex items-center space-x-4 mb-4">
                              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                                {React.cloneElement(feature.icon as React.ReactElement, { size: 24 })}
                              </div>
                              <div>
                                <div className="h-3 w-32 bg-gray-200 rounded-full mb-2"></div>
                                <div className="h-2 w-20 bg-gray-100 rounded-full"></div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="h-2 w-full bg-gray-100 rounded-full"></div>
                              <div className="h-2 w-5/6 bg-gray-100 rounded-full"></div>
                              <div className="h-2 w-4/6 bg-gray-100 rounded-full"></div>
                            </div>
                          </div>

                          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-4 w-3/4 ml-auto transform translate-x-4 group-hover:translate-x-2 transition-transform duration-500 delay-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                  <CheckCircle size={16} className="text-green-600" />
                                </div>
                                <div className="text-sm font-semibold text-gray-800">Task Completed</div>
                              </div>
                              <span className="text-xs text-gray-400">Just now</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#1a1625] mb-6 tracking-tight">
              Seamless Integrations
            </h2>
            <p className="text-xl text-gray-500">
              Connect NexHR with your favorite tools and platforms for a unified workflow.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap lg:flex-nowrap justify-center gap-4"
          >
            {integrations.map((integration, index) => (
              <motion.div key={index} variants={itemVariants} className="w-full sm:w-1/2 lg:w-1/5 min-w-[200px]">
                <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-white group p-4">
                  <CardHeader className="text-center pb-2 p-0">
                    <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-violet-50 transition-colors duration-300">
                      {React.cloneElement(integration.icon as React.ReactElement, { size: 24, className: "group-hover:scale-110 transition-transform duration-300" })}
                    </div>
                    <CardTitle className="text-base font-bold text-[#1a1625]">{integration.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center p-0 mt-2">
                    <CardDescription className="text-gray-500 text-xs mb-3 line-clamp-2">
                      {integration.description}
                    </CardDescription>
                    <Badge
                      variant={integration.status === 'Active' ? 'default' : 'secondary'}
                      className={`px-2 py-0.5 text-[10px] rounded-full ${integration.status === 'Active'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600'
                        }`}
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
      <section id="testimonials" className="py-24 bg-white relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#1a1625] mb-6 tracking-tight">
              Loved by HR Teams
            </h2>
            <p className="text-xl text-gray-500">
              See why thousands of companies trust NexHR to manage their workforce.
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
                <Card className="h-full border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <MessageSquare size={100} className="text-violet-600 transform rotate-12" />
                  </div>
                  <CardContent className="p-8 relative z-10">
                    <div className="flex mb-6 space-x-1">
                      {Array(5).fill(0).map((_, i) => (
                        <Star
                          key={i}
                          size={18}
                          className={i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}
                        />
                      ))}
                    </div>
                    <blockquote className="text-lg text-gray-600 mb-8 leading-relaxed">
                      "{testimonial.content}"
                    </blockquote>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-[#1a1625]">{testimonial.name}</p>
                        <p className="text-sm text-violet-600 font-medium">{testimonial.role}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{testimonial.company}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 bg-[#0f0c15] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-[#0f0c15] to-[#0f0c15]"></div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 tracking-tight">
              Ready to Transform Your HR?
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Join the future of workforce management. Start your free trial today and see the difference.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 justify-center">
              <Button size="lg" className="h-16 px-10 bg-white text-violet-950 hover:bg-gray-100 rounded-full font-bold text-xl shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all duration-300">
                Book a Demo
                <ArrowRight size={24} className="ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="h-16 px-10 border-white/20 text-white hover:bg-white/10 rounded-full font-semibold text-xl backdrop-blur-sm">
                Start Free Trial
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a080e] text-white py-16 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg p-1.5">
                  <img src="/images/nexhr-logo.png" alt="NexHR Logo" className="h-6 w-6 object-contain brightness-0 invert" />
                </div>
                <span className="text-2xl font-bold text-white">NexHR</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Revolutionizing HR management with AI-powered solutions for modern businesses.
              </p>
              <div className="flex space-x-4">
                {[Linkedin, Twitter, Facebook, Instagram].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-violet-600 hover:text-white transition-all duration-300">
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 text-white">Product</h3>
              <ul className="space-y-4">
                <li><a href="#features" className="text-gray-400 hover:text-violet-400 transition-colors">Features</a></li>
                <li><a href="#highlights" className="text-gray-400 hover:text-violet-400 transition-colors">Highlights</a></li>
                <li><a href="#integrations" className="text-gray-400 hover:text-violet-400 transition-colors">Integrations</a></li>
                <li><a href="#testimonials" className="text-gray-400 hover:text-violet-400 transition-colors">Testimonials</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 text-white">Company</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-400 hover:text-violet-400 transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-violet-400 transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-violet-400 transition-colors">Press</a></li>
                <li><a href="#" className="text-gray-400 hover:text-violet-400 transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 text-white">Resources</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-400 hover:text-violet-400 transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-violet-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-violet-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-violet-400 transition-colors">Webinars</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 mb-4 md:mb-0">
              © 2025 NexHR. All rights reserved.
            </div>
            <div className="flex space-x-8">
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}