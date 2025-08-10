import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Trash2, MoreVertical } from "lucide-react";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    refreshMessages,
    startMessagePolling,
    stopMessagePolling,
    deleteMessage,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const chatContainerRef = useRef(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);

  // Load messages and setup real-time subscriptions
  useEffect(() => {
    if (!selectedUser?._id) return;

    console.log("Setting up chat for user:", selectedUser._id);
    
    // Load initial messages
    getMessages(selectedUser._id);

    // Setup real-time message subscription
    subscribeToMessages();

    // Start auto-refresh as fallback
    startMessagePolling();

    return () => {
      unsubscribeFromMessages();
      stopMessagePolling();
    };
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages, startMessagePolling, stopMessagePolling]);

  // Enhanced auto-scroll with user scroll detection
  useEffect(() => {
    if (messageEndRef.current && messages && isAutoScrollEnabled) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAutoScrollEnabled]);

  // Auto-refresh when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      console.log("Window focused, refreshing messages");
      refreshMessages();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Tab became visible, refreshing messages");
        refreshMessages();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshMessages]);

  // Detect manual scrolling to disable auto-scroll
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsAutoScrollEnabled(isNearBottom);
    };

    chatContainer.addEventListener('scroll', handleScroll);
    return () => chatContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Ensure socket connection for real-time updates
  useEffect(() => {
    if (!socket?.connected) {
      console.log("Socket not connected, attempting to connect...");
      // Could trigger reconnection here if needed
    }
  }, [socket]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.map((message, index) => (
          <div
            key={message._id || `temp-${index}`}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"} ${
              message.isOptimistic ? 'opacity-70' : ''
            } group relative`}
            onMouseEnter={() => setHoveredMessage(message._id)}
            onMouseLeave={() => setHoveredMessage(null)}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col relative">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
              
              {/* Message Options - Only show for own messages */}
              {message.senderId === authUser._id && hoveredMessage === message._id && (
                <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-xs">
                      <MoreVertical className="w-3 h-3" />
                    </div>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-32 border border-base-300">
                      <li>
                        <button
                          onClick={() => deleteMessage(message._id)}
                          className="text-error hover:bg-error/10 gap-2"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Auto-scroll target */}
        <div ref={messageEndRef} />
        
        {/* Show scroll to bottom button when not auto-scrolling */}
        {!isAutoScrollEnabled && (
          <button
            onClick={() => {
              setIsAutoScrollEnabled(true);
              messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            className="fixed bottom-24 right-8 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          >
            ↓
          </button>
        )}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
