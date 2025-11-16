import React, { useState, useRef, useEffect } from "react";
import { Search, MapPin, Activity, Monitor, ChevronDown, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  // Selected values for dropdowns
  const [selectedJobType, setSelectedJobType] = useState("Designer");
  const [selectedLocation, setSelectedLocation] = useState("Work location");
  const [selectedExperience, setSelectedExperience] = useState("Experience");
  const [selectedPeriod, setSelectedPeriod] = useState("Per month");
  const [activeLink, setActiveLink] = useState("find-job");

  const [salaryRange, setSalaryRange] = useState([1200, 20000]);
  const [sliderPosition, setSliderPosition] = useState({ left: 10, right: 90 });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const sliderRef = useRef(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const navigate = useNavigate();
  // Filter options
  const jobTypes = ["Designer", "Developer", "Manager", "Marketing", "Sales"];
  const locations = ["Remote", "New York", "San Francisco", "London", "Berlin"];
  const experiences = ["Entry Level", "Mid Level", "Senior Level", "Director", "Executive"];
  const periods = ["Per month", "Per year", "Per hour", "Per project"];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !dropdownRefs.current[activeDropdown]?.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDropdown]);

  const toggleDropdown = (dropdown) => {
    if (activeDropdown === dropdown) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(dropdown);
    }
  };

  const selectOption = (dropdown, value) => {
    switch (dropdown) {
      case "jobType":
        setSelectedJobType(value);
        break;
      case "location":
        setSelectedLocation(value);
        break;
      case "experience":
        setSelectedExperience(value);
        break;
      case "period":
        setSelectedPeriod(value);
        break;
    }
    setActiveDropdown(null);
  };

  const handleLinkClick = (link) => {
    // setActiveLink(link);
    navigate(`/${link}`);
  };

  const handleLeftThumbMouseDown = (e) => {
    e.preventDefault();

    // Store the slider container reference
    const sliderContainer = sliderRef.current;
    if (!sliderContainer) return;

    const handleMouseMove = (moveEvent) => {
      if (!sliderContainer) return;

      const rect = sliderContainer.getBoundingClientRect();
      const newPosition = Math.max(
        0,
        Math.min(sliderPosition.right - 10, ((moveEvent.clientX - rect.left) / rect.width) * 100),
      );

      setSliderPosition({ ...sliderPosition, left: newPosition });

      // Calculate new salary value
      const minSalary = 1000;
      const maxSalary = 25000;
      const newSalary = Math.round(minSalary + (newPosition / 100) * (maxSalary - minSalary));
      setSalaryRange([newSalary, salaryRange[1]]);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleRightThumbMouseDown = (e) => {
    e.preventDefault();

    // Store the slider container reference
    const sliderContainer = sliderRef.current;
    if (!sliderContainer) return;

    const handleMouseMove = (moveEvent) => {
      if (!sliderContainer) return;

      const rect = sliderContainer.getBoundingClientRect();
      const newPosition = Math.max(
        sliderPosition.left + 10,
        Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100),
      );

      setSliderPosition({ ...sliderPosition, right: newPosition });

      // Calculate new salary value
      const minSalary = 1000;
      const maxSalary = 25000;
      const newSalary = Math.round(minSalary + (newPosition / 100) * (maxSalary - minSalary));
      setSalaryRange([salaryRange[0], newSalary]);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handle touch events for mobile
  const handleTouchStart = (thumb) => (e) => {
    e.preventDefault();

    const sliderContainer = sliderRef.current;
    if (!sliderContainer) return;

    const handleTouchMove = (moveEvent) => {
      if (!sliderContainer || !moveEvent.touches[0]) return;

      const rect = sliderContainer.getBoundingClientRect();
      const touchX = moveEvent.touches[0].clientX;
      const percentage = ((touchX - rect.left) / rect.width) * 100;

      if (thumb === "left") {
        const newPosition = Math.max(0, Math.min(sliderPosition.right - 10, percentage));
        setSliderPosition({ ...sliderPosition, left: newPosition });

        const minSalary = 1000;
        const maxSalary = 25000;
        const newSalary = Math.round(minSalary + (newPosition / 100) * (maxSalary - minSalary));
        setSalaryRange([newSalary, salaryRange[1]]);
      } else {
        const newPosition = Math.max(sliderPosition.left + 10, Math.min(100, percentage));
        setSliderPosition({ ...sliderPosition, right: newPosition });

        const minSalary = 1000;
        const maxSalary = 25000;
        const newSalary = Math.round(minSalary + (newPosition / 100) * (maxSalary - minSalary));
        setSalaryRange([salaryRange[0], newSalary]);
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
  };

  return (
    <header className="bg-[#2A2438]">
      {/* Top navigation bar */}
      <div className="container mx-auto flex items-center justify-between py-4 px-6 border-b border-[#352F44]">
        <div className="flex items-center space-x-2">
          <img
            src="/images/nexhr-logo.png"
            alt="NexHR Logo"
            className="h-10 w-auto object-contain"
          />
          <div className="flex items-center">
            <span className="text-2xl font-bold text-[#e6e6ef]">
              Nex
            </span>
            <span className="text-2xl font-bold text-[#e6e6ef]">
              HR
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-8">
          <a
            href="#"
            className={`text-white py-1 text-sm font-medium transition-colors hover:text-[#DBD8E3] ${activeLink === "find-job" ? "border-b-2 border-white" : "hover:border-b-2 hover:border-white"
              }`}
            onClick={() => handleLinkClick("job-portal")}
          >
            Find job
          </a>
          <a
            href="#"
            className={`text-white py-1 text-sm font-medium transition-colors hover:text-[#DBD8E3] ${activeLink === "messages" ? "border-b-2 border-white" : "hover:border-b-2 hover:border-white"
              }`}
            onClick={() => handleLinkClick("")}
          >
            Home
          </a>
          {/* <a
            href="#"
            className={`text-white py-1 text-sm font-medium transition-colors hover:text-[#DBD8E3] ${activeLink === "hiring" ? "border-b-2 border-white" : "hover:border-b-2 hover:border-white"
              }`}
            onClick={() => handleLinkClick("hiring")}
          >
            Hiring
          </a>
          <a
            href="#"
            className={`text-white py-1 text-sm font-medium transition-colors hover:text-[#DBD8E3] ${activeLink === "community" ? "border-b-2 border-white" : "hover:border-b-2 hover:border-white"
              }`}
            onClick={() => handleLinkClick("community")}
          >
            Community
          </a>
          <a
            href="#"
            className={`text-white py-1 text-sm font-medium transition-colors hover:text-[#DBD8E3] ${activeLink === "faq" ? "border-b-2 border-white" : "hover:border-b-2 hover:border-white"
              }`}
            onClick={() => handleLinkClick("faq")}
          >
            FAQ
          </a> */}
        </nav>

        <div className="hidden md:flex items-center">
          <div className="w-8 h-8 rounded-full bg-[#5C5470] cursor-pointer hover:bg-[#DBD8E3] hover:text-[#2A2438] transition-colors flex items-center justify-center">
            <span className="font-medium text-xs">JD</span>
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            className="text-white focus:outline-none focus:ring-2 focus:ring-[#5C5470] rounded p-1"
            aria-label="Toggle navigation menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="container mx-auto px-6 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Job Type Dropdown */}
          <div
            className="relative"
            ref={(el) => {
              dropdownRefs.current.jobType = el;
            }}
          >
            <button
              onClick={() => toggleDropdown("jobType")}
              className="w-full flex items-center justify-between bg-transparent border border-[#5C5470] rounded-md px-4 py-2.5 text-white hover:border-[#DBD8E3] transition-colors text-sm"
              aria-expanded={activeDropdown === "jobType"}
              aria-haspopup="true"
            >
              <div className="flex items-center">
                <Search className="w-4 h-4 mr-3 text-[#DBD8E3]" />
                <span>{selectedJobType}</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "jobType" ? "rotate-180" : ""}`}
              />
            </button>
            {activeDropdown === "jobType" && (
              <div className="absolute z-10 mt-1 w-full bg-[#2A2438] border border-[#5C5470] rounded-md shadow-lg max-h-60 overflow-auto">
                {jobTypes.map((type) => (
                  <div
                    key={type}
                    className="px-4 py-2.5 hover:bg-[#352F44] text-white cursor-pointer text-sm"
                    onClick={() => selectOption("jobType", type)}
                  >
                    {type}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Location Dropdown */}
          <div
            className="relative"
            ref={(el) => {
              dropdownRefs.current.location = el;
            }}
          >
            <button
              onClick={() => toggleDropdown("location")}
              className="w-full flex items-center justify-between bg-transparent border border-[#5C5470] rounded-md px-4 py-2.5 text-white hover:border-[#DBD8E3] transition-colors text-sm"
              aria-expanded={activeDropdown === "location"}
              aria-haspopup="true"
            >
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-3 text-[#DBD8E3]" />
                <span>{selectedLocation}</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "location" ? "rotate-180" : ""}`}
              />
            </button>
            {activeDropdown === "location" && (
              <div className="absolute z-10 mt-1 w-full bg-[#2A2438] border border-[#5C5470] rounded-md shadow-lg max-h-60 overflow-auto">
                {locations.map((location) => (
                  <div
                    key={location}
                    className="px-4 py-2.5 hover:bg-[#352F44] text-white cursor-pointer text-sm"
                    onClick={() => selectOption("location", location)}
                  >
                    {location}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Experience Dropdown */}
          <div
            className="relative"
            ref={(el) => {
              dropdownRefs.current.experience = el;
            }}
          >
            <button
              onClick={() => toggleDropdown("experience")}
              className="w-full flex items-center justify-between bg-transparent border border-[#5C5470] rounded-md px-4 py-2.5 text-white hover:border-[#DBD8E3] transition-colors text-sm"
              aria-expanded={activeDropdown === "experience"}
              aria-haspopup="true"
            >
              <div className="flex items-center">
                <Activity className="w-4 h-4 mr-3 text-[#DBD8E3]" />
                <span>{selectedExperience}</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "experience" ? "rotate-180" : ""}`}
              />
            </button>
            {activeDropdown === "experience" && (
              <div className="absolute z-10 mt-1 w-full bg-[#2A2438] border border-[#5C5470] rounded-md shadow-lg max-h-60 overflow-auto">
                {experiences.map((exp) => (
                  <div
                    key={exp}
                    className="px-4 py-2.5 hover:bg-[#352F44] text-white cursor-pointer text-sm"
                    onClick={() => selectOption("experience", exp)}
                  >
                    {exp}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Period Dropdown */}
          <div
            className="relative"
            ref={(el) => {
              dropdownRefs.current.period = el;
            }}
          >
            <button
              onClick={() => toggleDropdown("period")}
              className="w-full flex items-center justify-between bg-transparent border border-[#5C5470] rounded-md px-4 py-2.5 text-white hover:border-[#DBD8E3] transition-colors text-sm"
              aria-expanded={activeDropdown === "period"}
              aria-haspopup="true"
            >
              <div className="flex items-center">
                <Monitor className="w-4 h-4 mr-3 text-[#DBD8E3]" />
                <span>{selectedPeriod}</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === "period" ? "rotate-180" : ""}`}
              />
            </button>
            {activeDropdown === "period" && (
              <div className="absolute z-10 mt-1 w-full bg-[#2A2438] border border-[#5C5470] rounded-md shadow-lg max-h-60 overflow-auto">
                {periods.map((period) => (
                  <div
                    key={period}
                    className="px-4 py-2.5 hover:bg-[#352F44] text-white cursor-pointer text-sm"
                    onClick={() => selectOption("period", period)}
                  >
                    {period}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Salary Range */}
          <div className="w-full sm:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-center text-white text-sm mb-3">
              <span className="text-sm">Salary range</span>
              <span className="font-medium text-sm">
                ${salaryRange[0].toLocaleString()} - ${salaryRange[1].toLocaleString()}
              </span>
            </div>
            <div
              ref={sliderRef}
              className="relative w-full h-1.5 bg-[#5C5470] rounded-full mt-3"
              aria-label="Salary range slider"
            >
              <div
                className="absolute h-1.5 bg-[#DBD8E3] rounded-full"
                style={{
                  left: `${sliderPosition.left}%`,
                  right: `${100 - sliderPosition.right}%`,
                }}
              ></div>
              <div
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full cursor-grab active:cursor-grabbing shadow-md"
                style={{ left: `${sliderPosition.left}%` }}
                onMouseDown={handleLeftThumbMouseDown}
                onTouchStart={handleTouchStart("left")}
                role="slider"
                aria-label="Minimum salary"
                aria-valuemin={1000}
                aria-valuemax={25000}
                aria-valuenow={salaryRange[0]}
                tabIndex={0}
              ></div>
              <div
                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full cursor-grab active:cursor-grabbing shadow-md"
                style={{ left: `${sliderPosition.right}%` }}
                onMouseDown={handleRightThumbMouseDown}
                onTouchStart={handleTouchStart("right")}
                role="slider"
                aria-label="Maximum salary"
                aria-valuemin={1000}
                aria-valuemax={25000}
                aria-valuenow={salaryRange[1]}
                tabIndex={0}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}