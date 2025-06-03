import React from 'react';
import { InformationCircleIcon, CalendarIcon, FlagIcon } from '@heroicons/react/24/outline';

const ProjectBasicInfo = ({ formData, handleChange, errors = {} }) => {
  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-green-600', bg: 'bg-green-100' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { value: 'high', label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100' }
  ];

  const statusOptions = [
    { value: 'planning', label: 'Planning', color: 'text-blue-600', bg: 'bg-blue-100' },
    { value: 'active', label: 'Active', color: 'text-green-600', bg: 'bg-green-100' },
    { value: 'on-hold', label: 'On Hold', color: 'text-yellow-600', bg: 'bg-yellow-100' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <InformationCircleIcon className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          <p className="text-sm text-gray-600">Set up the fundamental details for your project</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Project Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Project Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
              errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Enter a descriptive project title"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Project Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Project Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none ${
              errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Describe the project goals, scope, and key objectives..."
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          <p className="mt-2 text-sm text-gray-500">
            {formData.description.length}/500 characters
          </p>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="h-4 w-4 inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="h-4 w-4 inline mr-1" />
              Deadline <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              min={formData.startDate}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.deadline ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>}
          </div>
        </div>

        {/* Priority and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="priorityLevel" className="block text-sm font-medium text-gray-700 mb-2">
              <FlagIcon className="h-4 w-4 inline mr-1" />
              Priority Level <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="priorityLevel"
                name="priorityLevel"
                value={formData.priorityLevel}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Initial Status
            </label>
            <div className="relative">
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectBasicInfo;
