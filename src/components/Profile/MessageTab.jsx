import {
  Box,
  Input,
  Button,
  VStack,
  Text,
  Flex,
  Spinner,
  useToast,
  Avatar,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  addDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { firestore, auth } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { FiUsers } from "react-icons/fi";

const MessageTab = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const messagesEndRef = useRef(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const placeholders = [
    "Its a open message",
    "ask any thing",
    "Need Maggi",
    "Need People to collaborate on project",
    "Need a graphic designer",
    "Just message and Trade Time",
  ];

  // Cycle through placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prevIndex) => (prevIndex + 1) % placeholders.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  // Fetch messages
  useEffect(() => {
    const messagesRef = collection(firestore, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        try {
          const messagesData = await Promise.all(
            querySnapshot.docs.map(async (docSnap) => {
              const message = { id: docSnap.id, ...docSnap.data() };

              if (message.senderId) {
                try {
                  const userDocRef = doc(firestore, "users", message.senderId);
                  const userSnap = await getDoc(userDocRef);
                  message.senderInfo = userSnap.exists()
                    ? userSnap.data()
                    : { username: "Unknown", profession: "No Profession", profilePicURL: "", isOnline: false };
                } catch (error) {
                  console.error("Error fetching sender info:", error);
                  message.senderInfo = { username: "Unknown", profession: "No Profession", profilePicURL: "", isOnline: false };
                }
              }

              return message;
            })
          );

          setMessages(messagesData);
          setLoading(false);
        } catch (error) {
          console.error("Error processing messages:", error);
          toast({
            title: "Error",
            description: "Failed to fetch messages.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to fetch messages.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  // Fetch online users
  useEffect(() => {
    const usersRef = collection(firestore, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const onlineUsersData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.id !== currentUser?.uid && user.isOnline === true);
      setOnlineUsers(onlineUsersData);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!message.trim() || !currentUser?.uid) return;

    setSending(true);
    try {
      const messageData = {
        senderId: currentUser.uid,
        text: message,
        timestamp: serverTimestamp(),
      };
      await addDoc(collection(firestore, "messages"), messageData);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSending(false);
    }
  };

  const navigateToProfile = (username) => {
    if (username) navigate(`/${username}`);
  };

  return (
    <Flex h="100vh" flexDirection="column">
      <Box flex={1} overflowY="auto" p={4} pb={8}>
        {loading ? (
          <Spinner />
        ) : (
          <VStack align="start" spacing={4}>
            {messages.map((msg) => (
              <Flex
                key={msg.id}
                p={3}
                bg={msg.senderId === currentUser?.uid ? "grey.600" : "black.200"}
                borderRadius="md"
                w="full"
                direction="column"
              >
                <Flex
                  align="center"
                  mb={2}
                  onClick={() => navigateToProfile(msg.senderInfo?.username)}
                  cursor="pointer"
                >
                  <Box position="relative">
                    <Avatar
                      size="sm"
                      src={msg.senderInfo?.profilePicURL || "https://via.placeholder.com/40"}
                      mr={2}
                    />
                    {msg.senderInfo?.isOnline && (
                      <Box
                        position="absolute"
                        bottom={0}
                        right={2}
                        w={3}
                        h={3}
                        bg="green.500"
                        borderRadius="full"
                        border="2px solid"
                        borderColor="white"
                      />
                    )}
                  </Box>
                  <Box>
                    <Text fontWeight="bold" _hover={{ textDecoration: "underline" }}>
                      {msg.senderInfo?.username || "Unknown User"}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {msg.senderInfo?.profession || "No Profession"}
                    </Text>
                  </Box>
                </Flex>
                <Text>{msg.text}</Text>
              </Flex>
            ))}
            <div ref={messagesEndRef} />
          </VStack>
        )}
      </Box>
      <Flex
        p={{ base: 5, md: 4 }}
        position={{ base: "sticky", md: "static" }}
        bottom={{ base: "60px", md: "auto" }}
        bg="black"
        zIndex={10}
        direction={{ base: "column", md: "row" }}
        align="center"
        w="100%"
      >
        <Flex w="100%" align="center" mb={{ base: 2, md: 0 }}>
          <Input
            placeholder={placeholders[placeholderIndex]}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !sending && sendMessage()}
            isDisabled={sending}
            w={{ base: "100%", md: "auto" }}
            flex={{ md: 1 }}
            bg="gray.800"
            color="white"
            border="none"
            _focus={{ boxShadow: "0 0 0 2px #3182ce" }}
          />
          <IconButton
            icon={<FiUsers />}
            aria-label="View online users"
            onClick={onOpen}
            ml={2}
            colorScheme="blue"
            bg="blue.500"
            _hover={{ bg: "blue.600" }}
            _active={{ bg: "blue.700" }}
            borderRadius="full"
            size="lg"
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.2)"
          />
        </Flex>
        <Button
          colorScheme="blue"
          onClick={sendMessage}
          isLoading={sending}
          isDisabled={sending}
          ml={{ base: 0, md: 2 }}
          w={{ base: "100%", md: "auto" }}
          bg="blue.500"
          _hover={{ bg: "blue.600" }}
          _active={{ bg: "blue.700" }}
          borderRadius="md"
          boxShadow="0 2px 8px rgba(0, 0, 0, 0.2)"
        >
          Send
        </Button>
      </Flex>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white" borderRadius="lg" mx={4}>
          <ModalHeader borderBottom="1px solid" borderColor="gray.700">
            Online Users
          </ModalHeader>
          <ModalCloseButton color="gray.400" _hover={{ color: "gray.200" }} />
          <ModalBody py={4}>
            <VStack spacing={3}>
              {onlineUsers.length > 0 ? (
                onlineUsers.map((user) => (
                  <Flex
                    key={user.id}
                    w="full"
                    align="center"
                    p={3}
                    borderRadius="md"
                    _hover={{ bg: "gray.700", cursor: "pointer" }}
                    onClick={() => navigateToProfile(user.username)}
                    transition="background 0.2s"
                  >
                    <Avatar
                      size="sm"
                      src={user.profilePicURL || "https://via.placeholder.com/40"}
                      mr={3}
                      border="2px solid"
                      borderColor="green.500"
                    />
                    <Box>
                      <Text fontWeight="medium" fontSize="md">
                        {user.username || "Unknown User"}
                      </Text>
                      <Text fontSize="sm" color="gray.400">
                        {user.profession || "No Profession"}
                      </Text>
                    </Box>
                  </Flex>
                ))
              ) : (
                <Text color="gray.400">No online users available</Text>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default MessageTab;