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
  IconButton,
  Badge,
  HStack,
  useBreakpointValue,
  InputGroup,
  InputRightElement,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from "@chakra-ui/react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  addDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  where,
  getDocs,
  updateDoc,
  limit,
} from "firebase/firestore";
import { firestore, auth } from "../../firebase/firebase";
import { useNavigate, useParams } from "react-router-dom";
import { 
  FiMessageSquare, 
  FiMenu, 
  FiX, 
  FiSend,
  FiSearch,
  FiMoreVertical,
  FiUser,
  FiVideo,
  FiInfo
} from "react-icons/fi";
import { useAuthState } from "react-firebase-hooks/auth";

const MessageTab = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { chatId } = useParams(); // Get chatId from URL
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const toast = useToast();
  const navigate = useNavigate();
  const [authUser] = useAuthState(auth);

  const isMobile = useBreakpointValue({ base: true, md: false });

  // Fetch current user data
  useEffect(() => {
    if (!authUser) return;

    const userRef = doc(firestore, "users", authUser.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setCurrentUser(docSnap.data());
      }
    });

    return () => unsubscribe();
  }, [authUser]);

  // Fetch active chats
  const fetchActiveChats = useCallback(async () => {
    if (!authUser) return;

    try {
      const offersRef = collection(firestore, "offers");
      
      const incomingQuery = query(
        offersRef,
        where("type", "==", "connection_request"),
        where("status", "==", "connected"),
        where("toUserId", "==", authUser.uid)
      );

      const outgoingQuery = query(
        offersRef,
        where("type", "==", "connection_request"),
        where("status", "==", "connected"),
        where("fromUserId", "==", authUser.uid)
      );

      const [incomingSnap, outgoingSnap] = await Promise.all([
        getDocs(incomingQuery),
        getDocs(outgoingQuery)
      ]);

      const allChats = [...incomingSnap.docs, ...outgoingSnap.docs];
      
      const userChats = await Promise.all(
        allChats.map(async (docItem) => {
          const chatData = docItem.data();
          const otherUserId = chatData.fromUserId === authUser.uid 
            ? chatData.toUserId 
            : chatData.fromUserId;
          
          let otherUser = {
            username: "Unknown User",
            profession: "No Profession",
            profilePicURL: ""
          };

          try {
            const userDocRef = doc(firestore, "users", otherUserId);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
              otherUser = { ...otherUser, ...userSnap.data() };
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
          }

          let lastMessage = "Start a conversation";
          let lastMessageTime = chatData.connectedAt;
          let unreadCount = 0;
          
          if (chatData.chatRoomId) {
            try {
              const messagesRef = collection(firestore, "chatRooms", chatData.chatRoomId, "messages");
              const messagesQuery = query(messagesRef, orderBy("timestamp", "desc"), limit(1));
              const messagesSnap = await getDocs(messagesQuery);
              
              if (!messagesSnap.empty) {
                const lastMsg = messagesSnap.docs[0].data();
                lastMessage = lastMsg.text && lastMsg.text.length > 30 
                  ? lastMsg.text.substring(0, 30) + '...' 
                  : lastMsg.text || "Start a conversation";
                lastMessageTime = lastMsg.timestamp;
              }
            } catch (error) {
              console.error("Error fetching chat data:", error);
            }
          }

          return {
            id: docItem.id,
            chatRoomId: chatData.chatRoomId,
            otherUser: {
              id: otherUserId,
              ...otherUser
            },
            lastMessage,
            lastMessageTime,
            unreadCount,
            connection: chatData
          };
        })
      );

      const sortedChats = userChats.sort((a, b) => {
        const timeA = a.lastMessageTime?.toDate?.() || new Date(0);
        const timeB = b.lastMessageTime?.toDate?.() || new Date(0);
        return timeB - timeA;
      });

      setActiveChats(sortedChats);
      setFilteredChats(sortedChats);

      // FIXED: Properly handle chat selection based on URL parameter
      if (chatId) {
        const selectedChat = sortedChats.find(chat => chat.chatRoomId === chatId);
        if (selectedChat) {
          setCurrentChat(selectedChat);
        } else {
          // If specified chat not found, don't automatically select another chat
          // This prevents the routing issue
          setCurrentChat(null);
        }
      } else if (sortedChats.length > 0 && !currentChat) {
        // Only set first chat as current if no chat is selected and no URL parameter
        setCurrentChat(sortedChats[0]);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching chats:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to load chats.",
        status: "error",
        duration: 3000,
      });
    }
  }, [authUser, chatId, toast]); // Removed currentChat from dependencies

  useEffect(() => {
    fetchActiveChats();
  }, [fetchActiveChats]);

  // Filter chats based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChats(activeChats);
      return;
    }

    const filtered = activeChats.filter(chat =>
      chat.otherUser.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.otherUser.profession?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredChats(filtered);
  }, [searchQuery, activeChats]);

  // Initialize chat room if it doesn't exist
  const initializeChatRoom = async (chatRoomId, fromUserId, toUserId) => {
    try {
      const chatRoomRef = doc(firestore, "chatRooms", chatRoomId);
      const chatRoomSnap = await getDoc(chatRoomRef);
      
      if (!chatRoomSnap.exists()) {
        await setDoc(chatRoomRef, {
          createdAt: serverTimestamp(),
          participants: [fromUserId, toUserId],
          lastActivity: serverTimestamp(),
          createdBy: authUser.uid
        });
        console.log("Chat room created:", chatRoomId);
      }
    } catch (error) {
      console.error("Error initializing chat room:", error);
    }
  };

  // Initialize chat room when current chat changes
  useEffect(() => {
    if (currentChat?.chatRoomId && currentChat.connection) {
      initializeChatRoom(
        currentChat.chatRoomId, 
        currentChat.connection.fromUserId, 
        currentChat.connection.toUserId
      );
    }
  }, [currentChat]);

  // Fetch messages for current chat
  useEffect(() => {
    if (!currentChat?.chatRoomId) {
      setMessages([]);
      return;
    }

    try {
      const messagesRef = collection(firestore, "chatRooms", currentChat.chatRoomId, "messages");
      const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));

      const unsubscribe = onSnapshot(
        messagesQuery,
        (snapshot) => {
          const messagesData = snapshot.docs.map(docItem => ({
            id: docItem.id,
            ...docItem.data(),
            timestamp: docItem.data().timestamp?.toDate?.() || new Date()
          }));
          setMessages(messagesData);
        },
        (error) => {
          console.error("Error fetching messages:", error);
          toast({
            title: "Error",
            description: "Failed to load messages.",
            status: "error",
            duration: 3000,
          });
        }
      );

      if (isMobile) {
        setSidebarOpen(false);
      }

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up messages listener:", error);
    }
  }, [currentChat, toast, isMobile]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input when chat changes
  useEffect(() => {
    if (currentChat && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [currentChat]);

  // Send message
  const sendMessage = async () => {
    if (!message.trim() || !currentChat || !authUser || sending) return;

    setSending(true);
    try {
      if (currentChat.connection) {
        await initializeChatRoom(
          currentChat.chatRoomId,
          currentChat.connection.fromUserId,
          currentChat.connection.toUserId
        );
      }

      const messageData = {
        senderId: authUser.uid,
        senderName: currentUser?.username || "User",
        senderProfilePic: currentUser?.profilePicURL || "",
        text: message.trim(),
        timestamp: serverTimestamp(),
        chatRoomId: currentChat.chatRoomId
      };

      await addDoc(
        collection(firestore, "chatRooms", currentChat.chatRoomId, "messages"),
        messageData
      );

      try {
        const chatRoomRef = doc(firestore, "chatRooms", currentChat.chatRoomId);
        await updateDoc(chatRoomRef, {
          lastActivity: serverTimestamp()
        });
      } catch (updateError) {
        console.error("Error updating chat room activity:", updateError);
      }

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        status: "error",
        duration: 3000,
      });
    } finally {
      setSending(false);
    }
  };

  const navigateToProfile = (username) => {
    if (username) navigate(`/${username}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // FIXED: Select chat function with proper navigation
  const selectChat = (chat) => {
    setCurrentChat(chat);
    // Navigate to the specific chat URL
    navigate(`/messages/${chat.chatRoomId}`);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "Just now";
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      return "Just now";
    }
  };

  // Sidebar Component
  const SidebarContent = () => (
    <Box 
      w={{ base: "100%", md: "400px" }} 
      h="100vh" 
      bg="black"
      borderRight="1px solid"
      borderColor="gray.800"
      display="flex"
      flexDirection="column"
      position={{ base: "absolute", md: "static" }}
      left={{ base: 0, md: "unset" }}
      top={{ base: 0, md: "unset" }}
      zIndex={{ base: 20, md: "unset" }}
    >
      {/* Sidebar Header */}
      <Flex p={4} borderBottom="1px solid" borderColor="gray.800" align="center">
        <Text fontSize="xl" fontWeight="bold" color="white" flex={1}>
          Messages
        </Text>
        {isMobile && (
          <IconButton
            icon={<FiX />}
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            size="sm"
            variant="ghost"
            color="white"
          />
        )}
      </Flex>

      {/* Search Bar */}
      <Box p={4} borderBottom="1px solid" borderColor="gray.800">
        <InputGroup>
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            bg="gray.900"
            border="1px solid"
            borderColor="gray.700"
            color="white"
            _placeholder={{ color: "gray.500" }}
            _focus={{
              borderColor: "blue.500",
              boxShadow: "0 0 0 1px blue.500",
            }}
          />
          <InputRightElement>
            <FiSearch color="gray.500" />
          </InputRightElement>
        </InputGroup>
      </Box>

      {/* Chats List */}
      <Box flex={1} overflowY="auto">
        {filteredChats.length === 0 ? (
          <Box p={8} textAlign="center">
            <FiMessageSquare size={48} color="#4A5568" style={{ margin: '0 auto 16px' }} />
            <Text color="gray.400" fontSize="lg" mb={2}>
              {searchQuery ? "No matches found" : "No conversations"}
            </Text>
            <Text color="gray.500" fontSize="sm">
              {searchQuery 
                ? "Try different search terms" 
                : "Your conversations will appear here"}
            </Text>
          </Box>
        ) : (
          <VStack spacing={0} align="stretch">
            {filteredChats.map((chat) => (
              <Flex
                key={chat.id}
                p={4}
                borderBottom="1px solid"
                borderColor="gray.800"
                bg={currentChat?.chatRoomId === chat.chatRoomId ? "blue.500" : "transparent"}
                _hover={{ bg: currentChat?.chatRoomId === chat.chatRoomId ? "blue.500" : "gray.900" }}
                cursor="pointer"
                onClick={() => selectChat(chat)}
                align="center"
                transition="all 0.2s"
              >
                <Avatar
                  size="md"
                  src={chat.otherUser.profilePicURL}
                  name={chat.otherUser.username}
                  mr={4}
                />
                <Box flex={1} minW={0}>
                  <Flex align="center" mb={1}>
                    <Text 
                      fontWeight="bold" 
                      color="white" 
                      fontSize="md" 
                      isTruncated
                      mr={2}
                    >
                      {chat.otherUser.username}
                    </Text>
                    {chat.unreadCount > 0 && (
                      <Badge 
                        colorScheme="red" 
                        borderRadius="full" 
                        fontSize="xs"
                        minW="20px"
                        textAlign="center"
                      >
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </Flex>
                  <Text fontSize="sm" color="gray.400" mb={1} isTruncated>
                    {chat.otherUser.profession}
                  </Text>
                  <Text 
                    fontSize="sm" 
                    color={currentChat?.chatRoomId === chat.chatRoomId ? "whiteAlpha.900" : "gray.500"} 
                    isTruncated
                  >
                    {chat.lastMessage}
                  </Text>
                </Box>
                <Text fontSize="xs" color="gray.500" ml={2} whiteSpace="nowrap">
                  {formatTime(chat.lastMessageTime)}
                </Text>
              </Flex>
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  );

  if (loading) {
    return (
      <Flex justify="center" align="center" h="100vh" bg="black">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="3px" />
          <Text color="gray.400">Loading messages...</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Flex 
      h="100vh" 
      bg="black" 
      position="relative" 
      overflow="hidden" 
      w="100vw"
      maxH="100vh"
    >
      {/* Sidebar */}
      {(sidebarOpen || !isMobile) && <SidebarContent />}

      {/* Main Content */}
      <Box 
        flex={1} 
        h="100vh"
        display="flex"
        flexDirection="column"
        bg="black"
        maxH="100vh"
        overflow="hidden"
      >
        {/* Persistent Header */}
        <Flex 
          p={4} 
          borderBottom="1px solid" 
          borderColor="gray.800" 
          align="center"
          bg="black"
          flexShrink={0}
          minH="80px"
        >
          {isMobile && (
            <IconButton
              icon={sidebarOpen ? <FiX /> : <FiMenu />}
              aria-label="Toggle sidebar"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              mr={3}
              variant="ghost"
              color="white"
              size="lg"
            />
          )}
          {currentChat ? (
            <>
              <Avatar
                size="md"
                src={currentChat.otherUser.profilePicURL}
                name={currentChat.otherUser.username}
                mr={4}
                cursor="pointer"
                onClick={() => navigateToProfile(currentChat.otherUser.username)}
              />
              <Box flex={1} minW={0}>
                <Text fontWeight="bold" color="white" fontSize="lg" isTruncated>
                  {currentChat.otherUser.username}
                </Text>
                <Text fontSize="sm" color="gray.400" isTruncated>
                  {currentChat.otherUser.profession}
                </Text>
              </Box>
              <HStack spacing={2} flexShrink={0}>
                <Tooltip label="Video call">
                  <IconButton
                    icon={<FiVideo />}
                    aria-label="Video call"
                    size="sm"
                    variant="ghost"
                    color="gray.400"
                    _hover={{ color: "blue.500", bg: "gray.800" }}
                  />
                </Tooltip>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FiMoreVertical />}
                    aria-label="More options"
                    size="sm"
                    variant="ghost"
                    color="gray.400"
                    _hover={{ color: "blue.500", bg: "gray.800" }}
                  />
                  <MenuList bg="gray.900" borderColor="gray.700">
                    <MenuItem 
                      icon={<FiUser />} 
                      bg="gray.900"
                      _hover={{ bg: "gray.800" }}
                      color="white"
                      onClick={() => navigateToProfile(currentChat.otherUser.username)}
                    >
                      View Profile
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem 
                      bg="gray.900"
                      _hover={{ bg: "red.600" }}
                      color="red.400"
                    >
                      Delete Chat
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            </>
          ) : (
            <Text fontSize="xl" fontWeight="bold" color="white" flex={1}>
              Messages
            </Text>
          )}
        </Flex>

        {currentChat ? (
          <>
            {/* Messages Area */}
            <Box 
              flex={1}
              overflowY="auto" 
              p={4}
              minH={0}
              css={{
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#374151',
                  borderRadius: '24px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#4B5563',
                },
              }}
            >
              <VStack align="stretch" spacing={4} pb={4}>
                {messages.length === 0 ? (
                  <Box textAlign="center" py={8} color="gray.400">
                    <FiMessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <Text fontSize="lg">No messages yet</Text>
                    <Text fontSize="sm">Start the conversation by sending a message!</Text>
                  </Box>
                ) : (
                  messages.map((msg) => (
                    <Flex
                      key={msg.id}
                      justify={msg.senderId === authUser?.uid ? "flex-end" : "flex-start"}
                      align="flex-end"
                      gap={3}
                    >
                      {msg.senderId !== authUser?.uid && (
                        <Avatar
                          size="sm"
                          src={msg.senderProfilePic}
                          name={msg.senderName}
                          flexShrink={0}
                        />
                      )}
                      <Box
                        maxW={{ base: "85%", md: "70%" }}
                        bg={msg.senderId === authUser?.uid ? "blue.500" : "gray.800"}
                        color="white"
                        px={4}
                        py={3}
                        borderRadius="2xl"
                        borderBottomRightRadius={msg.senderId === authUser?.uid ? 8 : "2xl"}
                        borderBottomLeftRadius={msg.senderId === authUser?.uid ? "2xl" : 8}
                      >
                        {msg.senderId !== authUser?.uid && (
                          <Text fontSize="xs" color="blue.300" mb={1} fontWeight="medium">
                            {msg.senderName}
                          </Text>
                        )}
                        <Text fontSize="md" lineHeight="1.4" wordBreak="break-word">
                          {msg.text}
                        </Text>
                        <Text 
                          fontSize="xs" 
                          color={msg.senderId === authUser?.uid ? "blue.100" : "gray.400"} 
                          mt={2} 
                          textAlign="right"
                        >
                          {formatTime(msg.timestamp)}
                        </Text>
                      </Box>
                      {msg.senderId === authUser?.uid && (
                        <Avatar
                          size="sm"
                          src={currentUser?.profilePicURL}
                          name={currentUser?.username}
                          flexShrink={0}
                        />
                      )}
                    </Flex>
                  ))
                )}
                <div ref={messagesEndRef} />
              </VStack>
            </Box>

            {/* Message Input */}
            <Flex 
              p={4} 
              borderTop="1px solid" 
              borderColor="gray.800" 
              bg="black"
              flexShrink={0}
            >
              <Input
                ref={inputRef}
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                bg="gray.900"
                color="white"
                border="1px solid"
                borderColor="gray.700"
                _focus={{
                  borderColor: "blue.500",
                  boxShadow: "0 0 0 1px blue.500",
                }}
                _placeholder={{ color: "gray.500" }}
                mr={3}
                size="lg"
                borderRadius="xl"
                flex={1}
              />
              <Button
                onClick={sendMessage}
                isLoading={sending}
                isDisabled={!message.trim()}
                bg="blue.500"
                color="white"
                _hover={{ bg: "blue.600" }}
                _active={{ bg: "blue.700" }}
                size="lg"
                px={6}
                borderRadius="xl"
                leftIcon={<FiSend />}
                flexShrink={0}
              >
                Send
              </Button>
            </Flex>
          </>
        ) : (
          /* No Chat Selected State */
          <Flex 
            flex={1} 
            justify="center" 
            align="center" 
            flexDirection="column" 
            p={8}
            bg="black"
            minH={0}
          >
            <Box textAlign="center" maxW="400px">
              <FiMessageSquare size={64} color="#4A5568" style={{ margin: '0 auto 24px' }} />
              <Text color="white" fontSize="2xl" fontWeight="bold" mb={3}>
                {activeChats.length === 0 ? "No conversations yet" : "Welcome to Messages"}
              </Text>
              <Text color="gray.400" fontSize="md" mb={6}>
                {activeChats.length === 0 
                  ? "Connect with users to start meaningful conversations" 
                  : "Select a conversation from the sidebar to start messaging"}
              </Text>
              {activeChats.length === 0 && (
                <Button
                  bg="blue.500"
                  color="white"
                  _hover={{ bg: "blue.600" }}
                  onClick={() => navigate("/notification")}
                >
                  Find Connections
                </Button>
              )}
            </Box>
          </Flex>
        )}
      </Box>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <Box
          position="absolute"
          top={0}
          left={0}
          w="100%"
          h="100%"
          bg="blackAlpha.800"
          zIndex={10}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </Flex>
  );
};

export default MessageTab;