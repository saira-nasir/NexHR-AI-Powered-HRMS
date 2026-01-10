import React, { useState } from 'react';
import { Check } from 'lucide-react';

export interface CustomFormQuestion {
  id: string;
  label: string;
  type: 'text' | 'email' | 'telephone' | 'file' | 'textarea' | 'dropdown' | 'radio' | 'date' | 'education' | 'experience';
  enabled: boolean;
}

interface EducationBlock {
  education_level?: string;
  institution_name?: string;
  degree_detail?: string;
  cgpa?: string;
  start_date?: string;
  description?: string;
}

interface ExperienceBlock {
  experience_level?: string;
  years_of_experience?: string;
  previous_job_titles?: string;
  company_name?: string;
}

export interface CustomFormAnswers {
  [key: string]: string | EducationBlock[] | ExperienceBlock[];
}

interface CustomFormBuilderProps {
  customFormQuestions: CustomFormQuestion[];
  customFormAnswers: CustomFormAnswers;
  showCustomForm: boolean;
  onToggleQuestion: (questionId: string) => void;
  onShowCustomForm: (show: boolean) => void;
  onCustomFormInput?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const CustomFormBuilder: React.FC<CustomFormBuilderProps> = ({
  customFormQuestions,
  customFormAnswers,
  showCustomForm,
  onToggleQuestion,
  onShowCustomForm,
  onCustomFormInput,
}) => {
  const getTypeDescription = (type: CustomFormQuestion['type']) => {
    switch (type) {
      case 'text': return 'Short single-line text input';
      case 'email': return 'Email address field';
      case 'telephone': return 'Phone number field';
      case 'file': return 'Upload files (resume, cover letter)';
      case 'textarea': return 'Long answer / description';
      case 'dropdown': return 'Select one option from a list';
      case 'radio': return 'Choose one option';
      case 'date': return 'Date picker';
      case 'education': return 'Education block (multiple fields)';
      case 'experience': return 'Experience block (multiple fields)';
      default: return '';
    }
  };

  const friendlyType = (type: CustomFormQuestion['type']) => {
    switch (type) {
      case 'text': return 'Text';
      case 'email': return 'Email';
      case 'telephone': return 'Phone';
      case 'file': return 'File';
      case 'textarea': return 'Textarea';
      case 'dropdown': return 'Dropdown';
      case 'radio': return 'Radio';
      case 'date': return 'Date';
      case 'education': return 'Education';
      case 'experience': return 'Experience';
      default: return '';
    }
  };

  // Note: preview shows only the field labels. For file fields (resume) we display a simple "Resume" text badge.

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Custom Application Form</h3>
      <p className="text-sm text-gray-500">
        Toggle the questions you want to include in your application form
      </p>
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                // select all (enable all)
                customFormQuestions.forEach((q) => {
                  if (!q.enabled && q.id !== 'applied_at') onToggleQuestion(q.id);
                });
                onShowCustomForm(false);
              }}
              className="px-3 py-1 rounded-md bg-[#EEF2FF] text-sm text-[#4338CA]"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => {
                // clear all (disable all)
                customFormQuestions.forEach((q) => {
                  if (q.enabled && q.id !== 'applied_at') onToggleQuestion(q.id);
                });
                onShowCustomForm(false);
              }}
              className="px-3 py-1 rounded-md bg-[#FFF1F2] text-sm text-[#B91C1C]"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {customFormQuestions
            .filter(question => question.id !== 'applied_at')
            .map((question) => (
              <button
                key={question.id}
                type="button"
                onClick={() => {
                  onToggleQuestion(question.id);
                  onShowCustomForm(false);
                }}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors text-left w-full ${question.enabled ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:shadow-sm'}`}
              >
                <div className={`mt-0.5 flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${question.enabled ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {question.enabled ? <Check className="w-4 h-4" /> : <div className="h-2 w-2 rounded-full" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{question.label}</h4>
                  <p className="text-xs text-gray-500 mt-1">{getTypeDescription(question.type)}</p>
                </div>
                <div className="text-xs text-[#5C5470] font-medium">{friendlyType(question.type)}</div>
              </button>
            ))}
        </div>
      </div>
      {/* Preview removed - only show selectable cards above */}
    </div>
  );
};

export default CustomFormBuilder; 