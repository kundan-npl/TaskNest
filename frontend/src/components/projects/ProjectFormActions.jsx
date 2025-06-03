import React from 'react';
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const ProjectFormActions = ({ onCancel, onSubmit, submitting, isValid }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckCircleIcon className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">Ready to create your project?</p>
            <p className="text-sm text-gray-600">Review your settings and create the project</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={submitting || !isValid}
            className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                <span>Creating Project...</span>
              </>
            ) : (
              <>
                <span>Create Project</span>
                <ArrowRightIcon className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
      
      {!isValid && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Please fill in all required fields before creating the project.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectFormActions;
