"use client"

import { useState } from "react"
import { Bookmark, BookmarkCheck } from "lucide-react"
import type { JobListing } from "@/types/jobPortal/types"
import { Linkedin } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom';

interface JobCardProps {
  job: JobListing
  isSaved: boolean
  onToggleSave: () => void
  onView?: (job: JobListing) => void
  showLinkedIn?: boolean
  onPostLinkedIn?: (job: JobListing) => Promise<void>
}

export default function JobCard({ job, isSaved, onToggleSave, onView, showLinkedIn = false, onPostLinkedIn }: JobCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const navigate = useNavigate();

  // Determine background color based on department (formerly company)
  const getBgColor = () => {
    const department = job.company.toLowerCase();

    switch (department) {
      case "marketing":
        return "bg-blue-50"
      case "development":
        return "bg-green-50"
      case "design":
        return "bg-purple-50"
      case "sales":
        return "bg-yellow-50"
      case "customer service":
        return "bg-pink-50"
      case "finance":
        return "bg-gray-50"
      case "human resources":
        return "bg-red-50"
      case "engineering":
        return "bg-indigo-50"
      case "product":
        return "bg-teal-50"
      case "operations":
        return "bg-orange-50"
      default:
        return "bg-[#F2F1F7]"
    }
  }

  // Get company/department logo initial
  const getDepartmentLogo = () => {
    return job.company.charAt(0).toUpperCase();
  }

  // const navigateToJobDetails = () => {
  //   navigate(`/jobs/${jobId}`);
  // };

  // Get logo background color
  const getLogoBgColor = () => {
    const department = job.company.toLowerCase();

    switch (department) {
      case "marketing":
        return "bg-blue-600 text-white"
      case "development":
        return "bg-green-600 text-white"
      case "design":
        return "bg-purple-600 text-white"
      case "sales":
        return "bg-yellow-600 text-white"
      case "customer service":
        return "bg-pink-600 text-white"
      case "finance":
        return "bg-gray-700 text-white"
      case "human resources":
        return "bg-red-600 text-white"
      case "engineering":
        return "bg-indigo-600 text-white"
      case "product":
        return "bg-teal-600 text-white"
      case "operations":
        return "bg-orange-600 text-white"
      default:
        return "bg-[#2A2438] text-white"
    }
  }

  // Format the salary display
  const formatSalary = () => {
    // Check if tags exist and are strings before calling includes
    const currencyInfo = job.tags.find(tag => 
      typeof tag === 'string' && (tag.includes("USD") || tag.includes("EUR") || tag.includes("GBP"))
    );
    if (currencyInfo) {
      return currencyInfo; // Return the full salary range with currency
    }
    return `$${job.salary}/${job.salary_period}`; // Use salary_period from job data
  }

  return (
    <div className="relative">
      <div
        className={`rounded-xl overflow-hidden ${getBgColor()} transition-all duration-300 ${
          isHovered ? "shadow-lg" : "shadow"
        } flex flex-col h-[280px]`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Main content area */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Date and Bookmark */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs bg-white px-3 py-1 rounded-full text-[#5C5470]">{job.date}</div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleSave()
            }}
            className="text-[#5C5470] hover:text-[#2A2438] transition-colors"
          >
            {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
          </button>
        </div>

        {/* Job Title and department */}
        <div className="mb-3">
          <div className="text-sm text-[#5C5470] mb-1">{job.company}</div>
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg text-[#2A2438] pr-2">{job.title}</h3>
            <div
              className={`w-8 h-8 rounded-full ${getLogoBgColor()} flex items-center justify-center font-bold text-sm`}
            >
              {getDepartmentLogo()}
            </div>
          </div>
        </div>

        {/* Tags */}
        {Array.isArray(job.tags) && job.tags.filter(Boolean).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {job.tags.filter(Boolean).map((tag, index) => (
              <span
                key={index}
                className="text-xs px-3 py-1 rounded-full bg-white text-[#5C5470] border border-[#DBD8E3] mb-1 mr-1"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Spacer to push salary and details to bottom */}
        <div className="flex-grow"></div>

        {/* Salary and Location */}
        <div className="flex justify-between items-center mt-auto">
          <div>
            <div className="text-base font-bold text-[#2A2438]">{formatSalary()}</div>
            {job.location ? (
              <div className="text-xs text-[#5C5470]">{job.location}</div>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={(e)=> {
              e.stopPropagation();
              if (onView) onView(job);
              else navigate("/job-detail");
            }} className="bg-[#2A2438] hover:bg-[#352F44] text-white text-sm font-medium px-5 py-2 rounded-full transition-all duration-200 hover:scale-105">
              View
            </button>

            {showLinkedIn && (
              (job as any).linkedin_post_url ? (
                <a
                  href={(job as any).linkedin_post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full bg-gradient-to-r from-[#0A66C2] to-[#0073b1] text-white hover:opacity-95 transition"
                >
                  <Linkedin className="w-4 h-4" />
                  See on LinkedIn
                </a>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onPostLinkedIn) onPostLinkedIn(job);
                  }}
                  className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full bg-gradient-to-r from-[#0A66C2] to-[#0073b1] text-white hover:opacity-95 transition"
                >
                  <Linkedin className="w-4 h-4" />
                  Post on LinkedIn
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}