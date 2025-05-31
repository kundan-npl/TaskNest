import React, { useState } from 'react';
import { toast } from 'react-toastify';

const ConnectionManager = ({ 
  isConnected, 
  connectionError, 
  reconnectionAttempts, 
  onManualReconnect,
  onForceDisconnect,
  lastConnectedTime = null
}) => {
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleManualReconnect = async () => {
    if (isReconnecting) return;
    
    setIsReconnecting(true);
    try {
      await onManualReconnect();
      toast.success('Reconnection initiated', { position: 'bottom-right' });
    } catch (error) {
      toast.error('Failed to initiate reconnection', { position: 'bottom-right' });
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleForceDisconnect = () => {
    if (onForceDisconnect) {
      onForceDisconnect();
      toast.info('Disconnected from real-time updates', { position: 'bottom-right' });
    }
  };

  const getConnectionStatusText = () => {
    if (isReconnecting) return 'Reconnecting...';
    if (isConnected) return 'Connected';
    if (connectionError) return 'Connection Error';
    return 'Disconnected';
  };

  const getConnectionStatusColor = () => {
    if (isReconnecting) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    if (isConnected) return 'text-green-600 bg-green-100 border-green-200';
    if (connectionError) return 'text-red-600 bg-red-100 border-red-200';
    return 'text-gray-600 bg-gray-100 border-gray-200';
  };

  const formatLastConnectedTime = () => {
    if (!lastConnectedTime) return 'Never';
    
    const now = new Date();
    const lastConnected = new Date(lastConnectedTime);
    const diffMs = now - lastConnected;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return lastConnected.toLocaleDateString();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-900">Connection Status</h4>
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getConnectionStatusColor()}`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            isReconnecting ? 'bg-yellow-500 animate-pulse' :
            isConnected ? 'bg-green-500' : 
            connectionError ? 'bg-red-500' : 'bg-gray-500'
          }`}></div>
          {getConnectionStatusText()}
        </div>
      </div>

      {/* Connection Details */}
      <div className="space-y-2 text-xs text-gray-600 mb-4">
        <div className="flex justify-between">
          <span>Last connected:</span>
          <span className="font-medium">{formatLastConnectedTime()}</span>
        </div>
        {reconnectionAttempts > 0 && (
          <div className="flex justify-between">
            <span>Reconnection attempts:</span>
            <span className="font-medium text-orange-600">{reconnectionAttempts}</span>
          </div>
        )}
        {connectionError && (
          <div className="flex justify-between">
            <span>Error:</span>
            <span className="font-medium text-red-600 truncate max-w-32" title={connectionError}>
              {connectionError}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {!isConnected && (
          <button
            onClick={handleManualReconnect}
            disabled={isReconnecting}
            className="flex-1 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isReconnecting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-700 mr-2"></div>
                Connecting...
              </div>
            ) : (
              'Reconnect'
            )}
          </button>
        )}
        
        {isConnected && (
          <button
            onClick={handleForceDisconnect}
            className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>

      {/* Health Indicator */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Real-time features</span>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-300'}`}></div>
            <span>{isConnected ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionManager;
