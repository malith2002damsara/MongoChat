import { X, Trash2, MoreVertical, AlertTriangle, Download, Info } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState } from "react";
import toast from 'react-hot-toast';
import { exportChatToPDF, getMessageStats } from '../lib/pdfUtils';

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, clearAllMessages, isUserOnline, getUserStatus, messages } = useChatStore();
  const { authUser } = useAuthStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExportInfo, setShowExportInfo] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const userStatus = getUserStatus(selectedUser._id);
  const isOnline = isUserOnline(selectedUser._id);
  const messageStats = messages.length > 0 ? getMessageStats(messages, authUser._id) : null;

  const handleClearMessages = async () => {
    await clearAllMessages();
    setShowClearConfirm(false);
  };

  const handleExportChat = async () => {
    if (!messages || messages.length === 0) {
      toast.error('No messages to export');
      return;
    }

    setIsExporting(true);
    try {
      const { pdf, fileName } = exportChatToPDF(messages, selectedUser, authUser);
      const stats = getMessageStats(messages, authUser._id);
      
      // Save the PDF
      pdf.save(fileName);
      
      toast.success(`Chat exported successfully! ${stats.total} messages exported.`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export chat. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusText = () => {
    switch (userStatus) {
      case 'online':
        return 'Online';
      case 'recently online':
        return 'Recently online';
      case 'offline':
        return 'Offline';
      default:
        return isOnline ? 'Online' : 'Offline';
    }
  };

  const getStatusColor = () => {
    switch (userStatus) {
      case 'online':
        return 'text-success';
      case 'recently online':
        return 'text-warning';
      case 'offline':
        return 'text-base-content/50';
      default:
        return isOnline ? 'text-success' : 'text-base-content/50';
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300 bg-base-200/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar with online indicator */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
              {/* Online indicator */}
              {isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-base-100"></div>
              )}
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className={`text-sm ${getStatusColor()}`}>
              {getStatusText()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile export button - visible on small screens */}
          <button
            onClick={handleExportChat}
            disabled={isExporting || messages.length === 0}
            className="btn btn-ghost btn-sm sm:hidden"
            title="Export Chat"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Chat options dropdown - enhanced for mobile */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
              <MoreVertical className="w-4 h-4" />
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 sm:w-48 border border-base-300">
              <li className="hidden sm:block">
                <button
                  onClick={() => setShowExportInfo(true)}
                  disabled={messages.length === 0}
                  className="hover:bg-primary/10 gap-2"
                >
                  <Info className="w-4 h-4" />
                  Export Info
                </button>
              </li>
              <li className="hidden sm:block">
                <button
                  onClick={handleExportChat}
                  disabled={isExporting || messages.length === 0}
                  className="hover:bg-primary/10 gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? 'Exporting...' : 'Export Chat'}
                </button>
              </li>
              {/* Mobile-optimized export options */}
              <li className="sm:hidden">
                <button
                  onClick={() => setShowExportInfo(true)}
                  disabled={messages.length === 0}
                  className="hover:bg-primary/10 gap-2 text-sm"
                >
                  <Info className="w-4 h-4" />
                  Chat Export Info
                </button>
              </li>
              <li>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-error hover:bg-error/10 gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear My Messages
                </button>
              </li>
            </ul>
          </div>

          {/* Close button */}
          <button 
            onClick={() => setSelectedUser(null)}
            className="btn btn-ghost btn-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clear messages confirmation modal */}
      {showClearConfirm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-warning" />
              <h3 className="font-bold text-lg">Clear Messages</h3>
            </div>
            <p className="py-4">
              Are you sure you want to clear all your messages in this chat? This action cannot be undone.
              Only your sent messages will be deleted.
            </p>
            <div className="modal-action">
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button 
                onClick={handleClearMessages}
                className="btn btn-error"
              >
                <Trash2 className="w-4 h-4" />
                Clear Messages
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowClearConfirm(false)}></div>
        </div>
      )}

      {/* Export info modal */}
      {showExportInfo && messageStats && (
        <div className="modal modal-open">
          <div className="modal-box">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-lg">Export Information</h3>
            </div>
            <div className="py-4 space-y-3">
              <div className="stats stats-vertical lg:stats-horizontal w-full shadow">
                <div className="stat">
                  <div className="stat-title">Total Messages</div>
                  <div className="stat-value text-primary">{messageStats.total}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Your Messages</div>
                  <div className="stat-value text-secondary">{messageStats.sent}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">With Images</div>
                  <div className="stat-value text-accent">{messageStats.withImages}</div>
                </div>
              </div>
              
              {messageStats.dateRange && (
                <div className="bg-base-200 p-3 rounded-lg">
                  <p className="text-sm text-base-content/70 mb-1">Date Range</p>
                  <p className="font-medium">
                    {messageStats.dateRange.start} - {messageStats.dateRange.end}
                  </p>
                </div>
              )}
              
              <div className="bg-info/10 p-3 rounded-lg">
                <p className="text-sm text-info-content">
                  💡 The PDF will include all messages with timestamps, sender names, and image indicators.
                  Your messages will be aligned to the right for easy identification.
                </p>
              </div>
            </div>
            <div className="modal-action">
              <button 
                onClick={() => setShowExportInfo(false)}
                className="btn btn-ghost"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowExportInfo(false);
                  handleExportChat();
                }}
                className="btn btn-primary"
                disabled={isExporting}
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export Now'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowExportInfo(false)}></div>
        </div>
      )}
    </div>
  );
};
export default ChatHeader;
