import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  lastMessageTime: null, // Track last message for auto-refresh
  messagePollingInterval: null, // For polling fallback
  onlineUsers: [], // Track online users
  userPresence: {}, // Track user presence status

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
  const res = await axiosInstance.get("/api/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      const messages = res.data;
      set({ 
        messages,
        lastMessageTime: messages.length > 0 ? messages[messages.length - 1].createdAt : null
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Auto-refresh messages function with smarter polling
  refreshMessages: async () => {
    const { selectedUser, lastMessageTime } = get();
    if (!selectedUser) return;

    try {
      // Use the new endpoint to only get messages since last known message
      const url = lastMessageTime 
        ? `/messages/${selectedUser._id}/new?since=${lastMessageTime}`
        : `/messages/${selectedUser._id}`;
        
      const res = await axiosInstance.get(url);
      const newMessages = res.data;
      
      if (newMessages.length > 0) {
        const currentMessages = get().messages;
        
        // Filter out any duplicates
        const uniqueNewMessages = newMessages.filter(newMsg => 
          !currentMessages.some(existingMsg => existingMsg._id === newMsg._id)
        );
        
        if (uniqueNewMessages.length > 0) {
          console.log(`Found ${uniqueNewMessages.length} new messages`);
          set({ 
            messages: [...currentMessages, ...uniqueNewMessages],
            lastMessageTime: uniqueNewMessages[uniqueNewMessages.length - 1].createdAt
          });
        }
      }
    } catch (error) {
      console.error("Failed to refresh messages:", error);
    }
  },

  // Start auto-refresh polling as fallback with faster interval
  startMessagePolling: () => {
    const { messagePollingInterval } = get();
    if (messagePollingInterval) return; // Already polling

    console.log("Starting message polling fallback");
    const interval = setInterval(() => {
      get().refreshMessages();
    }, 2000); // Poll every 2 seconds for faster updates

    set({ messagePollingInterval: interval });
  },

  // Stop auto-refresh polling
  stopMessagePolling: () => {
    const { messagePollingInterval } = get();
    if (messagePollingInterval) {
      clearInterval(messagePollingInterval);
      set({ messagePollingInterval: null });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    
    // Create temp message
    const tempMessage = {
      _id: Date.now().toString(), // Temporary ID
      senderId: useAuthStore.getState().authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date(),
      isOptimistic: true // Flag to identify optimistic messages
    };
    
    try {
      // Optimistic update - add message immediately to UI
      set({ messages: [...messages, tempMessage] });

      // Send message to server
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      
      // Replace optimistic message with real message
      const currentMessages = get().messages;
      const updatedMessages = currentMessages.map(msg => 
        msg._id === tempMessage._id ? res.data : msg
      );
      
      // If the server message wasn't found, add it
      if (!updatedMessages.some(msg => msg._id === res.data._id)) {
        updatedMessages.push(res.data);
      }
      
      set({ messages: updatedMessages });
    } catch (error) {
      // Remove optimistic message on error
      const currentMessages = get().messages;
      set({ 
        messages: currentMessages.filter(msg => msg._id !== tempMessage._id)
      });
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/delete/${messageId}`);
      
      // Remove message from local state immediately
      const { messages } = get();
      set({ messages: messages.filter(msg => msg._id !== messageId) });
      
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  clearAllMessages: async () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    
    try {
      const res = await axiosInstance.delete(`/messages/clear/${selectedUser._id}`);
      
      // Remove all sent messages from local state
      const { messages } = get();
      const authUserId = useAuthStore.getState().authUser._id;
      const remainingMessages = messages.filter(msg => msg.senderId !== authUserId);
      set({ messages: remainingMessages });
      
      toast.success(`${res.data.deletedCount} messages cleared`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to clear messages");
    }
  },

  // Update online users list
  setOnlineUsers: (users) => {
    set({ onlineUsers: users });
  },

  // Update user presence
  updateUserPresence: (userId, status) => {
    const { userPresence } = get();
    set({
      userPresence: {
        ...userPresence,
        [userId]: {
          status,
          lastSeen: new Date(),
          timestamp: Date.now()
        }
      }
    });
  },

  // Check if user is online
  isUserOnline: (userId) => {
    const { onlineUsers } = get();
    return onlineUsers.includes(userId);
  },

  // Get user status (online, offline, away, etc.)
  getUserStatus: (userId) => {
    const { userPresence, onlineUsers } = get();
    
    if (onlineUsers.includes(userId)) {
      return userPresence[userId]?.status || 'online';
    }
    
    const presence = userPresence[userId];
    if (presence && presence.lastSeen) {
      const timeDiff = Date.now() - new Date(presence.lastSeen).getTime();
      if (timeDiff < 5 * 60 * 1000) { // 5 minutes
        return 'recently online';
      }
    }
    
    return 'offline';
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    
    if (!socket) {
      console.warn("Socket not available, starting polling fallback");
      get().startMessagePolling();
      return;
    }

    // Enhanced socket message handling
    socket.on("newMessage", (newMessage) => {
      console.log("Received new message:", newMessage);

      const currentMessages = get().messages;
      const currentSelectedUser = get().selectedUser;
      const authUserId = useAuthStore.getState().authUser._id;

      // Check if message is for current chat
      const isForCurrentChat =
        (newMessage.senderId === currentSelectedUser._id && newMessage.receiverId === authUserId) ||
        (newMessage.receiverId === currentSelectedUser._id && newMessage.senderId === authUserId);

      // Show notification if the message is sent to the current user and not already in the chat
      if (newMessage.receiverId === authUserId && newMessage.senderId !== authUserId) {
        toast.success(`New message from ${newMessage.senderName || 'Sender'}: ${newMessage.text}`);

        // Browser popup notification
        if ("Notification" in window) {
          if (Notification.permission === "granted") {
            new Notification(`New message from ${newMessage.senderName || 'Sender'}`, {
              body: newMessage.text,
              icon: "/public/avatar.png" // You can change this path to your app's icon
            });
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
              if (permission === "granted") {
                new Notification(`New message from ${newMessage.senderName || 'Sender'}`, {
                  body: newMessage.text,
                  icon: "/public/avatar.png"
                });
              }
            });
          }
        }
      }

      if (!isForCurrentChat) {
        console.log("Message not for current chat, ignoring");
        return;
      }

      // Check if message already exists (avoid duplicates)
      const messageExists = currentMessages.some(msg =>
        msg._id === newMessage._id ||
        (msg.text === newMessage.text &&
         msg.senderId === newMessage.senderId &&
         Math.abs(new Date(msg.createdAt) - new Date(newMessage.createdAt)) < 2000)
      );

      if (!messageExists) {
        console.log("Adding new message to chat");
        set({
          messages: [...currentMessages, newMessage],
          lastMessageTime: newMessage.createdAt
        });
      } else {
        console.log("Message already exists, skipping");
      }
    });

    // Handle message deletion
    socket.on("messageDeleted", (data) => {
      console.log("Message deleted:", data);
      const { messages } = get();
      set({ messages: messages.filter(msg => msg._id !== data.messageId) });
    });

    // Handle clear all messages
    socket.on("messagesCleared", (data) => {
      console.log("Messages cleared:", data);
      const { messages } = get();
      const remainingMessages = messages.filter(msg => msg.senderId !== data.senderId);
      set({ messages: remainingMessages });
    });

    // Handle online users
    socket.on("getOnlineUsers", (users) => {
      console.log("Online users updated:", users);
      set({ onlineUsers: users });
    });

    // Handle user coming online
    socket.on("userOnline", (userId) => {
      console.log("User came online:", userId);
      const { onlineUsers } = get();
      if (!onlineUsers.includes(userId)) {
        set({ onlineUsers: [...onlineUsers, userId] });
      }
      get().updateUserPresence(userId, 'online');
    });

    // Handle user going offline
    socket.on("userOffline", (data) => {
      console.log("User went offline:", data);
      const { onlineUsers } = get();
      set({ onlineUsers: onlineUsers.filter(id => id !== data.userId) });
      get().updateUserPresence(data.userId, 'offline');
    });

    // Handle user presence updates
    socket.on("userPresenceUpdate", (data) => {
      console.log("User presence update:", data);
      get().updateUserPresence(data.userId, data.status);
    });

    // Handle connection issues
    socket.on("disconnect", () => {
      console.log("Socket disconnected, starting polling fallback");
      get().startMessagePolling();
    });

    socket.on("connect", () => {
      console.log("Socket reconnected, stopping polling");
      get().stopMessagePolling();
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("messageDeleted");
      socket.off("messagesCleared");
      socket.off("getOnlineUsers");
      socket.off("userOnline");
      socket.off("userOffline");
      socket.off("userPresenceUpdate");
      socket.off("disconnect");
      socket.off("connect");
    }
    // Stop polling when unsubscribing
    get().stopMessagePolling();
  },

  setSelectedUser: (selectedUser) => {
    // Stop polling for previous chat
    get().stopMessagePolling();
    set({ selectedUser, messages: [] }); // Clear messages when switching users
  },
}));