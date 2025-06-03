import React from 'react';
import { TagIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

const ProjectTags = ({ formData, tagInput, setTagInput, handleAddTag, handleRemoveTag }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(e);
    }
  };

  const popularTags = [
    'Frontend', 'Backend', 'API', 'Mobile', 'Web', 'Design', 'Research', 
    'Testing', 'DevOps', 'Marketing', 'Analytics', 'Security'
  ];

  const addPopularTag = (tag) => {
    if (!formData.tags.includes(tag)) {
      setTagInput(tag);
      handleAddTag({ preventDefault: () => {} });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <TagIcon className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Project Tags</h2>
          <p className="text-sm text-gray-600">Add tags to help categorize and find your project</p>
        </div>
      </div>

      {/* Tag Input */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a tag name..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {tagInput && (
              <button
                type="button"
                onClick={() => setTagInput('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddTag}
            disabled={!tagInput.trim()}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add</span>
          </button>
        </div>

        {/* Popular Tags */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Popular Tags:</p>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addPopularTag(tag)}
                disabled={formData.tags.includes(tag)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  formData.tags.includes(tag)
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Current Tags */}
        {formData.tags.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Current Tags ({formData.tags.length}):</p>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 border border-primary-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-primary-600 hover:bg-primary-200 hover:text-primary-800 transition-colors"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectTags;
