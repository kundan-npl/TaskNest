import React, { useState } from 'react';
import { toast } from 'react-toastify';

const RoleBasedTestSuite = ({ currentUser, project, onRoleChange }) => {
  const [selectedRole, setSelectedRole] = useState('teamMember');
  const [testResults, setTestResults] = useState([]);

  // Role-based permissions configuration (matching ProjectDetails.jsx)
  const ROLE_PERMISSIONS = {
    supervisor: {
      canEditProject: true,
      canDeleteProject: true,
      canManageTeam: true,
      canAssignTasks: true,
      canEditTasks: true,
      canDeleteTasks: true,
      canViewAnalytics: true,
      canExportReports: true,
      canManageFiles: true,
      canViewAllTasks: true,
      canCreateTasks: true,
      canManageRoles: true,
      canInviteMembers: true,
      canRemoveMembers: true,
      canViewFinancials: true,
      canModerateDiscussions: true,
      canPinMessages: true,
      canCreateAnnouncements: true
    },
    teamLead: {
      canEditProject: false,
      canDeleteProject: false,
      canManageTeam: true,
      canAssignTasks: true,
      canEditTasks: true,
      canDeleteTasks: false,
      canViewAnalytics: true,
      canExportReports: true,
      canManageFiles: true,
      canViewAllTasks: true,
      canCreateTasks: true,
      canManageRoles: false,
      canInviteMembers: true,
      canRemoveMembers: false,
      canViewFinancials: false,
      canModerateDiscussions: true,
      canPinMessages: false,
      canCreateAnnouncements: false
    },
    teamMember: {
      canEditProject: false,
      canDeleteProject: false,
      canManageTeam: false,
      canAssignTasks: false,
      canEditTasks: true, // Only own tasks
      canDeleteTasks: false,
      canViewAnalytics: false,
      canExportReports: false,
      canManageFiles: false,
      canViewAllTasks: true,
      canCreateTasks: false,
      canManageRoles: false,
      canInviteMembers: false,
      canRemoveMembers: false,
      canViewFinancials: false,
      canModerateDiscussions: false,
      canPinMessages: false,
      canCreateAnnouncements: false
    }
  };

  const testCases = [
    // Tab Access Tests
    { id: 'tab-overview', name: 'Access Overview Tab', roles: ['supervisor', 'teamLead', 'teamMember'], type: 'tab' },
    { id: 'tab-tasks', name: 'Access Tasks Tab', roles: ['supervisor', 'teamLead', 'teamMember'], type: 'tab' },
    { id: 'tab-team', name: 'Access Team Tab', roles: ['supervisor', 'teamLead'], type: 'tab' },
    { id: 'tab-communication', name: 'Access Communication Tab', roles: ['supervisor', 'teamLead', 'teamMember'], type: 'tab' },
    { id: 'tab-analytics', name: 'Access Analytics Tab', roles: ['supervisor', 'teamLead'], type: 'tab' },
    
    // Project Management Tests
    { id: 'edit-project', name: 'Edit Project Details', roles: ['supervisor'], type: 'action' },
    { id: 'delete-project', name: 'Delete Project', roles: ['supervisor'], type: 'action' },
    
    // Team Management Tests
    { id: 'invite-members', name: 'Invite Team Members', roles: ['supervisor', 'teamLead'], type: 'action' },
    { id: 'remove-members', name: 'Remove Team Members', roles: ['supervisor'], type: 'action' },
    { id: 'manage-roles', name: 'Manage Member Roles', roles: ['supervisor'], type: 'action' },
    
    // Task Management Tests
    { id: 'create-tasks', name: 'Create New Tasks', roles: ['supervisor', 'teamLead'], type: 'action' },
    { id: 'assign-tasks', name: 'Assign Tasks to Members', roles: ['supervisor', 'teamLead'], type: 'action' },
    { id: 'delete-tasks', name: 'Delete Tasks', roles: ['supervisor'], type: 'action' },
    
    // Discussion Management Tests
    { id: 'moderate-discussions', name: 'Moderate Discussions', roles: ['supervisor', 'teamLead'], type: 'action' },
    { id: 'pin-messages', name: 'Pin Messages', roles: ['supervisor'], type: 'action' },
    { id: 'create-announcements', name: 'Create Announcements', roles: ['supervisor'], type: 'action' },
    
    // Analytics & Reports Tests
    { id: 'view-analytics', name: 'View Analytics Dashboard', roles: ['supervisor', 'teamLead'], type: 'action' },
    { id: 'export-reports', name: 'Export Reports', roles: ['supervisor', 'teamLead'], type: 'action' },
    
    // File Management Tests
    { id: 'manage-files', name: 'Upload/Delete Files', roles: ['supervisor', 'teamLead'], type: 'action' }
  ];

  const runTest = (testCase) => {
    const hasPermission = ROLE_PERMISSIONS[selectedRole]?.[testCase.id.replace(/-/g, '').replace('tab', 'canAccess')] || 
                         testCase.roles.includes(selectedRole);
    
    const result = {
      testId: testCase.id,
      testName: testCase.name,
      role: selectedRole,
      expected: testCase.roles.includes(selectedRole),
      actual: hasPermission,
      passed: testCase.roles.includes(selectedRole) === hasPermission,
      timestamp: new Date().toISOString()
    };

    setTestResults(prev => [result, ...prev.filter(r => r.testId !== testCase.id || r.role !== selectedRole)]);
    
    if (result.passed) {
      toast.success(`✅ ${testCase.name} - Test Passed for ${selectedRole}`);
    } else {
      toast.error(`❌ ${testCase.name} - Test Failed for ${selectedRole}`);
    }

    return result;
  };

  const runAllTests = () => {
    setTestResults([]);
    const results = testCases.map(testCase => runTest(testCase));
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    toast.info(`Test Suite Complete: ${passedTests}/${totalTests} tests passed for ${selectedRole} role`);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getTestStatusIcon = (result) => {
    if (result.passed) {
      return <span className="text-green-600 font-bold">✅</span>;
    } else {
      return <span className="text-red-600 font-bold">❌</span>;
    }
  };

  const simulateRoleChange = (role) => {
    setSelectedRole(role);
    if (onRoleChange) {
      onRoleChange(role);
    }
    toast.info(`Switched to ${role} role for testing`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Role-Based Access Control Test Suite</h2>
        <p className="text-sm text-gray-600">
          Comprehensive testing for TaskNest project role-based permissions system
        </p>
      </div>

      {/* Role Selection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Configuration</h3>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Test as Role:</label>
          <select
            value={selectedRole}
            onChange={(e) => simulateRoleChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="teamMember">Team Member</option>
            <option value="teamLead">Team Lead</option>
            <option value="supervisor">Supervisor</option>
          </select>
          <div className="flex space-x-2">
            <button
              onClick={runAllTests}
              className="btn-primary text-sm"
            >
              Run All Tests
            </button>
            <button
              onClick={clearResults}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Results
            </button>
          </div>
        </div>
      </div>

      {/* Individual Test Cases */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Individual Test Cases</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {testCases.map((testCase) => (
            <div key={testCase.id} className="p-3 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-medium text-gray-900">{testCase.name}</h4>
                <button
                  onClick={() => runTest(testCase)}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                >
                  Test
                </button>
              </div>
              <div className="text-xs text-gray-600">
                <div>Type: {testCase.type}</div>
                <div>Allowed Roles: {testCase.roles.join(', ')}</div>
                <div className={`font-medium ${testCase.roles.includes(selectedRole) ? 'text-green-600' : 'text-red-600'}`}>
                  Expected for {selectedRole}: {testCase.roles.includes(selectedRole) ? 'ALLOW' : 'DENY'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Results</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
              <div
                key={`${result.testId}-${result.role}-${index}`}
                className={`p-3 rounded-lg border ${
                  result.passed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTestStatusIcon(result)}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {result.testName}
                      </div>
                      <div className="text-xs text-gray-600">
                        Role: {result.role} | Expected: {result.expected ? 'ALLOW' : 'DENY'} | 
                        Actual: {result.actual ? 'ALLOW' : 'DENY'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Test Summary */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-900">
              Test Summary for {selectedRole} role:
            </div>
            <div className="text-sm text-blue-800">
              Passed: {testResults.filter(r => r.passed && r.role === selectedRole).length} | 
              Failed: {testResults.filter(r => !r.passed && r.role === selectedRole).length} |
              Total: {testResults.filter(r => r.role === selectedRole).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleBasedTestSuite;
