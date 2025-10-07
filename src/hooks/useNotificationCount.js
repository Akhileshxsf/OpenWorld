import { useState, useEffect, useCallback } from "react";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "../firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

// Custom hook for real-time notification count including connection requests
export const useNotificationCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [authUser, loading] = useAuthState(auth);

  // Load last checked timestamp from localStorage
  useEffect(() => {
    if (authUser) {
      const saved = localStorage.getItem(`notifications_last_visited_${authUser.uid}`);
      if (saved) {
        setLastChecked(new Date(saved));
      } else {
        const now = new Date();
        setLastChecked(now);
        localStorage.setItem(`notifications_last_visited_${authUser.uid}`, now.toISOString());
      }
    }
  }, [authUser]);

  // Update last checked timestamp
  const updateLastChecked = useCallback(() => {
    if (authUser) {
      const now = new Date();
      setLastChecked(now);
      localStorage.setItem(`notifications_last_visited_${authUser.uid}`, now.toISOString());
      setHasNewUpdates(false);
    }
  }, [authUser]);

  // Enhanced notification listener including connection requests
  useEffect(() => {
    if (!authUser || loading) {
      setUnreadCount(0);
      setHasNewUpdates(false);
      return;
    }

    let totalUnread = 0;
    let hasNew = false;

    // Listen for regular notifications
    const notificationsRef = collection(firestore, "notifications");
    const notificationsQuery = query(notificationsRef, where("type", "==", "notification"));

    const unsubscribeNotifications = onSnapshot(
      notificationsQuery,
      async (snapshot) => {
        let notificationUnread = 0;
        
        await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const notification = docSnap.data();
            const userStatusRef = doc(firestore, `notifications/${docSnap.id}/userStatus`, authUser.uid);
            
            try {
              const userStatusDoc = await getDoc(userStatusRef);
              const isRead = userStatusDoc.exists() && userStatusDoc.data().read;
              
              if (!isRead) {
                notificationUnread++;
                
                // Check if this notification is newer than last checked
                const notificationTime = notification.timestamp?.toDate?.() || new Date();
                if (lastChecked && notificationTime > lastChecked) {
                  hasNew = true;
                }
              }
            } catch (error) {
              console.warn(`Failed to fetch userStatus for notification ${docSnap.id}:`, error);
            }
          })
        );

        totalUnread += notificationUnread;
      },
      (error) => {
        console.error("Error fetching notifications:", error);
      }
    );

    // Listen for connection requests
    const offersRef = collection(firestore, "offers");
    const connectionRequestsQuery = query(
      offersRef,
      where("type", "==", "connection_request"),
      where("toUserId", "==", authUser.uid),
      where("status", "==", "pending")
    );

    const unsubscribeConnections = onSnapshot(
      connectionRequestsQuery,
      (snapshot) => {
        const connectionUnread = snapshot.size;
        totalUnread += connectionUnread;

        // Check if any connection requests are new
        if (connectionUnread > 0 && lastChecked) {
          const hasNewConnections = snapshot.docs.some(docSnap => {
            const connection = docSnap.data();
            const connectionTime = connection.timestamp?.toDate?.() || new Date();
            return connectionTime > lastChecked;
          });
          
          if (hasNewConnections) {
            hasNew = true;
          }
        }

        setUnreadCount(totalUnread);
        setHasNewUpdates(hasNew);
      },
      (error) => {
        console.error("Error fetching connection requests:", error);
      }
    );

    return () => {
      unsubscribeNotifications();
      unsubscribeConnections();
    };
  }, [authUser, loading, lastChecked]);

  return {
    unreadCount,
    hasNewUpdates,
    lastChecked,
    updateLastChecked,
    isLoading: loading
  };
};