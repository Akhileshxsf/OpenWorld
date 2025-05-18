import { Box, Flex, Tooltip, keyframes } from "@chakra-ui/react";
import { useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, doc as firestoreDoc, getDoc } from "firebase/firestore";
import { firestore, auth } from "../../firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

// Flicker animation for mobile text
const flicker = keyframes`
  0%, 100% { text-shadow: 0 0 5px rgba(75, 158, 255, 0.8); }
  50% { text-shadow: 0 0 10px rgba(75, 158, 255, 1); }
`;

// Glow animation for icon
const glow = keyframes`
  0%, 100% { filter: drop-shadow(0 0 5px rgba(75, 158, 255, 0.8)); }
  50% { filter: drop-shadow(0 0 10px rgba(75, 158, 255, 1)); }
`;

const Notifications = () => {
  const commonIconSize = 25;
  const { pathname } = useLocation();
  const isActive = pathname === "/notification";
  const [unreadCount, setUnreadCount] = useState(0);
  const [authUser, loading] = useAuthState(auth);

  // Fetch unread notification count
  useEffect(() => {
    if (!authUser || loading) {
      setUnreadCount(0);
      return;
    }

    const notificationsRef = collection(firestore, "notifications");
    const q = query(notificationsRef, where("type", "==", "notification"));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        let unread = 0;
        await Promise.all(
          snapshot.docs.map(async (doc) => {
            const userStatusRef = firestoreDoc(
              firestore,
              `notifications/${doc.id}/userStatus`,
              authUser.uid
            );
            try {
              const userStatusDoc = await getDoc(userStatusRef);
              if (!userStatusDoc.exists() || !userStatusDoc.data().read) {
                unread++;
              }
            } catch (error) {
              console.warn(`Failed to fetch userStatus for notification ${doc.id}:`, error);
            }
          })
        );
        setUnreadCount(unread);
      },
      (error) => {
        console.error("Error fetching unread notifications:", error);
        setUnreadCount(0);
      }
    );

    return () => unsubscribe();
  }, [authUser, loading]);

  return (
    <Tooltip
      hasArrow
      placement="right"
      ml={1}
      openDelay={500}
      display={{ base: "block", md: "none" }}
      label="Notifications"
    >
      <Flex
        as={Link}
        to="/notification"
        alignItems="center"
        gap={{ base: 1, md: 4 }}
        bg={{
          base: isActive ? "rgba(75, 158, 255, 0.3)" : "transparent",
          md: "transparent",
        }}
        borderRadius={{ base: 10, md: 6 }}
        p={{ base: 2, md: 2 }}
        w={{ base: "auto", md: "full" }}
        justifyContent={{ base: "center", md: "flex-start" }}
        flexDir={{ base: "column", md: "row" }}
        _hover={{
          base: {
            bg: "rgba(75, 158, 255, 0.4)",
            boxShadow: "0 0 12px rgba(75, 158, 255, 0.6)",
            transform: "scale(1.1)",
          },
          md: { bg: "whiteAlpha.400" },
        }}
        transition="all 0.3s"
        position="relative"
        _after={{
          content: '""',
          position: "absolute",
          bottom: 0,
          left: { base: "20%", md: "10%" },
          right: { base: "20%", md: "10%" },
          height: "2px",
          bg: isActive ? "#1E90FF" : "transparent",
          display: { base: "block", md: "none" },
        }}
      >
        <Box position="relative" display="inline-block">
          <img
            src="/noti.png"
            alt="Notifications"
            style={{
              width: commonIconSize,
              height: "auto",
              animation: unreadCount > 0 ? `${glow} 1.5s infinite` : "none",
            }}
          />
          {unreadCount > 0 && (
            <Box
              position="absolute"
              top="-5px"
              right="-5px"
              bg="red.500"
              color="white"
              borderRadius="full"
              minW={{ base: "16px", md: "20px" }}
              h={{ base: "16px", md: "20px" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize={{ base: "xs", md: "sm" }}
              fontWeight="bold"
              boxShadow="0 0 5px rgba(0, 0, 0, 0.3)"
            >
              {unreadCount}
            </Box>
          )}
        </Box>
        <Box
          display={{ base: "block", md: "block" }}
          color="#87CEEB"
          fontWeight="bold"
          fontSize={{ base: "xs", md: "md" }}
          fontStyle="italic"
          animation={{ base: `${flicker} 1.5s infinite`, md: "none" }}
        >
          Notify
        </Box>
      </Flex>
    </Tooltip>
  );
};

export default Notifications;