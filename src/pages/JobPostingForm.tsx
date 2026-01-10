import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import DashboardLayout from "@/layouts/DashboardLayout";
import { jobService } from "@/services/JobService";
import branchDepartmentService, { Department } from '@/services/branchDepartmentService';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const JobPostingForm: React.FC = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
    job_type: "FULL_TIME",
    min_salary: "",
    max_salary: "",
    application_deadline: "",
    department: "",
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch departments on component mount
  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const data = await branchDepartmentService.getDepartments();
        setDepartments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Job title is required";
    if (!formData.description.trim())
      newErrors.description = "Job description is required";
    if (!formData.requirements.trim())
      newErrors.requirements = "Job requirements are required";
    if (!formData.location.trim())
      newErrors.location = "Job location is required";
    if (!formData.application_deadline)
      newErrors.application_deadline = "Application deadline is required";

    const minSalary = parseFloat(formData.min_salary);
    const maxSalary = parseFloat(formData.max_salary);

    if (isNaN(minSalary) || minSalary < 0)
      newErrors.min_salary = "Minimum salary must be a positive number";
    if (isNaN(maxSalary) || maxSalary < 0)
      newErrors.max_salary = "Maximum salary must be a positive number";
    if (!isNaN(minSalary) && !isNaN(maxSalary) && minSalary > maxSalary) {
      newErrors.min_salary = "Minimum salary cannot be greater than maximum";
      newErrors.max_salary = "Maximum salary cannot be less than minimum";
    }

    const deadline = new Date(formData.application_deadline);
    const today = new Date();
    if (deadline < today)
      newErrors.application_deadline = "Application deadline must be a future date";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await jobService.postJob({
        job_title: formData.title,
        department: formData.department || null,
        job_type: formData.job_type,
        location_type: "onsite",
        city: formData.location,
        state: null,
        country: null,
        salary_from: parseFloat(formData.min_salary) || 0,
        salary_to: parseFloat(formData.max_salary) || 0,
        currency: "USD",
        period: "monthly",
        job_description: `${formData.description}\n\nRequirements:\n${formData.requirements}`,
        experience_level: 1,
        job_deadline: formData.application_deadline,
        required_skills: [],
        job_schema: {
          name: true,
          email: true,
          phone: true,
          resume_url: true,
          gender: true,
          address: true,
          cover_letter_url: true,
          dob: true,
          education: true,
          experience: true,
          skills: true,
        },
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Job posted successfully!",
        });
        setFormData({
          title: "",
          description: "",
          requirements: "",
          location: "",
          job_type: "FULL_TIME",
          min_salary: "",
          max_salary: "",
          application_deadline: "",
          department: "",
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to post job",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong while posting the job.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Post a New Job
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
          {/* Job Title */}
          <div>
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Department */}
          <div>
            <Label htmlFor="department">Department</Label>
            {loadingDepartments ? (
              <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                <span className="text-sm text-gray-500">Loading departments...</span>
              </div>
            ) : (
              <>
                {departments.length === 0 && (
                  <p className="text-sm text-gray-500 mb-2">
                    No departments available. Please create a department in{' '}
                    <a href="/branches-departments" className="text-blue-600 hover:underline">
                      Branches & Departments
                    </a>
                    {' '}first.
                  </p>
                )}
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                  disabled={departments.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Requirements */}
          <div>
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              className={errors.requirements ? "border-red-500" : ""}
            />
            {errors.requirements && (
              <p className="text-red-500 text-sm mt-1">
                {errors.requirements}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={errors.location ? "border-red-500" : ""}
            />
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">{errors.location}</p>
            )}
          </div>

          {/* Job Type */}
          <div>
            <Label htmlFor="job_type">Job Type</Label>
            <select
              id="job_type"
              name="job_type"
              value={formData.job_type}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
          </div>

          {/* Salary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_salary">Minimum Salary</Label>
              <Input
                id="min_salary"
                name="min_salary"
                type="number"
                value={formData.min_salary}
                onChange={handleChange}
                className={errors.min_salary ? "border-red-500" : ""}
              />
              {errors.min_salary && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.min_salary}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="max_salary">Maximum Salary</Label>
              <Input
                id="max_salary"
                name="max_salary"
                type="number"
                value={formData.max_salary}
                onChange={handleChange}
                className={errors.max_salary ? "border-red-500" : ""}
              />
              {errors.max_salary && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.max_salary}
                </p>
              )}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <Label htmlFor="application_deadline">Application Deadline</Label>
            <Input
              id="application_deadline"
              name="application_deadline"
              type="date"
              value={formData.application_deadline}
              onChange={handleChange}
              className={errors.application_deadline ? "border-red-500" : ""}
            />
            {errors.application_deadline && (
              <p className="text-red-500 text-sm mt-1">
                {errors.application_deadline}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#5C5470] hover:bg-[#352F44]"
          >
            {isSubmitting ? "Posting..." : "Post Job"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default JobPostingForm;
