import React, { useState, ChangeEvent } from "react";

export interface CompanyInfoData {
  companyName: string;
  numEmployees: string;
  industryType: string;
}

interface CompanyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CompanyInfoData) => void;
}

interface CompanyInfoErrors {
  companyName?: string;
  numEmployees?: string;
  industryType?: string;
}

const industryOptions = [
  { value: "it", label: "IT / Software Development" },
  { value: "marketing", label: "Marketing & Sales" },
  { value: "design", label: "Design & Creative" },
  { value: "finance", label: "Finance & Accounting" },
  { value: "hr", label: "Human Resources" },
  { value: "customer_service", label: "Customer Service" },
  { value: "engineering", label: "Engineering" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "admin", label: "Administrative" },
  { value: "architecture", label: "Architecture / Interior Design" },
  { value: "construction", label: "Construction / Civil Engineering" },
  { value: "legal", label: "Legal" },
  { value: "logistics", label: "Logistics / Supply Chain" },
  { value: "manufacturing", label: "Manufacturing / Production" },
  { value: "media", label: "Media / Communications" },
  { value: "ngo", label: "NGO / Non-profit" },
  { value: "retail", label: "Retail / Wholesale" },
  { value: "tourism", label: "Tourism / Hospitality" },
  { value: "other", label: "Other" },
];

const CompanyInfoModal: React.FC<CompanyInfoModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [data, setData] = useState<CompanyInfoData>({
    companyName: "",
    numEmployees: "",
    industryType: "",
  });

  const [errors, setErrors] = useState<CompanyInfoErrors>({});

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: CompanyInfoErrors = {};

    if (!data.companyName.trim())
      newErrors.companyName = "Company name cannot be empty";

    if (
      !data.numEmployees.trim() ||
      isNaN(Number(data.numEmployees)) ||
      Number(data.numEmployees) < 1
    ) {
      newErrors.numEmployees = "Please enter a valid number of employees";
    }

    if (!data.industryType)
      newErrors.industryType = "Please select an industry";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave(data);
    setData({ companyName: "", numEmployees: "", industryType: "" });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Company Information</h2>

        <div className="space-y-4">
          {/* Company Name */}
          <div>
            <label
              htmlFor="companyName"
              className="block text-sm font-medium text-gray-700"
            >
              Company Name
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              value={data.companyName}
              onChange={handleChange}
              className={`mt-1 w-full border rounded-md p-2 focus:outline-none ${
                errors.companyName
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-indigo-500"
              }`}
              placeholder="Enter company name"
            />
            {errors.companyName && (
              <p className="text-red-600 text-sm mt-1">{errors.companyName}</p>
            )}
          </div>

          {/* Number of Employees */}
          <div>
            <label
              htmlFor="numEmployees"
              className="block text-sm font-medium text-gray-700"
            >
              No. of Employees
            </label>
            <input
              id="numEmployees"
              name="numEmployees"
              type="number"
              min="1"
              value={data.numEmployees}
              onChange={handleChange}
              className={`mt-1 w-full border rounded-md p-2 focus:outline-none ${
                errors.numEmployees
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-indigo-500"
              }`}
              placeholder="e.g., 50"
            />
            {errors.numEmployees && (
              <p className="text-red-600 text-sm mt-1">{errors.numEmployees}</p>
            )}
          </div>

          {/* Industry Type */}
          <div>
            <label
              htmlFor="industryType"
              className="block text-sm font-medium text-gray-700"
            >
              Industry Type
            </label>
            <select
              id="industryType"
              name="industryType"
              value={data.industryType}
              onChange={handleChange}
              className={`mt-1 w-full border rounded-md p-2 focus:outline-none ${
                errors.industryType
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-indigo-500"
              }`}
            >
              <option value="">Select industry...</option>
              {industryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.industryType && (
              <p className="text-red-600 text-sm mt-1">{errors.industryType}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={handleSubmit}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoModal;
