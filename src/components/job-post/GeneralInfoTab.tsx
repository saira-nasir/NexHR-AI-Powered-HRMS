import React from 'react';
import Select, { components as RSComponents, MultiValue, ActionMeta, StylesConfig } from "react-select";
import { ChevronDown } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';
import { OptionType } from "../../data/formData";
import RequiredSkillsField from './RequiredSkillsField';
import { RequiredSkill } from '../../services/JobService';
// SkillsTest removed — debug code cleaned up

interface GeneralInfoTabProps {
  formData: {
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
    experienceLevel: string;
    educationLevel: string;
    required_skills: RequiredSkill[];
  };
  validationErrors: Record<string, string>;
  isClient: boolean;
  states: OptionType[];
  cities: OptionType[];
  countryOptions: OptionType[];
  DepartmentOptions: OptionType[];
  selectStyles: StylesConfig<OptionType, boolean>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSelectChange: (name: string, selectedOption: OptionType | MultiValue<OptionType> | null) => void;
  handleSkillsChange: (skills: RequiredSkill[]) => void;
  minDeadline?: string;
}

const GeneralInfoTab: React.FC<GeneralInfoTabProps> = ({
  formData,
  validationErrors,
  isClient,
  states,
  cities,
  countryOptions,
  DepartmentOptions,
  selectStyles,
  handleInputChange,
  handleSelectChange,
  handleSkillsChange,
  minDeadline,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold border-b pb-2 mb-4 border-[#DBD8E3]">
        General Information
      </h2>
      
      {/* Job Title and Deadline - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="jobTitle" className="block text-sm font-medium mb-1">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="jobTitle"
            name="jobTitle"
            value={formData.jobTitle}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-[#352F44] focus:border-[#352F44] transition duration-150 ease-in-out"
            style={{
              borderColor: validationErrors.jobTitle ? "red" : "#DBD8E3",
              backgroundColor: "#FFFFFF",
              color: "#2A2438",
            }}
            placeholder="e.g., Senior Software Engineer"
          />
          {validationErrors.jobTitle && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.jobTitle}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="deadline" className="block text-sm font-medium mb-1">
            Deadline
          </label>
          <input
            type="datetime-local"
            id="deadline"
            name="deadline"
            value={formData.deadline || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-[#352F44] focus:border-[#352F44] transition duration-150 ease-in-out"
            style={{ borderColor: validationErrors.deadline ? "red" : "#DBD8E3", backgroundColor: "#FFFFFF", color: "#2A2438" }}
            min={minDeadline}
          />
          <p className="mt-1 text-xs text-gray-500">Select both date and time for the application deadline</p>
          {validationErrors.deadline && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.deadline}</p>
          )}
        </div>
      </div>

      {/* Experience Level & Education Level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="experienceLevel" className="block text-sm font-medium mb-1">
            Experience Level (Years) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="experienceLevel"
            name="experienceLevel"
            value={formData.experienceLevel}
            onChange={handleInputChange}
            required
            min="0"
            max="50"
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-[#352F44] focus:border-[#352F44] transition duration-150 ease-in-out"
            style={{ 
              borderColor: validationErrors.experienceLevel ? "red" : "#DBD8E3", 
              backgroundColor: "#FFFFFF", 
              color: "#2A2438" 
            }}
            placeholder="e.g., 5"
          />
          {validationErrors.experienceLevel && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.experienceLevel}</p>
          )}
        </div>
        <div>
          <label htmlFor="educationLevel" className="block text-sm font-medium mb-1">
            Education Level <span className="text-red-500">*</span>
          </label>
          <select
            id="educationLevel"
            name="educationLevel"
            value={formData.educationLevel}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-[#352F44] focus:border-[#352F44] transition duration-150 ease-in-out h-[42px]"
            style={{ borderColor: validationErrors.educationLevel ? "red" : "#DBD8E3", backgroundColor: "#FFFFFF", color: "#2A2438" }}
          >
            <option value="">Select Education Level</option>
            <option value="High School">High School</option>
            <option value="Associate Degree">Associate Degree</option>
            <option value="Bachelor's Degree">Bachelor's Degree</option>
            <option value="Master's Degree">Master's Degree</option>
            <option value="Doctorate">Doctorate</option>
          </select>
          {validationErrors.educationLevel && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.educationLevel}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="Department" className="block text-sm font-medium mb-1">
            Department <span className="text-red-500">*</span>
          </label>
          {isClient ? (
            <>
              <Select<OptionType>
                id="Department"
                name="Department"
                options={DepartmentOptions && DepartmentOptions.length > 0 ? DepartmentOptions : [{ value: '', label: 'No departments available', isDisabled: true } as any]}
                value={formData.Department}
                onChange={(option) => handleSelectChange("Department", option)}
                classNamePrefix="select"
                placeholder={DepartmentOptions && DepartmentOptions.length > 0 ? "Select Department..." : "No departments available"}
                isClearable
                isDisabled={!(DepartmentOptions && DepartmentOptions.length > 0)}
                required
                styles={{
                  ...selectStyles,
                  control: (base) => ({
                    ...base,
                    backgroundColor: "#FFFFFF",
                    borderColor: validationErrors.Department ? "red" : "#DBD8E3",
                    color: "#2A2438",
                    "&:hover": {
                      borderColor: validationErrors.Department ? "red" : "#DBD8E3",
                    },
                  }),
                }}
                components={{
                  DropdownIndicator: (props) => (
                    <RSComponents.DropdownIndicator {...props}>
                      <ChevronDown className="w-4 h-4 text-[#5C5470]" />
                    </RSComponents.DropdownIndicator>
                  ),
                }}
              />
              {DepartmentOptions && DepartmentOptions.length === 0 && (
                <p className="text-amber-600 text-xs mt-1">
                  ⚠️ To create a job post, first create a department for that job.
                </p>
              )}
            </>
          ) : (
            <div className="w-full h-[42px] rounded-md animate-pulse" style={{ backgroundColor: "#F2F1F7", border: "1px solid #DBD8E3" }} />
          )}
          {validationErrors.Department && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.Department}</p>
          )}
        </div>
        <div>
          <label htmlFor="jobType" className="block text-sm font-medium mb-1">
            Job Type <span className="text-red-500">*</span>
          </label>
          <select
            id="jobType"
            name="jobType"
            value={formData.jobType}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-[#352F44] focus:border-[#352F44] transition duration-150 ease-in-out h-[42px]"
            style={{ borderColor: "#DBD8E3", backgroundColor: "#FFFFFF", color: "#2A2438" }}
          >
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Contract</option>
            <option>Temporary</option>
            <option>Internship</option>
            <option>Volunteer</option>
          </select>
        </div>
      </div>

      {/* Location Type & Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="locationType" className="block text-sm font-medium mb-1">
            Location Type <span className="text-red-500">*</span>
          </label>
          <select
            id="locationType"
            name="locationType"
            value={formData.locationType}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-[#352F44] focus:border-[#352F44] transition duration-150 ease-in-out h-[42px]"
            style={{ borderColor: "#DBD8E3", backgroundColor: "#FFFFFF", color: "#2A2438" }}
          >
            <option>On-site</option>
            <option>Remote</option>
            <option>Hybrid</option>
          </select>
        </div>
        <div>
          <label htmlFor="country" className="block text-sm font-medium mb-1">
            Country {formData.locationType !== "Remote" && (<span className="text-red-500">*</span>)}
          </label>
          {isClient ? (
            <Select<OptionType>
              id="country"
              name="country"
              options={countryOptions}
              value={formData.country}
              onChange={(option) => handleSelectChange("country", option)}
              classNamePrefix="select"
              placeholder="Select country..."
              isClearable
              required={formData.locationType !== "Remote"}
              isDisabled={formData.locationType === "Remote"}
              styles={{
                ...selectStyles,
                control: (base) => ({
                  ...base,
                  backgroundColor: "#FFFFFF",
                  borderColor: validationErrors.country ? "red" : "#DBD8E3",
                  color: "#2A2438",
                  "&:hover": {
                    borderColor: validationErrors.country ? "red" : "#DBD8E3",
                  },
                }),
              }}
            />
          ) : (
            <div className="w-full h-[42px] rounded-md animate-pulse" style={{ backgroundColor: "#F2F1F7", border: "1px solid #DBD8E3" }} />
          )}
          {validationErrors.country && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.country}</p>
          )}
        </div>
      </div>

      {/* State & City */}
      {formData.locationType !== "Remote" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="state" className="block text-sm font-medium mb-1">
              State/Province {formData.country && (<span className="text-red-500">*</span>)}
            </label>
            {isClient ? (
              <Select<OptionType>
                id="state"
                name="state"
                options={states}
                value={formData.state}
                onChange={(option) => handleSelectChange("state", option)}
                classNamePrefix="select"
                placeholder="Select state..."
                isClearable
                isDisabled={!formData.country || states.length === 0}
                required={!!formData.country}
                styles={{
                  ...selectStyles,
                  control: (base) => ({
                    ...base,
                    backgroundColor: "#FFFFFF",
                    borderColor: validationErrors.state ? "red" : "#DBD8E3",
                    color: "#2A2438",
                    "&:hover": {
                      borderColor: validationErrors.state ? "red" : "#DBD8E3",
                    },
                  }),
                }}
              />
            ) : (
              <div className="w-full h-[42px] rounded-md animate-pulse" style={{ backgroundColor: "#F2F1F7", border: "1px solid #DBD8E3" }} />
            )}
            {validationErrors.state && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.state}</p>
            )}
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-1">
              City {formData.state && (<span className="text-red-500">*</span>)}
            </label>
            {isClient ? (
              <Select<OptionType>
                id="city"
                name="city"
                options={cities}
                value={formData.city}
                onChange={(option) => handleSelectChange("city", option)}
                classNamePrefix="select"
                placeholder="Select city..."
                isClearable
                isDisabled={!formData.state || cities.length === 0}
                required={!!formData.state}
                styles={{
                  ...selectStyles,
                  control: (base) => ({
                    ...base,
                    backgroundColor: "#FFFFFF",
                    borderColor: validationErrors.city ? "red" : "#DBD8E3",
                    color: "#2A2438",
                    "&:hover": {
                      borderColor: validationErrors.city ? "red" : "#DBD8E3",
                    },
                  }),
                }}
              />
            ) : (
              <div className="w-full h-[42px] rounded-md animate-pulse" style={{ backgroundColor: "#F2F1F7", border: "1px solid #DBD8E3" }} />
            )}
            {validationErrors.city && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.city}</p>
            )}
          </div>
        </div>
      )}

      {/* Salary Range */}
      <div>
        <label className="block text-sm font-medium mb-1">Salary Range (Optional)</label>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="sm:col-span-1">
            <label htmlFor="salaryMin" className="block text-xs font-medium mb-1">Minimum</label>
            <input
              type="number"
              id="salaryMin"
              name="salaryMin"
              value={formData.salaryMin}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-[#352F44] focus:border-[#352F44] transition duration-150 ease-in-out"
              style={{ borderColor: "#DBD8E3", backgroundColor: "#FFFFFF", color: "#2A2438" }}
              placeholder="e.g., 50000"
              min="0"
            />
          </div>
          <div className="sm:col-span-1">
            <label htmlFor="salaryMax" className="block text-xs font-medium mb-1">Maximum</label>
            <input
              type="number"
              id="salaryMax"
              name="salaryMax"
              value={formData.salaryMax}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-[#352F44] focus:border-[#352F44] transition duration-150 ease-in-out"
              style={{ borderColor: "#DBD8E3", backgroundColor: "#FFFFFF", color: "#2A2438" }}
              placeholder="e.g., 80000"
              min={formData.salaryMin || "0"}
            />
          </div>
          <div className="sm:col-span-1">
            <label htmlFor="currency" className="block text-xs font-medium mb-1">Currency</label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-[#352F44] focus:border-[#352F44] transition duration-150 ease-in-out h-[42px]"
              style={{ borderColor: "#DBD8E3", backgroundColor: "#FFFFFF", color: "#2A2438" }}
            >
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>CAD</option>
              <option>AUD</option>
              <option>PKR</option>
              <option>INR</option>
            </select>
          </div>
          <div className="sm:col-span-1">
            <label htmlFor="period" className="block text-xs font-medium mb-1">Period</label>
            <select
              id="period"
              name="period"
              value={formData.period}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-[#352F44] focus:border-[#352F44] transition duration-150 ease-in-out h-[42px]"
              style={{ borderColor: "#DBD8E3", backgroundColor: "#FFFFFF", color: "#2A2438" }}
            >
              <option>Hourly</option>
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Annually</option>
            </select>
          </div>
        </div>
      </div>

      {/* Job Description */}
      <div>
        <label htmlFor="jobDescription" className="block text-sm font-medium mb-1">
          Job Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="jobDescription"
          name="jobDescription"
          rows={6}
          value={formData.jobDescription}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-1 focus:ring-[#352F44] focus:border-[#352F44] transition duration-150 ease-in-out"
          style={{ borderColor: validationErrors.jobDescription ? "red" : "#DBD8E3", backgroundColor: "#FFFFFF", color: "#2A2438" }}
          placeholder="Describe the role, responsibilities, required qualifications, benefits, etc."
        />
        {validationErrors.jobDescription && (
          <p className="text-red-500 text-xs mt-1">{validationErrors.jobDescription}</p>
        )}
      </div>

      

      {/* Required Skills */}
      <div>
        <RequiredSkillsField
          value={formData.required_skills}
          onChange={handleSkillsChange}
          validationError={validationErrors.required_skills}
          selectStyles={selectStyles}
        />
      </div>
    </div>
  );
};

export default GeneralInfoTab; 