import React, { useState, useEffect, ChangeEvent, useMemo } from "react";
import Select, { StylesConfig } from "react-select";
import DashboardLayout from '@/layouts/DashboardLayout';
import StepProgressBar from '../components/job-post/StepProgressBar';
import GeneralInfoTab from '../components/job-post/GeneralInfoTab';
import ApplicationFormTab from '../components/job-post/ApplicationFormTab';
import ReviewTab from '../components/job-post/ReviewTab';
import JobPostedModal from '../components/modals/JobPostedModal';
import { jobService, JobPostData, RequiredSkill } from '@/services/JobService';
import { linkedinService } from '@/services/linkedinService';
import { useNavigate } from 'react-router-dom';


import {
  countryData,
  jobCategories,
  OptionType,
} from "../data/formData";

// --- Helper Types ---
interface FormData {
  jobTitle: string;
  Department: OptionType | null;
  jobType: string;
  locationType: string;
  country: OptionType | null;
  state: OptionType | null;
  city: OptionType | null;
  salaryMin: string;
  salaryMax: string;
  currency: string;
  period: string;
  jobDescription: string;
  deadline: string | null;
  applicationDeadline: string;
  experienceLevel: string;
  educationLevel: string;
  screeningQuestions: string[];
  customFormQuestions: CustomFormQuestion[];
  customFormAnswers: CustomFormAnswers;
  required_skills: RequiredSkill[];
}


interface CustomFormAnswers {
  [key: string]: string | Array<Record<string, string>>;
}

export interface CustomFormQuestion {
  id: string;
  label: string;
  type: 'text' | 'email' | 'telephone' | 'file' | 'textarea' | 'dropdown' | 'radio' | 'date' | 'education' | 'experience';
  enabled: boolean;
}

// Type for validation errors
type ValidationErrors = Partial<Record<keyof FormData, string>>;

// --- react-select custom styles for visibility ---
const selectStyles: StylesConfig<OptionType, boolean> = {
  control: (base) => ({
    ...base,
    backgroundColor: "#FFFFFF",
    borderColor: "#DBD8E3",
    color: "#2A2438",
    "&:hover": { borderColor: "#DBD8E3" },
  }),
  singleValue: (base) => ({
    ...base,
    color: "#2A2438",
  }),
  placeholder: (base) => ({
    ...base,
    color: "#5C5470",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "#F2F1F7",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#DBD8E3" : state.isFocused ? "#F2F1F7" : "#FFFFFF",
    color: "#2A2438",
    cursor: "pointer",
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#DBD8E3",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "#2A2438",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#2A2438",
    "&:hover": {
      backgroundColor: "#5C5470",
      color: "white",
    },
  }),
};

// --- Main Job Post Form Component ---
const JobPostForm: React.FC = () => {
  // --- Main Job Post State Initialization ---
  const [formData, setFormData] = useState<FormData>({
    jobTitle: "",
    Department: null,
    jobType: "Full-time",
    locationType: "On-site",
    country: null,
    state: null,
    city: null,
    salaryMin: "",
    salaryMax: "",
    currency: "USD",
    period: "Monthly",
    jobDescription: "",
    deadline: null,
    applicationDeadline: "",
    experienceLevel: "",
    educationLevel: "",
    screeningQuestions: [""],
    customFormQuestions: [
      { id: 'candidate_fname', label: 'First Name', type: 'text', enabled: false },
      { id: 'candidate_lname', label: 'Last Name', type: 'text', enabled: false },
      { id: 'email', label: 'Email', type: 'email', enabled: false },
      { id: 'phone', label: 'Phone', type: 'telephone', enabled: false },
      { id: 'resume_url', label: 'Resume URL', type: 'text', enabled: false },
      { id: 'applied_at', label: 'Applied At', type: 'date', enabled: false },
      { id: 'gender', label: 'Gender', type: 'radio', enabled: false },
      { id: 'address', label: 'Address', type: 'text', enabled: false },
      { id: 'DOB', label: 'Date of Birth', type: 'date', enabled: false },
      { id: 'cover_letter', label: 'Cover Letter', type: 'textarea', enabled: false },
      { id: 'education', label: 'Education', type: 'education', enabled: false },
      { id: 'experience', label: 'Experience', type: 'experience', enabled: false },
    ],
    customFormAnswers: {},
    required_skills: [],
  });
  const [jobId, setJobId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [states, setStates] = useState<OptionType[]>([]);
  const [cities, setCities] = useState<OptionType[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [apiDepartments, setApiDepartments] = useState<OptionType[]>([]);
  const navigate = useNavigate();

  // --- State to Trigger Modal and Mark Review as Completed ---
  const [jobPostedModal, setJobPostedModal] = useState(false);
  
  const [reviewCompleted, setReviewCompleted] = useState(false);

  // Loading state to prevent double submit and show loader
  const [isPosting, setIsPosting] = useState(false);

  // --- Custom Form Builder State ---
  const [showCustomForm, setShowCustomForm] = useState(false);

  const toggleQuestion = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      customFormQuestions: prev.customFormQuestions.map(q =>
        q.id === questionId ? { ...q, enabled: !q.enabled } : q
      )
    }));
    setShowCustomForm(false);
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  // --- Validation Function ---
  const validateStep = (): boolean => {
    const errors: ValidationErrors = {};
    if (currentStep === 1) {
      if (!formData.jobTitle.trim()) {
        errors.jobTitle = "Job Title cannot be empty";
      }
      if (!formData.Department) {
        errors.Department = "Department is required";
      }
      if (!formData.jobDescription.trim()) {
        errors.jobDescription = "Job Description cannot be empty";
      }
      if (formData.locationType !== "Remote") {
        if (!formData.country) {
          errors.country = "Country is required";
        }
        if (!formData.state) {
          errors.state = "State is required";
        }
        if (!formData.city) {
          errors.city = "City is required";
        }
      }
      if (!formData.experienceLevel.trim()) {
        errors.experienceLevel = "Experience Level is required";
      } else {
        const expLevel = Number(formData.experienceLevel);
        if (isNaN(expLevel) || expLevel < 0 || expLevel > 50) {
          errors.experienceLevel = "Experience Level must be a valid number between 0 and 50";
        }
      }
      if (!formData.required_skills || formData.required_skills.length === 0) {
        errors.required_skills = "At least one required skill must be selected";
      }
    } else if (currentStep === 2) {
      // For Application Form tab, require that Education is selected.
      if (!formData.educationLevel.trim()) {
        errors.educationLevel = "Education Level is required";
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- Form Input Handlers ---
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (validationErrors[name as keyof FormData]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormData];
        return newErrors;
      });
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (
    name: keyof FormData,
    selectedOption: OptionType | null
  ) => {
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    if (name === "country") {
      const country = selectedOption as OptionType | null;
      setFormData((prev) => ({ ...prev, country, state: null, city: null }));
      if (country && countryData[country.value]) {
        const stateOptions = Object.keys(countryData[country.value].states).map(
          (stateItem) => ({
            value: stateItem,
            label: stateItem,
          })
        );
        setStates(stateOptions);
      } else {
        setStates([]);
      }
      setCities([]);
    } else if (name === "state") {
      const stateVal = selectedOption as OptionType | null;
      setFormData((prev) => ({ ...prev, state: stateVal, city: null }));
      if (stateVal && formData.country && countryData[formData.country.value]) {
        const cityOptions = (
          countryData[formData.country.value].states[stateVal.value] || []
        ).map((city: string) => ({
          value: city,
          label: city,
        }));
        setCities(cityOptions);
      } else {
        setCities([]);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: selectedOption }));
    }
  };

  const handleSkillsChange = (skills: RequiredSkill[]) => {
    if (validationErrors.required_skills) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.required_skills;
        return newErrors;
      });
    }
    setFormData((prev) => ({ ...prev, required_skills: skills }));
  };

  const handleScreeningQuestionChange = (index: number, value: string) => {
    const updatedQuestions = [...formData.screeningQuestions];
    updatedQuestions[index] = value;
    setFormData((prev) => ({ ...prev, screeningQuestions: updatedQuestions }));
  };

  const addScreeningQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      screeningQuestions: [...prev.screeningQuestions, ""],
    }));
  };

  const removeScreeningQuestion = (index: number) => {
    if (formData.screeningQuestions.length <= 1) return;
    const updatedQuestions = formData.screeningQuestions.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({ ...prev, screeningQuestions: updatedQuestions }));
  };

  // --- Navigation Logic ---
  const handleNext = () => {
    if (!validateStep()) return;
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // "Post Job" is now triggered only on Step 3.
  const handlePostJob = async () => {
    if (isPosting) return; // prevent double submit
    setIsPosting(true);
    // Convert datetime-local value to ISO string format
    const formatDeadline = (deadline: string | null): string | null => {
      if (!deadline) return null;
      // Convert from datetime-local format (YYYY-MM-DDTHH:MM) to ISO format (YYYY-MM-DDTHH:MM:SS.sssZ)
      const date = new Date(deadline);
      return date.toISOString();
    };

    const jobJson: JobPostData = {
      job_title: formData.jobTitle || null,
      department: formData.Department?.value || null,
      job_type: formData.jobType || null,
      location_type: formData.locationType || null,
      city: formData.city?.value || null,
      state: formData.state?.value || null,
      country: formData.country?.value || null,
      salary_from: formData.salaryMin ? Number(formData.salaryMin) : null,
      salary_to: formData.salaryMax ? Number(formData.salaryMax) : null,
      currency: formData.currency || null,
      period: formData.period || null,
      job_description: formData.jobDescription || null,
      experience_level: formData.experienceLevel ? Number(formData.experienceLevel) : null,
      job_deadline: formatDeadline(formData.deadline),
      required_skills: formData.required_skills || [],
      job_schema: {
        name:
          !!(formData.customFormQuestions.find(q => q.id === 'candidate_fname' && q.enabled) ||
            formData.customFormQuestions.find(q => q.id === 'candidate_lname' && q.enabled)),
        email: !!formData.customFormQuestions.find(q => q.id === 'email' && q.enabled),
        phone: !!formData.customFormQuestions.find(q => q.id === 'phone' && q.enabled),
        resume_url: !!formData.customFormQuestions.find(q => q.id === 'resume_url' && q.enabled),
        gender: !!formData.customFormQuestions.find(q => q.id === 'gender' && q.enabled),
        address: !!formData.customFormQuestions.find(q => q.id === 'address' && q.enabled),
        cover_letter_url: !!formData.customFormQuestions.find(q => q.id === 'cover_letter' && q.enabled),
        dob: !!formData.customFormQuestions.find(q => q.id === 'DOB' && q.enabled),
        education: !!formData.customFormQuestions.find(q => q.id === 'education' && q.enabled),
        experience: !!formData.customFormQuestions.find(q => q.id === 'experience' && q.enabled),
        skills: false, // Always false since we removed the skills field
      },
    };

    console.log('Posting Job Object:', jobJson);

    const response = await jobService.postJob(jobJson);

    if (response.success) {
      console.log('Job posted successfully!', response.jobId);
      setReviewCompleted(true);
      setJobId(response.jobId)
      setJobPostedModal(true);
    } else {
      console.error('Failed to post job:', response.message);
      // optionally show error to user
    }
    setIsPosting(false);
  };


  // --- Memoized Options for Select Dropdowns ---
  const countryOptions = useMemo(
    () =>
      Object.keys(countryData).map((country) => ({
        value: country,
        label: country,
      })),
    []
  );
  const DepartmentOptions = useMemo(() => jobCategories, []);

  // Fetch departments from backend and map to OptionType
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('http://localhost:8000/api/departments/', { headers });
        if (!res.ok) throw new Error(`Failed to fetch departments: ${res.status}`);
        const data = await res.json();

        // Expecting either an array of { id, name } or { id, department_name }
        if (Array.isArray(data)) {
          const opts = data.map((d: any) => {
            const label = d.name || d.department_name || d.title || String(d.id);
            return { value: String(d.id), label } as OptionType;
          });
          setApiDepartments(opts);
        }
      } catch (err) {
        console.error('Failed to load departments', err);
        setApiDepartments([]);
      }
    };

    loadDepartments();
  }, []);

  const steps = ["General Info", "Application Form", "Review"];

  // --- Custom Form Builder Component ---
  const CustomFormBuilder: React.FC = () => {
    const enabledQuestions = formData.customFormQuestions.filter(q => q.enabled);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Custom Application Form</h3>
        <p className="text-sm text-gray-500">
          Toggle the questions you want to include in your application form
        </p>
        <div className="space-y-4">
          {formData.customFormQuestions.map((question) => (
            <div key={question.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <div>
                <h4 className="font-medium text-gray-900">{question.label}</h4>
                <p className="text-sm text-gray-500">Type: {question.type === 'dropdown' ? 'select' : question.type}</p>
              </div>
              <button
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    customFormQuestions: prev.customFormQuestions.map(q =>
                      q.id === question.id ? { ...q, enabled: !q.enabled } : q
                    )
                  }));
                  setShowCustomForm(false);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${question.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${question.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>
          ))}
        </div>
        {formData.customFormQuestions.some(q => q.enabled) && !showCustomForm && (
          <button
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition"
            onClick={() => setShowCustomForm(true)}
            type="button"
          >
            Create
          </button>
        )}
        {showCustomForm && (
          <form
            className="mt-6 space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
            action="#"
            onSubmit={e => {
              e.preventDefault();
              return false; // Do nothing, prevent navigation
            }}
          >
            <h4 className="font-semibold text-gray-900 mb-2">Generated Application Form</h4>
            {enabledQuestions.map(q => (
              <div key={q.id} className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700" htmlFor={q.id}>{q.label}</label>
                {q.type === "file" ? (
                  <input
                    type="file"
                    name={q.id}
                    id={q.id}
                    className="border rounded px-3 py-2"
                    onChange={e => {
                      const files = e.target.files;
                      setFormData(prev => ({
                        ...prev,
                        customFormAnswers: {
                          ...prev.customFormAnswers,
                          [q.id]: files && files[0] ? files[0].name : "",
                        }
                      }));
                    }}
                  />
                ) : q.type === "textarea" ? (
                  <textarea
                    name={q.id}
                    id={q.id}
                    rows={5}
                    className="border rounded px-3 py-2"
                    style={{ backgroundColor: "#FFFFFF", color: "#2A2438", borderColor: "#DBD8E3" }}
                    value={formData.customFormAnswers[q.id]?.toString() || ""}
                    onChange={e => {
                      setFormData(prev => ({
                        ...prev,
                        customFormAnswers: {
                          ...prev.customFormAnswers,
                          [q.id]: e.target.value,
                        }
                      }));
                    }}
                    placeholder="List any relevant skills"
                  />
                ) : q.type === "dropdown" ? (
                  <select
                    name={q.id}
                    id={q.id}
                    className="border rounded px-3 py-2 text-[#2A2438]"
                    style={{ backgroundColor: "#FFFFFF", borderColor: "#DBD8E3" }}
                    value={formData.customFormAnswers[q.id]?.toString() || ""}
                    onChange={e => {
                      setFormData(prev => ({
                        ...prev,
                        customFormAnswers: {
                          ...prev.customFormAnswers,
                          [q.id]: e.target.value,
                        }
                      }));
                    }}
                  >
                    <option value="">Select experience level</option>
                    <option value="Entry Level">Entry Level</option>
                    <option value="Mid Level">Mid Level</option>
                    <option value="Senior Level">Senior Level</option>
                    <option value="Executive Level">Executive Level</option>
                  </select>
                ) : (
                  <input
                    type={q.type === "telephone" ? "tel" : q.type}
                    name={q.id}
                    id={q.id}
                    className="border rounded px-3 py-2"
                    value={formData.customFormAnswers[q.id]?.toString() || ""}
                    onChange={e => {
                      setFormData(prev => ({
                        ...prev,
                        customFormAnswers: {
                          ...prev.customFormAnswers,
                          [q.id]: e.target.value,
                        }
                      }));
                    }}
                  />
                )}
                {q.id === 'skills' && (
                  <span className="text-xs text-[#5C5470] mt-1">List any relevant skills</span>
                )}
                {q.id === 'experienceLevel' && (
                  <span className="text-xs text-[#5C5470] mt-1">Select your experience level</span>
                )}
              </div>
            ))}
            <button
              type="submit"
              tabIndex={-1}
              className="w-full mt-2 px-6 py-2 bg-[#352F44] text-white rounded-md shadow hover:bg-indigo-700 transition"
            >
              Submit
            </button>
          </form>
        )}
      </div>
    );
  };

  const handleCustomFormInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      customFormAnswers: {
        ...prev.customFormAnswers,
        [name]: value,
      }
    }));
  };

  const handleEducationChange = (idx: number, field: string, value: string) => {
    setFormData(prev => {
      const arr = Array.isArray(prev.customFormAnswers.education) ? prev.customFormAnswers.education : [];
      const updated = [...arr];
      updated[idx] = { ...updated[idx], [field]: value };
      return {
        ...prev,
        customFormAnswers: {
          ...prev.customFormAnswers,
          education: updated,
        }
      };
    });
  };

  const addEducationBlock = () => {
    setFormData(prev => {
      const arr = Array.isArray(prev.customFormAnswers.education) ? prev.customFormAnswers.education : [];
      return {
        ...prev,
        customFormAnswers: {
          ...prev.customFormAnswers,
          education: [...arr, {}],
        }
      };
    });
  };

  const handleExperienceChange = (idx: number, field: string, value: string) => {
    setFormData(prev => {
      const arr = Array.isArray(prev.customFormAnswers.experience) ? prev.customFormAnswers.experience : [];
      const updated = [...arr];
      updated[idx] = { ...updated[idx], [field]: value };
      return {
        ...prev,
        customFormAnswers: {
          ...prev.customFormAnswers,
          experience: updated,
        }
      };
    });
  };

  const addExperienceBlock = () => {
    setFormData(prev => {
      const arr = Array.isArray(prev.customFormAnswers.experience) ? prev.customFormAnswers.experience : [];
      return {
        ...prev,
        customFormAnswers: {
          ...prev.customFormAnswers,
          experience: [...arr, {}],
        }
      };
    });
  };

  // Handler for posting job on LinkedIn
  const handlePostLinkedIn = async () => {
    console.log(`job of id ${jobId} is going to be posted on linked in`)
    try {
      const res = await linkedinService.postJobToLinkedIn(jobId);
      alert(res.message);
    } catch {
      alert('Failed to post job to LinkedIn');
    }
  };

  return (
    <DashboardLayout>
      <div
        className='container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl rounded-md shadow-lg my-10'
        style={{ backgroundColor: "#FFFFFF", color: "#2A2438" }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
          Post a New Job
        </h1>

        <StepProgressBar currentStep={currentStep} steps={steps} reviewCompleted={reviewCompleted} />

        <form onSubmit={(e) => {
          e.preventDefault();
          if (currentStep === 3) {
            handlePostJob();
          }
        }}>
          {/* Step 1: General Information */}
          {currentStep === 1 && (
            <GeneralInfoTab
              formData={formData}
              validationErrors={validationErrors}
              isClient={isClient}
              states={states}
              cities={cities}
              countryOptions={countryOptions}
              DepartmentOptions={apiDepartments}
              selectStyles={selectStyles}
              handleInputChange={handleInputChange}
              handleSelectChange={handleSelectChange}
              handleSkillsChange={handleSkillsChange}
            />
          )}

          {/* Step 2: Application Form */}
          {currentStep === 2 && (
            <ApplicationFormTab
              formData={formData}
              validationErrors={validationErrors}
              customFormQuestions={formData.customFormQuestions}
              customFormAnswers={formData.customFormAnswers}
              showCustomForm={showCustomForm}
              handleInputChange={handleInputChange}
              onToggleQuestion={toggleQuestion}
              onShowCustomForm={setShowCustomForm}
              onCustomFormInput={handleCustomFormInput}
            />
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <ReviewTab
              formData={{
                jobTitle: formData.jobTitle,
                Department: formData.Department,
                jobType: formData.jobType,
                locationType: formData.locationType,
                country: formData.country,
                state: formData.state,
                city: formData.city,
                salaryMin: formData.salaryMin,
                salaryMax: formData.salaryMax,
                currency: formData.currency,
                period: formData.period,
                jobDescription: formData.jobDescription,
                deadline: formData.deadline,
                experienceLevel: formData.experienceLevel,
                educationLevel: formData.educationLevel,
                screeningQuestions: formData.screeningQuestions
              }}
              customFormQuestions={formData.customFormQuestions}
              customFormAnswers={formData.customFormAnswers as Record<string, string>}
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md transition duration-150 ease-in-out"
                style={{ backgroundColor: "#352F44", color: "#FFFFFF" }}
              >
                Previous
              </button>
            )}
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md transition duration-150 ease-in-out"
                style={{ backgroundColor: "#352F44", color: "#FFFFFF" }}
              >
                Save and Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePostJob}
                className="inline-flex justify-center items-center gap-2 py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md transition duration-150 ease-in-out"
                style={{ backgroundColor: "#352F44", color: "#FFFFFF" }}
                disabled={isPosting}
              >
                {isPosting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Posting...
                  </>
                ) : (
                  'Post Job'
                )}
              </button>
            )}
          </div>
        </form>

        {/* Job Posted Modal Dialog */}
        {jobPostedModal && (
          <JobPostedModal
            open={jobPostedModal}
            onClose={() => {
              setJobPostedModal(false) 
              navigate('/job-portal')}
            }
            onPostLinkedIn={handlePostLinkedIn}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default JobPostForm;
