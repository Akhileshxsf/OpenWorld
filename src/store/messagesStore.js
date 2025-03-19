import { create } from "zustand";
import { firestore } from "../firebase/firebase";
import { collection, query, where, onSnapshot, orderBy, addDoc } from "firebase/firestore";

const useMessageStore = create((set) => ({
  messages: [],
  currentTab: "inbox", // Default tab
  loading: false,
  error: null,
  unsubscribe: null, // Store the unsubscribe function

  // Fetch messages from Firestore based on senderId, receiverId, and currentTab
  fetchMessages: async (senderId, receiverId) => {
    set({ loading: true });

    try {
      const messagesRef = collection(firestore, "messages");
      let q;

      if (set.getState().currentTab === "inbox") {
        q = query(
          messagesRef,
          where("receiverId", "==", receiverId),
          where("senderId", "==", senderId),
          orderBy("timestamp", "asc")
        );
      } else if (set.getState().currentTab === "sent") {
        q = query(
          messagesRef,
          where("senderId", "==", senderId),
          where("receiverId", "==", receiverId),
          orderBy("timestamp", "asc")
        );
      }

      // Subscribe to the snapshot of messages for real-time updates
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedMessages = [];
        querySnapshot.forEach((doc) => {
          fetchedMessages.push({ id: doc.id, ...doc.data() });
        });
        set({ messages: fetchedMessages, loading: false });
      });

      set({ unsubscribe }); // Store the unsubscribe function

      return unsubscribe; // Return the unsubscribe function

    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Send a message to Firestore
  sendMessage: async (message) => {
    try {
      await addDoc(collection(firestore, "messages"), message);
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Set the current tab (inbox or sent)
  setTab: (tab) => set({ currentTab: tab }),

  // Clear any errors
  clearError: () => set({ error: null }),

  // Optionally clear the unsubscribe function
  clearUnsubscribe: () => set({ unsubscribe: null }),
}));

export default useMessageStore;
