import React, { useState } from 'react';
import { toast } from 'react-toastify';
import invitationService from '../../services/invitationService.js';
import { 
  PaperAirplaneIcon, 
  XMarkIcon, 
  EnvelopeIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

const SendInvitationModal = ({ isOpen, onClose, projectId, onInvitationSent }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'team-member'
  });
  const [sending, setSending] = useState(false);
  const [sentInvitation, setSentInvitation] = useState(null);

  const roleOptions = invitationService.getRoleOptions();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!invitationService.isValidEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSending(true);
    
    try {
      const response = await invitationService.sendInvitation({
        projectId,
        email: formData.email.toLowerCase(),
        role: formData.role
      });

      if (response.success) {
        setSentInvitation(response.data);
        toast.success(response.message);
        onInvitationSent?.(response.data);
        
        // Reset form
        setFormData({ email: '', role: 'team-member' });
      } else {
        throw new Error(response.error || 'Failed to send invitation');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const copyInvitationLink = () => {
    if (sentInvitation?.inviteLink) {
      navigator.clipboard.writeText(sentInvitation.inviteLink);
      toast.success('Invitation link copied to clipboard');
    }
  };

  const handleClose = () => {
    setSentInvitation(null);
    setFormData({ email: '', role: 'team-member' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {sentInvitation ? 'Invitation Sent!' : 'Invite Team Member'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {sentInvitation ? (
            /* Success State */
            <div className="text-center">
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Invitation sent successfully!
              </h4>
              
              <p className="text-gray-600 mb-4">
                An invitation has been sent to <strong>{sentInvitation.email}</strong> to join as a{' '}
                <span className="font-medium">{invitationService.getRoleDisplayName(sentInvitation.role)}</span>.
              </p>

              {/* Invitation Link */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <LinkIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Invitation Link</span>
                  </div>
                  <button
                    onClick={copyInvitationLink}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Copy Link
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 break-all">
                  {sentInvitation.inviteLink}
                </p>
              </div>

              {/* Email Status */}
              <div className={`flex items-center justify-center p-3 rounded-lg mb-4 ${
                sentInvitation.emailSent 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-yellow-50 text-yellow-700'
              }`}>
                {sentInvitation.emailSent ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Email sent successfully
                  </>
                ) : (
                  <>
                    <ExclamationCircleIcon className="h-4 w-4 mr-2" />
                    Email delivery failed - please share the link manually
                  </>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setSentInvitation(null)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Send Another
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Invitation Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="teammate@example.com"
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  name="role"
                  id="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {roleOptions.find(opt => opt.value === formData.role)?.description}
                </p>
              </div>

              {/* Information Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <EnvelopeIcon className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">How it works:</p>
                    <ul className="text-xs space-y-1 text-blue-700">
                      <li>• An invitation email will be sent to the user</li>
                      <li>• They'll receive a secure link to join the project</li>
                      <li>• If they don't have an account, they'll be prompted to create one</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendInvitationModal;
