import {
  Container,
  Flex,
  Box,
  VStack,
  Text,
  Button,
  Heading,
  Avatar,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  useDisclosure,
  List,
  ListItem,
  Link,
  Spinner,
} from "@chakra-ui/react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  collection,
  doc as firestoreDoc,
  getDoc,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { firestore, auth } from "../../firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import useShowToast from "../../hooks/useShowToast";

// Constants
const COLLECTIONS = {
  NOTIFICATIONS: "notifications",
  USERS: "users",
  USER_STATUS: "userStatus",
};
const NOTIFICATION_TYPE = "notification";
const MAX_CACHED_USERS = 50; // Limit user cache size

// Motion components
const MotionBox = motion(Box);
const MotionButton = motion(Button);

// Utility to handle errors consistently
const handleError = (showToast, message, error, context) => {
  console.error(`${context}:`, error);
  showToast("Error", `${message}: ${error.message}`, "error");
};

// Default user data
const defaultUserData = {
  username: "Unknown User",
  email: "No email",
  profilePicURL: "",
  fullName: "",
  profession: "",
  bio: "",
  createdAt: 0,
  posts: [],
  Rating: [],
  SoldInstances: [],
  link: "",
  uid: "",
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [userCache, setUserCache] = useState({});
  const [authUser, loading] = useAuthState(auth);
  const [message, setMessage] = useState("");
  const [selectedSenderData, setSelectedSenderData] = useState(null);
  const [selectedReaders, setSelectedReaders] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const navigate = useNavigate();
  const showToast = useShowToast();
  const { isOpen, onOpen, onClose } = useDisclosure(); // Notification modal
  const { isOpen: isSenderOpen, onOpen: onSenderOpen, onClose: onSenderClose } = useDisclosure(); // Sender data modal
  const { isOpen: isReadersOpen, onOpen: onReadersOpen, onClose: onReadersClose } = useDisclosure(); // Readers modal

  // Navigate to user profile
  const navigateToProfile = useCallback((username) => {
    if (username && username !== "Unknown User") {
      navigate(`/${username}`);
    }
  }, [navigate]);

  // Fetch user data with caching
  const fetchUserData = useCallback(async (userId) => {
    if (!userId || userId === "unknown") return defaultUserData;
    if (userCache[userId]) return userCache[userId];

    try {
      const userDocRef = firestoreDoc(firestore, COLLECTIONS.USERS, userId);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists()
        ? {
            ...defaultUserData,
            username: userDoc.data().username || "Unknown User",
            email: userDoc.data().email || "No email",
            profilePicURL: userDoc.data().profilePicURL || "",
            fullName: userDoc.data().fullName || "",
            profession: userDoc.data().profession || "",
            bio: userDoc.data().bio || "",
            createdAt: userDoc.data().createdAt || 0,
            posts: userDoc.data().posts || [],
            Rating: userDoc.data().Rating || [],
            SoldInstances: userDoc.data().SoldInstances || [],
            link: userDoc.data().link || "",
            uid: userId,
          }
        : defaultUserData;

      setUserCache((prev) => {
        const newCache = { ...prev, [userId]: userData };
        if (Object.keys(newCache).length > MAX_CACHED_USERS) {
          const keys = Object.keys(newCache);
          delete newCache[keys[0]]; // Remove oldest entry
        }
        return newCache;
      });
      return userData;
    } catch (error) {
      handleError(showToast, "Failed to fetch user data", error, `fetchUserData(${userId})`);
      return defaultUserData;
    }
  }, [userCache, showToast]);

  // Create notification
  const createNotification = useCallback(async () => {
    if (!authUser) {
      showToast("Error", "You must be logged in to create a notification", "error");
      return;
    }
    if (!message.trim()) {
      showToast("Error", "Please enter a message", "error");
      return;
    }

    try {
      const timestamp = Date.now();
      const notificationId = `notification-${timestamp}`;
      const notificationRef = firestoreDoc(firestore, COLLECTIONS.NOTIFICATIONS, notificationId);
      const { username } = await fetchUserData(authUser.uid);
      await setDoc(notificationRef, {
        senderId: authUser.uid,
        type: NOTIFICATION_TYPE,
        message: `${username}: ${message}`,
        timestamp: new Date(),
        readBy: [],
      });
      showToast("Success", "Notification created successfully", "success", {
        position: "top",
        duration: 3000,
        zIndex: 9999,
      });
      setTimeout(() => {
        onClose();
        setMessage("");
      }, 500);
    } catch (error) {
      handleError(showToast, "Failed to create notification", error, "createNotification");
    }
  }, [authUser, message, fetchUserData, showToast, onClose]);

  // Fetch notifications (real-time)
  useEffect(() => {
    if (!authUser || loading) return;

    setIsFetching(true);
    const notificationsRef = collection(firestore, COLLECTIONS.NOTIFICATIONS);
    const q = query(notificationsRef, where("type", "==", NOTIFICATION_TYPE));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const userNotifications = await Promise.all(
            snapshot.docs.map(async (notificationDoc) => {
              const data = notificationDoc.data();
              const { username, profilePicURL } = await fetchUserData(data.senderId || "unknown");

              try {
                const userStatusRef = firestoreDoc(
                  firestore,
                  `${COLLECTIONS.NOTIFICATIONS}/${notificationDoc.id}/${COLLECTIONS.USER_STATUS}`,
                  authUser.uid
                );
                const userStatusDoc = await getDoc(userStatusRef);
                const read = userStatusDoc.exists() ? userStatusDoc.data().read : false;

                return {
                  id: notificationDoc.id,
                  type: data.type || NOTIFICATION_TYPE,
                  message: data.message || "No content",
                  username,
                  profilePicURL,
                  timestamp: data.timestamp?.toDate?.() || new Date(),
                  read,
                  readBy: data.readBy || [],
                  senderId: data.senderId || "unknown",
                };
              } catch (error) {
                console.warn(`Failed to fetch read status for ${notificationDoc.id}:`, error);
                return {
                  id: notificationDoc.id,
                  type: data.type || NOTIFICATION_TYPE,
                  message: data.message || "No content",
                  username,
                  profilePicURL,
                  timestamp: data.timestamp?.toDate?.() || new Date(),
                  read: false,
                  readBy: data.readBy || [],
                  senderId: data.senderId || "unknown",
                };
              }
            })
          );

          setNotifications(userNotifications.sort((a, b) => b.timestamp - a.timestamp));
        } catch (error) {
          handleError(showToast, "Failed to process notifications", error, "onSnapshot");
        } finally {
          setIsFetching(false);
        }
      },
      (error) => {
        handleError(showToast, "Failed to listen for notifications", error, "onSnapshot listener");
        setIsFetching(false);
      }
    );

    return () => unsubscribe();
  }, [authUser, loading, fetchUserData, showToast]);

  // Mark notification as read
  const markAsRead = useCallback(async (id, senderId) => {
    if (!id || !authUser) return;

    try {
      const notificationRef = firestoreDoc(firestore, COLLECTIONS.NOTIFICATIONS, id);
      const userStatusRef = firestoreDoc(
        firestore,
        `${COLLECTIONS.NOTIFICATIONS}/${id}/${COLLECTIONS.USER_STATUS}`,
        authUser.uid
      );
      const senderData = await fetchUserData(senderId);

      await setDoc(userStatusRef, { read: true, readAt: new Date() });
      await updateDoc(notificationRef, { readBy: arrayUnion(authUser.uid) });

      setNotifications((prev) =>
        prev
          .map((notif) =>
            notif.id === id
              ? { ...notif, read: true, readBy: [...notif.readBy, authUser.uid] }
              : notif
          )
          .sort((a, b) => b.timestamp - a.timestamp)
      );

      setSelectedSenderData(senderData);
      onSenderOpen();
    } catch (error) {
      handleError(showToast, "Failed to mark notification as read", error, "markAsRead");
    }
  }, [authUser, fetchUserData, showToast, onSenderOpen]);

  // Show readers in modal
  const showReaders = useCallback(async (readBy) => {
    if (!readBy || readBy.length === 0) {
      setSelectedReaders([]);
      onReadersOpen();
      return;
    }

    try {
      const readersData = await Promise.all(
        readBy.map(async (userId) => (await fetchUserData(userId)).username)
      );
      setSelectedReaders(readersData);
      onReadersOpen();
    } catch (error) {
      handleError(showToast, "Failed to fetch readers", error, "showReaders");
    }
  }, [fetchUserData, showToast, onReadersOpen]);

  // Animation variants
  const notificationVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const plusButtonVariants = {
    idle: { scale: 1, boxShadow: "0 0 10px rgba(30, 144, 255, 0.5)" },
    hover: { scale: 1.2, boxShadow: "0 0 20px rgba(30, 144, 255, 0.8)" },
    tap: { scale: 0.9 },
    pulse: {
      scale: [1, 1.1, 1],
      boxShadow: [
        "0 0 10px rgba(30, 144, 255, 0.5)",
        "0 0 20px rgba(30, 144, 255, 0.8)",
        "0 0 10px rgba(30, 144, 255, 0.5)",
      ],
      transition: { repeat: Infinity, duration: 1.5 },
    },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  };

  // Unread notifications count
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="50vh">
        <Spinner size="xl" color="cyan.300" />
      </Flex>
    );
  }

  if (!authUser) {
    return (
      <Text color="white" textAlign="center" fontSize={{ base: "lg", md: "xl" }}>
        Please log in to view notifications.
      </Text>
    );
  }

  return (
    <Container maxW={{ base: "100%", md: "container.lg" }} py={{ base: 4, md: 8 }} px={{ base: 3, md: 4 }}>
      <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        <Flex
          justify="space-between"
          align="center"
          mb={{ base: 4, md: 6 }}
          direction="row"
          gap={{ base: 2, md: 4 }}
        >
          <Heading
            fontSize={{ base: "2xl", md: "4xl" }}
            fontWeight="extrabold"
            color="white"
            textAlign="left"
            textShadow="0 2px 4px rgba(0, 0, 0, 0.3)"
          >
            Notifications
          </Heading>
          <MotionButton
            size="lg"
            bg="linear-gradient(45deg, #1E90FF, #00CED1)"
            color="white"
            _hover={{ bg: "linear-gradient(45deg, #00CED1, #87CEEB)" }}
            variants={plusButtonVariants}
            initial="idle"
            animate="pulse"
            whileHover="hover"
            whileTap="tap"
            onClick={onOpen}
            borderRadius="full"
            w={{ base: "48px", md: "56px" }}
            h={{ base: "48px", md: "56px" }}
            fontSize={{ base: "2xl", md: "3xl" }}
            boxShadow="0 0 15px rgba(30, 144, 255, 0.6)"
            aria-label="Create new notification"
            zIndex={10}
          >
            +
          </MotionButton>
        </Flex>

        {isFetching ? (
          <VStack spacing={4} align="stretch">
            {[...Array(3)].map((_, i) => (
              <Box
                key={i}
                bg="gray.800"
                borderRadius="lg"
                p={4}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Flex align="center" gap={3}>
                  <Avatar size="md" />
                  <Box flex="1">
                    <Box bg="gray.700" h="16px" w="60%" borderRadius="md" mb={2} />
                    <Box bg="gray.700" h="12px" w="40%" borderRadius="md" />
                  </Box>
                </Flex>
              </Box>
            ))}
          </VStack>
        ) : notifications.length === 0 ? (
          <Text fontSize={{ base: "md", md: "lg" }} color="gray.400" textAlign="center" mt={{ base: 8, md: 12 }}>
            No notifications yet.
          </Text>
        ) : (
          <VStack spacing={{ base: 3, md: 4 }} align="stretch">
            {notifications.map((notification) => (
              <MotionBox
                key={notification.id}
                variants={notificationVariants}
                initial="hidden"
                animate="visible"
                bg={notification.read ? "rgba(255, 255, 255, 0.05)" : "rgba(30, 144, 255, 0.1)"}
                backdropFilter="blur(8px)"
                borderRadius="lg"
                p={{ base: 3, md: 4 }}
                boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
                _hover={{
                  transform: "scale(1.02)",
                  boxShadow: "0 6px 16px rgba(30, 144, 255, 0.4)",
                }}
                transition="all 0.3s"
                role="article"
                aria-labelledby={`notification-${notification.id}`}
              >
                <Flex
                  justify="space-between"
                  align="center"
                  direction={{ base: "column", md: "row" }}
                  gap={{ base: 2, md: 0 }}
                >
                  <Flex align="center" gap={{ base: 2, md: 3 }} w={{ base: "100%", md: "auto" }}>
                    <Avatar
                      size={{ base: "sm", md: "md" }}
                      src={notification.profilePicURL}
                      name={notification.username}
                      cursor="pointer"
                      onClick={() => navigateToProfile(notification.username)}
                      _hover={{ transform: "scale(1.1)" }}
                      transition="transform 0.2s"
                      aria-label={`Profile of ${notification.username}`}
                    />
                    <Box>
                      <Text
                        id={`notification-${notification.id}`}
                        fontWeight="bold"
                        color={notification.read ? "gray.400" : "white"}
                        fontSize={{ base: "sm", md: "md" }}
                        cursor="pointer"
                        onClick={() => navigateToProfile(notification.username)}
                        _hover={{ color: "cyan.300" }}
                      >
                        {notification.message}
                      </Text>
                      <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500" mt={1}>
                        {notification.timestamp
                          ? new Date(notification.timestamp).toLocaleString()
                          : "Unknown time"}
                      </Text>
                      <Text
                        fontSize={{ base: "xs", md: "sm" }}
                        color="cyan.300"
                        mt={1}
                        cursor="pointer"
                        onClick={() => showReaders(notification.readBy)}
                        _hover={{ textDecoration: "underline" }}
                        aria-label={`View users who read this notification (${notification.readBy.length})`}
                      >
                        Read by {notification.readBy.length} user{notification.readBy.length !== 1 ? "s" : ""}
                      </Text>
                    </Box>
                  </Flex>
                  {!notification.read && (
                    <MotionButton
                      size={{ base: "sm", md: "md" }}
                      bg="linear-gradient(45deg, #1E90FF, #00CED1)"
                      color="white"
                      _hover={{ bg: "linear-gradient(45deg, #00CED1, #87CEEB)" }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => markAsRead(notification.id, notification.senderId)}
                      mt={{ base: 2, md: 0 }}
                      w={{ base: "full", md: "auto" }}
                      aria-label={`Mark notification ${notification.id} as read`}
                    >
                      Mark as Read
                    </MotionButton>
                  )}
                </Flex>
              </MotionBox>
            ))}
          </VStack>
        )}
      </MotionBox>

      {/* Modal for creating notification */}
      <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "md" }} motionPreset="slideInBottom">
        <ModalOverlay bg="blackAlpha.800" />
        <MotionBox variants={modalVariants} initial="hidden" animate="visible">
          <ModalContent
            bg="black"
            border="1px solid"
            borderColor="gray.700"
            borderRadius={{ base: 0, md: "lg" }}
            maxH={{ base: "100vh", md: "80vh" }}
            overflowY="auto"
            role="dialog"
            aria-labelledby="create-notification-modal"
          >
            <ModalHeader color="white" fontSize={{ base: "lg", md: "xl" }} id="create-notification-modal">
              Create Notification
            </ModalHeader>
            <ModalCloseButton color="white" aria-label="Close create notification modal" />
            <ModalBody pb={6}>
              <Textarea
                placeholder="Enter your message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                bg="gray.800"
                color="white"
                border="1px solid"
                borderColor="gray.600"
                resize="vertical"
                maxLength={200}
                minH="120px"
                fontSize={{ base: "sm", md: "md" }}
                _focus={{ borderColor: "cyan.300", boxShadow: "0 0 0 1px cyan.300" }}
                aria-label="Notification message input"
              />
            </ModalBody>
            <ModalFooter>
              <Button
                colorScheme="teal"
                mr={3}
                onClick={createNotification}
                isDisabled={!message.trim()}
                size={{ base: "md", md: "lg" }}
                bg="linear-gradient(45deg, #00CED1, #1E90FF)"
                _hover={{ bg: "linear-gradient(45deg, #1E90FF, #87CEEB)" }}
                aria-label="Submit notification"
              >
                Submit
              </Button>
              <Button
                variant="ghost"
                color="white"
                onClick={onClose}
                size={{ base: "md", md: "lg" }}
                aria-label="Cancel notification creation"
              >
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </MotionBox>
      </Modal>

      {/* Modal for sender data */}
      <Modal
        isOpen={isSenderOpen}
        onClose={onSenderClose}
        size={{ base: "full", md: "lg" }}
        motionPreset="slideInBottom"
      >
        <ModalOverlay bg="blackAlpha.800" />
        <MotionBox variants={modalVariants} initial="hidden" animate="visible">
          <ModalContent
            bg="black"
            border="1px solid"
            borderColor="gray.700"
            borderRadius={{ base: 0, md: "lg" }}
            maxH={{ base: "100vh", md: "80vh" }}
            overflowY="auto"
            role="dialog"
            aria-labelledby="sender-info-modal"
          >
            <ModalHeader color="white" fontSize={{ base: "lg", md: "xl" }} id="sender-info-modal">
              Sender Information
            </ModalHeader>
            <ModalCloseButton color="white" aria-label="Close sender information modal" />
            <ModalBody pb={6}>
              {selectedSenderData ? (
                <VStack align="start" spacing={{ base: 3, md: 4 }}>
                  <Flex align="center" gap={3}>
                    <Avatar
                      size={{ base: "md", md: "lg" }}
                      src={selectedSenderData.profilePicURL}
                      name={selectedSenderData.username}
                      aria-label={`Profile picture of ${selectedSenderData.username}`}
                    />
                    <Text color="white" fontWeight="bold" fontSize={{ base: "md", md: "lg" }}>
                      {selectedSenderData.username}
                    </Text>
                  </Flex>
                  <Text color="white" fontSize={{ base: "sm", md: "md" }}>
                    <strong>Full Name:</strong> {selectedSenderData.fullName || "N/A"}
                  </Text>
                  <Text color="white" fontSize={{ base: "sm", md: "md" }}>
                    <strong>Email:</strong> {selectedSenderData.email || "N/A"}
                  </Text>
                  <Text color="white" fontSize={{ base: "sm", md: "md" }}>
                    <strong>Profession:</strong> {selectedSenderData.profession || "N/A"}
                  </Text>
                  <Text color="white" fontSize={{ base: "sm", md: "md" }}>
                    <strong>Bio:</strong> {selectedSenderData.bio || "N/A"}
                  </Text>
                  <Text color="white" fontSize={{ base: "sm", md: "md" }}>
                    <strong>Created At:</strong>{" "}
                    {selectedSenderData.createdAt
                      ? new Date(selectedSenderData.createdAt).toLocaleString()
                      : "Unknown"}
                  </Text>
                  <Text color="white" fontSize={{ base: "sm", md: "md" }}>
                    <strong>Link:</strong>{" "}
                    {selectedSenderData.link ? (
                      <Link href={selectedSenderData.link} isExternal color="cyan.300" aria-label="Sender's external link">
                        {selectedSenderData.link}
                      </Link>
                    ) : (
                      "N/A"
                    )}
                  </Text>
                  <Text color="white" fontSize={{ base: "sm", md: "md" }}>
                    <strong>UID:</strong> {selectedSenderData.uid || "N/A"}
                  </Text>
                  <Text color="white" fontSize={{ base: "sm", md: "md" }}>
                    <strong>Posts:</strong>{" "}
                    {selectedSenderData.posts.length > 0 ? selectedSenderData.posts.join(", ") : "None"}
                  </Text>
                  <Text color="white" fontSize={{ base: "sm", md: "md" }}>
                    <strong>Rating:</strong>{" "}
                    {selectedSenderData.Rating.length > 0 ? selectedSenderData.Rating.join(", ") : "None"}
                  </Text>
                  <Text color="white" fontSize={{ base: "sm", md: "md" }}>
                    <strong>Sold Instances:</strong>{" "}
                    {selectedSenderData.SoldInstances.length > 0
                      ? selectedSenderData.SoldInstances.join(", ")
                      : "None"}
                  </Text>
                </VStack>
              ) : (
                <Text color="white" fontSize={{ base: "sm", md: "md" }}>
                  No sender data available.
                </Text>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                variant="ghost"
                color="white"
                onClick={onSenderClose}
                size={{ base: "md", md: "lg" }}
                aria-label="Close sender information"
              >
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </MotionBox>
      </Modal>

      {/* Modal for readers */}
      <Modal
        isOpen={isReadersOpen}
        onClose={onReadersClose}
        size={{ base: "full", md: "sm" }}
        motionPreset="slideInBottom"
      >
        <ModalOverlay bg="blackAlpha.800" />
        <MotionBox variants={modalVariants} initial="hidden" animate="visible">
          <ModalContent
            bg="black"
            border="1px solid"
            borderColor="gray.700"
            borderRadius={{ base: 0, md: "lg" }}
            maxH={{ base: "100vh", md: "80vh" }}
            overflowY="auto"
            role="dialog"
            aria-labelledby="readers-modal"
          >
            <ModalHeader color="white" fontSize={{ base: "lg", md: "xl" }} id="readers-modal">
              Users Who Read
            </ModalHeader>
            <ModalCloseButton color="white" aria-label="Close readers modal" />
            <ModalBody pb={6}>
              {selectedReaders.length > 0 ? (
                <List spacing={2}>
                  {selectedReaders.map((username, index) => (
                    <ListItem key={index} color="white" fontSize={{ base: "sm", md: "md" }}>
                      {username}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Text color="white" fontSize={{ base: "sm", md: "md" }}>
                  No users have read this notification yet.
                </Text>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                variant="ghost"
                color="white"
                onClick={onReadersClose}
                size={{ base: "md", md: "lg" }}
                aria-label="Close readers list"
              >
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </MotionBox>
      </Modal>
    </Container>
  );
};

export default NotificationsPage;