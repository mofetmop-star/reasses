
import React from 'react';

interface StepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  maxReachedStep: number;
}

const steps = [
  { id: 1, label: 'הזנת נתונים' },
  { id: 2, label: 'ניתוח מיומנויות' },
  { id: 3, label: 'אסטרטגיות' },
  { id: 4, label: 'תוצר סופי' }
];

const Stepper: React.FC<StepperProps> = ({ currentStep, onStepClick, maxReachedStep }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-10 px-4">
      <div className="relative flex items-center justify-between w-full">
        {/* Connection Lines */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 transform -translate-y-1/2 rounded-full"></div>
        <div 
          className="absolute top-1/2 right-0 h-1 bg-indigo-500 -z-10 transform -translate-y-1/2 rounded-full transition-all duration-500" 
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isClickable = step.id <= maxReachedStep;

          return (
            <button
              key={step.id}
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={`flex flex-col items-center group focus:outline-none`}
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 font-bold text-sm transition-all duration-300 z-10
                ${isCurrent ? 'bg-indigo-600 border-indigo-200 text-white scale-110 shadow-lg' : 
                  isCompleted ? 'bg-indigo-500 border-indigo-500 text-white' : 
                  'bg-white border-gray-300 text-gray-400'
                }
                ${isClickable ? 'cursor-pointer hover:border-indigo-400' : 'cursor-default'}
                `}
              >
                {isCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <span className={`absolute mt-12 text-xs font-bold whitespace-nowrap transition-colors duration-300 ${isCurrent ? 'text-indigo-900' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
