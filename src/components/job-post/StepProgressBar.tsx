import React, { useEffect, useState } from 'react';

interface StepProgressBarProps {
  currentStep: number;
  steps: string[];
  reviewCompleted?: boolean;
  prevStep?: number | null;
}

const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentStep,
  steps,
  reviewCompleted = false,
  prevStep = null,
}) => {
  const count = steps.length;
  const getLeft = (index: number) => {
    if (count <= 1) return '0%';
    return `${(index / (count - 1)) * 100}%`;
  };

  // Dot animation removed: keep progress rendering simple and static
  return (
    <nav aria-label="Progress" className="mb-8">
      <div className="relative">
        {/* moving dot animation removed to simplify progress UI */}

        <ol role="list" className="flex items-center justify-center space-x-2 sm:space-x-4">
          {/* We render the list inside the same relative container so left positions match */}
        {steps.map((step, index) => {
          const stepIndex = index + 1;
          let isCompleted = stepIndex < currentStep;
          let isCurrent = stepIndex === currentStep;
          if (stepIndex === 3 && reviewCompleted) {
            isCompleted = true;
            isCurrent = false;
          }
          return (
            <li key={step} className="flex items-center">
              {index > 0 && (
                <div
                  className={`h-0.5 w-8 sm:w-16 md:w-24 ${isCompleted || isCurrent ? "bg-[#352F44]" : "bg-[#DBD8E3]"
                    }`}
                />
              )}
              <div
                className={`relative flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full ${isCompleted
                  ? "bg-[#352F44]"
                  : isCurrent
                    ? "border-2 border-[#352F44] bg-white"
                    : "border-2 border-[#DBD8E3] bg-white"
                  }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted ? (
                  <svg
                    className="h-4 w-4 sm:h-5 sm:w-5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span
                    className={`text-xs sm:text-sm font-medium ${isCurrent ? "text-[#352F44]" : "text-[#5C5470]"
                      }`}
                  >
                    {stepIndex}
                  </span>
                )}
              </div>
              <span
                className={`ml-2 text-xs sm:text-sm font-medium ${isCurrent ? "text-[#352F44]" : "text-[#5C5470]"
                  }`}
              >
                {step}
              </span>
            </li>
          );
        })}
        </ol>
      </div>
    </nav>
  );
};

export default StepProgressBar; 