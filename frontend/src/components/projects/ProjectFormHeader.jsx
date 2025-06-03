import React from 'react';
import { ArrowLeftIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const ProjectFormHeader = ({ title, subtitle }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <DocumentTextIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 mt-1">{subtitle}</p>
          </div>
        </div>
      </div>
      
      {/* Progress Steps */}
      <div className="flex items-center space-x-4 mt-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-medium">
            1
          </div>
          <span className="ml-2 text-sm font-medium text-primary-600">Basic Info</span>
        </div>
        <div className="flex-1 h-px bg-gray-200"></div>
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-sm font-medium">
            2
          </div>
          <span className="ml-2 text-sm text-gray-600">Team Members</span>
        </div>
        <div className="flex-1 h-px bg-gray-200"></div>
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-sm font-medium">
            3
          </div>
          <span className="ml-2 text-sm text-gray-600">Settings</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectFormHeader;
