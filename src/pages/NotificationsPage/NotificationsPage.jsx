import {
  Container,
  Flex,
  Box,
  VStack,
  Text,
  Button,
  Avatar,
  Spinner,
  Badge,
  HStack,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { firestore, auth } from "../../firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { 
  FiSend, 
  FiUserPlus, 
  FiRefreshCw, 
  FiX, 
  FiMessageCircle,
  FiTrendingUp,
  FiCheck,
  FiInfo
} from "react-icons/fi";

const groqClient = createGroq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
});

const MotionBox = motion(Box);

// Custom hook for tracking notification updates
const useNotificationUpdates = () => {
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [authUser] = useAuthState(auth);

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

  const updateLastChecked = useCallback(() => {
    if (authUser) {
      const now = new Date();
      setLastChecked(now);
      localStorage.setItem(`notifications_last_visited_${authUser.uid}`, now.toISOString());
      setHasNewUpdates(false);
    }
  }, [authUser]);

  const checkForNewUpdates = useCallback((newItems) => {
    if (!lastChecked || !authUser) return false;
    
    const hasNew = newItems.some(item => {
      const itemTime = item.timestamp?.toDate?.() || new Date();
      return itemTime > lastChecked;
    });
    
    if (hasNew) {
      setHasNewUpdates(true);
    }
    
    return hasNew;
  }, [lastChecked, authUser]);

  return {
    hasNewUpdates,
    lastChecked,
    updateLastChecked,
    checkForNewUpdates,
    setHasNewUpdates
  };
};

const NotificationsPage = () => {
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [authUser, loading] = useAuthState(auth);
  const [isFetching, setIsFetching] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [sentRequests, setSentRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const navigate = useNavigate();
  const toast = useToast();

  const {
    hasNewUpdates,
    updateLastChecked,
    checkForNewUpdates,
    setHasNewUpdates
  } = useNotificationUpdates();

  // Responsive values
  const containerPadding = useBreakpointValue({ base: 2, md: 4 });
  const avatarSize = useBreakpointValue({ base: "sm", md: "md" });
  const tabFontSize = useBreakpointValue({ base: "xs", md: "sm" });
  const tabPx = useBreakpointValue({ base: 2, md: 4 });

  // Color scheme
  const colors = {
    primary: {
      500: "#0074E8",
      600: "#005CB5",
    },
    accent: {
      500: "#00B4D8",
      600: "#0096C7",
    },
    gradient: {
      primary: "linear-gradient(135deg, #0074E8 0%, #00B4D8 100%)",
      hover: "linear-gradient(135deg, #005CB5 0%, #0096C7 100%)",
    },
    bg: "black",
    text: "white",
    secondaryText: "gray.400",
    cardBg: "rgba(255, 255, 255, 0.05)",
    border: "whiteAlpha.200",
  };

  // Update last visited when component mounts
  useEffect(() => {
    if (authUser) {
      updateLastChecked();
    }
  }, [authUser, activeTab, updateLastChecked]);

  // Fetch user profile and all users
  useEffect(() => {
    if (!authUser) return;

    const userRef = doc(firestore, "users", authUser.uid);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data());
      }
    });

    const usersRef = collection(firestore, "users");
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const usersData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.id !== authUser.uid);
      setAllUsers(usersData);
    });

    return () => {
      unsubscribeUser();
      unsubscribeUsers();
    };
  }, [authUser]);

  // Enhanced connection requests fetching
  useEffect(() => {
    if (!authUser || loading) return;

    setIsFetching(true);
    const offersRef = collection(firestore, "offers");

    // Incoming requests
    const incomingQuery = query(
      offersRef,
      where("type", "==", "connection_request"),
      where("toUserId", "==", authUser.uid),
      where("status", "==", "pending"),
      orderBy("timestamp", "desc")
    );

    // Sent requests
    const sentQuery = query(
      offersRef,
      where("type", "==", "connection_request"),
      where("fromUserId", "==", authUser.uid),
      where("status", "==", "pending"),
      orderBy("timestamp", "desc")
    );

    // Connections
    const connectionsQueryTo = query(
      offersRef,
      where("type", "==", "connection_request"),
      where("status", "==", "connected"),
      where("toUserId", "==", authUser.uid),
      orderBy("connectedAt", "desc")
    );

    const connectionsQueryFrom = query(
      offersRef,
      where("type", "==", "connection_request"),
      where("status", "==", "connected"),
      where("fromUserId", "==", authUser.uid),
      orderBy("connectedAt", "desc")
    );

    const unsubscribeIncoming = onSnapshot(incomingQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date()
      }));
      setConnectionRequests(requests);
      
      if (requests.length > 0) {
        checkForNewUpdates(requests);
      }
    });

    const unsubscribeSent = onSnapshot(sentQuery, (snapshot) => {
      const sent = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date()
      }));
      setSentRequests(sent);
    });

    let connTo = [];
    let connFrom = [];
    const unsubscribeConnectionsTo = onSnapshot(connectionsQueryTo, (snapshot) => {
      connTo = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        connectedAt: doc.data().connectedAt?.toDate?.() || new Date()
      }));
      setConnections([...connTo, ...connFrom]);
    });

    const unsubscribeConnectionsFrom = onSnapshot(connectionsQueryFrom, (snapshot) => {
      connFrom = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        connectedAt: doc.data().connectedAt?.toDate?.() || new Date()
      }));
      setConnections([...connTo, ...connFrom]);
    });

    setIsFetching(false);

    return () => {
      unsubscribeIncoming();
      unsubscribeSent();
      unsubscribeConnectionsTo();
      unsubscribeConnectionsFrom();
    };
  }, [authUser, loading, checkForNewUpdates]);

  // Enhanced AI Analysis
  const runAiAnalysis = useCallback(async () => {
    if (!authUser || !userProfile || allUsers.length === 0) return;

    setIsAiAnalyzing(true);
    try {
      const existingConnections = [...connectionRequests, ...sentRequests, ...connections];
      const existingUserIds = new Set(existingConnections.map(conn => 
        conn.fromUserId === authUser.uid ? conn.toUserId : conn.fromUserId
      ));

      const availableUsers = allUsers
        .filter(user => !existingUserIds.has(user.id))
        .slice(0, 25);

      if (availableUsers.length === 0) {
        setAiSuggestions([]);
        setIsAiAnalyzing(false);
        return;
      }

      const systemPrompt = `
        You are an advanced AI matchmaking assistant. Analyze the user's profile and available users to suggest the best potential connections.

        Return ONLY a valid JSON array with up to 6 user objects. No additional text or explanation.

        Required JSON format:
        [
          {
            "username": "exact_username_from_list",
            "reason": "Compelling reason for match (2-3 sentences highlighting specific compatibility)",
            "matchType": "professional/collaboration/interest/skill/complementary",
            "compatibilityScore": 85,
            "sharedInterests": ["interest1", "interest2"],
            "sharedSkills": ["skill1", "skill2"]
          }
        ]

        User Profile:
        - Username: ${userProfile.username || "User"}
        - Profession: ${userProfile.profession || "Not specified"}
        - Skills: ${userProfile.skills?.join(', ') || "No skills listed"}
        - Bio: ${userProfile.bio || "No bio available"}
        - Interests: ${userProfile.interests?.join(', ') || "No interests listed"}

        Available Users:
        ${availableUsers.map(user => 
          `- ${user.username || "Unknown"} | Profession: ${user.profession || "None"} | 
           Skills: ${user.skills?.join(', ') || "None"} | 
           Interests: ${user.interests?.join(', ') || "None"} | 
           Bio: ${user.bio?.substring(0, 100) || "No bio"}`
        ).join('\n')}

        Return ONLY the JSON array, nothing else.
      `;

      const { text } = await generateText({
        model: groqClient('openai/gpt-oss-120b'),
        system: systemPrompt,
        prompt: "Return ONLY a JSON array with user suggestions based on the analysis."
      });

      let cleanedText = text.trim();
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const jsonStart = cleanedText.indexOf('[');
      const jsonEnd = cleanedText.lastIndexOf(']') + 1;
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanedText = cleanedText.substring(jsonStart, jsonEnd);
      }

      try {
        const suggestions = JSON.parse(cleanedText);
        
        const matchedSuggestions = suggestions
          .map(suggestion => {
            if (!suggestion.username) return null;
            
            const matchedUser = availableUsers.find(user => 
              user.username?.toLowerCase() === suggestion.username?.toLowerCase()
            );
            
            if (!matchedUser) return null;

            let calculatedScore = suggestion.compatibilityScore || 50;
            if (suggestion.sharedInterests?.length > 2) calculatedScore += 10;
            if (suggestion.sharedSkills?.length > 1) calculatedScore += 10;
            calculatedScore = Math.min(calculatedScore, 95);

            return {
              ...matchedUser,
              ...suggestion,
              compatibilityScore: calculatedScore,
              isAiSuggestion: true,
              timestamp: new Date()
            };
          })
          .filter(Boolean)
          .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
          .slice(0, 6);

        setAiSuggestions(matchedSuggestions);
        
      } catch (parseError) {
        console.error("Error parsing AI suggestions:", parseError);
        const fallbackSuggestions = allUsers
          .map(user => {
            let compatibilityScore = 50;
            let reason = "Potential connection opportunity";
            let matchType = "general";
            const sharedInterests = [];
            const sharedSkills = [];

            if (userProfile.interests && user.interests) {
              sharedInterests.push(...user.interests.filter(interest => 
                userProfile.interests.includes(interest)
              ));
            }

            if (userProfile.skills && user.skills) {
              sharedSkills.push(...user.skills.filter(skill => 
                userProfile.skills.includes(skill)
              ));
            }

            if (user.profession === userProfile.profession) {
              compatibilityScore += 25;
              reason = `Same profession: ${user.profession}`;
              matchType = "professional";
            }

            if (sharedInterests.length > 0) {
              compatibilityScore += sharedInterests.length * 5;
              reason = `Shared interests: ${sharedInterests.join(', ')}`;
              matchType = "interest";
            }

            if (sharedSkills.length > 0) {
              compatibilityScore += sharedSkills.length * 3;
              reason = `Shared skills: ${sharedSkills.join(', ')}`;
              matchType = "skill";
            }

            compatibilityScore = Math.min(compatibilityScore, 90);

            return {
              ...user,
              isAiSuggestion: true,
              reason,
              matchType,
              compatibilityScore,
              sharedInterests,
              sharedSkills,
              timestamp: new Date()
            };
          })
          .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
          .slice(0, 5);

        setAiSuggestions(fallbackSuggestions);
      }

    } catch (error) {
      console.error("AI Analysis Error:", error);
      toast({
        title: "AI Analysis Failed",
        description: "Using fallback suggestions",
        status: "warning",
        duration: 3000,
      });
      
      const randomSuggestions = allUsers
        .sort(() => 0.5 - Math.random())
        .slice(0, 4)
        .map(user => ({
          ...user,
          isAiSuggestion: true,
          reason: "AI-suggested connection opportunity",
          matchType: "random",
          compatibilityScore: Math.floor(Math.random() * 30) + 50,
          timestamp: new Date()
        }));
      
      setAiSuggestions(randomSuggestions);
    } finally {
      setIsAiAnalyzing(false);
    }
  }, [authUser, userProfile, allUsers, connectionRequests, sentRequests, connections, toast]);

  // Enhanced connection request handling
  const handleAcceptConnection = async (connection) => {
    try {
      const offerRef = doc(firestore, "offers", connection.id);
      
      const chatRoomId = `chat_${connection.id}`;
      await updateDoc(offerRef, {
        toUserAccepted: true,
        status: "connected",
        connectedAt: new Date(),
        lastUpdated: new Date(),
        chatRoomId: chatRoomId
      });

      toast({
        title: "Connection Accepted!",
        description: `You are now connected with ${connection.fromUserName}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      updateLastChecked();

      setTimeout(() => {
        navigate(`/messages`);
      }, 1000);

    } catch (error) {
      console.error("Error accepting connection:", error);
      toast({
        title: "Error",
        description: "Failed to accept connection. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Enhanced connection request sending
  const sendConnectionRequest = async (targetUser, customMessage = null) => {
    if (!userProfile || !targetUser.id) {
      toast({
        title: "Error",
        description: "Cannot send connection request. Missing user data.",
        status: "error",
        duration: 3000,
      });
      return;
    }

    try {
      const offerId = `connection_${Date.now()}_${authUser.uid}_${targetUser.id}`;
      const offerRef = doc(firestore, "offers", offerId);
      
      const connectionData = {
        type: "connection_request",
        fromUserId: authUser.uid,
        fromUserName: userProfile.username || "User",
        fromUserProfession: userProfile.profession || "",
        fromUserBio: userProfile.bio || "", // INTRO FIELD
        fromUserProfilePic: userProfile.profilePicURL || "",
        fromUserSkills: userProfile.skills || [],
        fromUserInterests: userProfile.interests || [],
        
        toUserId: targetUser.id,
        toUserName: targetUser.username || "User",
        toUserProfession: targetUser.profession || "",
        toUserBio: targetUser.bio || "", // INTRO FIELD
        toUserProfilePic: targetUser.profilePicURL || "",
        toUserSkills: targetUser.skills || [],
        toUserInterests: targetUser.interests || [],
        
        userNeed: customMessage || `Interested in connecting about ${targetUser.profession || 'potential collaboration'}`,
        connectionReason: `AI-suggested connection based on profile compatibility`, // WHY CONNECT FIELD
        status: "pending",
        timestamp: new Date(),
        lastUpdated: new Date(),
        fromUserAccepted: true,
        toUserAccepted: false,
        chatRoomId: null,
        isAiSuggested: targetUser.isAiSuggested || false,

        name: `Connection: ${targetUser.username || 'User'}`,
        description: customMessage || `Interested in connecting with ${targetUser.username}`,
        contact: userProfile.email || "",
        offerType: "Connection",
        joins: [],
        userId: authUser.uid
      };

      await setDoc(offerRef, connectionData);

      toast({
        title: "Connection Request Sent!",
        description: `Request sent to ${targetUser.username}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      updateLastChecked();

      if (targetUser.isAiSuggestion) {
        setAiSuggestions(prev => 
          prev.filter(suggestion => suggestion.id !== targetUser.id)
        );
      }

    } catch (error) {
      console.error("Error sending connection request:", error);
      toast({
        title: "Error",
        description: "Failed to send connection request. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Decline connection request
  const handleDeclineConnection = async (connectionId) => {
    try {
      await deleteDoc(doc(firestore, "offers", connectionId));
      
      toast({
        title: "Request Declined",
        status: "info",
        duration: 2000,
        isClosable: true,
      });

      updateLastChecked();

    } catch (error) {
      console.error("Error declining connection:", error);
      toast({
        title: "Error",
        description: "Failed to decline request. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // View user profile
  const navigateToProfile = (username) => {
    if (username) navigate(`/${username}`);
  };

  // Enhanced match type colors
  const getMatchTypeColor = (matchType) => {
    switch (matchType) {
      case 'professional': return 'blue';
      case 'collaboration': return 'teal';
      case 'interest': return 'green';
      case 'skill': return 'orange';
      case 'complementary': return 'cyan';
      default: return 'gray';
    }
  };

  // Get compatibility color
  const getCompatibilityColor = (score) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'blue';
    if (score >= 40) return 'yellow';
    return 'red';
  };

  // FIXED: Connection Request Item with proper "Why Connect" and "Intro" display
  const ConnectionRequestItem = ({ connection }) => (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      bg={colors.cardBg}
      backdropFilter="blur(8px)"
      borderRadius="xl"
      p={4}
      boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
      _hover={{ transform: "translateY(-2px)", transition: "0.3s" }}
    >
      <Flex direction="column" gap={3}>
        <Flex align="center" gap={3}>
          <Avatar
            size={avatarSize}
            src={connection.fromUserProfilePic}
            name={connection.fromUserName}
            cursor="pointer"
            onClick={() => navigateToProfile(connection.fromUserName)}
          />
          <Box flex={1}>
            <Text
              fontWeight="bold"
              color={colors.text}
              fontSize="md"
              cursor="pointer"
              onClick={() => navigateToProfile(connection.fromUserName)}
            >
              {connection.fromUserName}
            </Text>
            <Text fontSize="sm" color={colors.secondaryText} mt={1}>
              {connection.fromUserProfession}
            </Text>
            <Text fontSize="sm" color="gray.300" mt={1} noOfLines={2}>
              {connection.userNeed}
            </Text>
          </Box>
        </Flex>
        
        {/* FIXED: Display Intro (Bio) */}
        {connection.fromUserBio && (
          <Box>
            <HStack mb={1}>
              <FiInfo size={14} color="#00B4D8" />
              <Text fontSize="sm" color="gray.200" fontWeight="semibold">
                Introduction:
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.400" noOfLines={4}>
              {connection.fromUserBio}
            </Text>
          </Box>
        )}
        
        {/* FIXED: Display Why Connect */}
        {connection.connectionReason && (
          <Box>
            <HStack mb={1}>
              <FiInfo size={14} color="#00B4D8" />
              <Text fontSize="sm" color="gray.200" fontWeight="semibold">
                Why Connect:
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.400" noOfLines={4}>
              {connection.connectionReason}
            </Text>
          </Box>
        )}
        
        <HStack justify="space-between" flexWrap="wrap" gap={2}>
          <HStack spacing={1} flexWrap="wrap">
            <Badge colorScheme={connection.isAiSuggested ? "blue" : "gray"} fontSize="xs">
              {connection.isAiSuggested ? "AI Suggested" : "Direct Request"}
            </Badge>
            {connection.matchScore && (
              <Badge colorScheme={getCompatibilityColor(connection.matchScore)} fontSize="xs">
                {connection.matchScore}% Match
              </Badge>
            )}
          </HStack>
          <HStack spacing={2}>
            <IconButton
              icon={<FiX />}
              colorScheme="red"
              variant="ghost"
              size="md"
              onClick={() => handleDeclineConnection(connection.id)}
              aria-label="Decline connection"
            />
            <Button
              size="md"
              bg={colors.gradient.primary}
              color={colors.text}
              _hover={{ bg: colors.gradient.hover }}
              onClick={() => handleAcceptConnection(connection)}
              leftIcon={<FiUserPlus />}
              minW="100px"
            >
              Accept
            </Button>
          </HStack>
        </HStack>
      </Flex>
    </MotionBox>
  );

  // AI Suggestion Item
  const AISuggestionItem = ({ suggestion, index }) => (
    <MotionBox
      key={suggestion.id || index}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      bg="rgba(0, 116, 232, 0.1)"
      backdropFilter="blur(8px)"
      borderRadius="xl"
      p={4}
      border="1px solid"
      borderColor={colors.primary[500]}
      boxShadow="0 4px 20px rgba(0, 116, 232, 0.2)"
      _hover={{ transform: "translateY(-2px)", transition: "0.3s" }}
    >
      <Flex direction="column" gap={3}>
        <Flex align="flex-start" gap={3}>
          <Avatar
            size={avatarSize}
            src={suggestion.profilePicURL}
            name={suggestion.username || "User"}
            cursor="pointer"
            onClick={() => navigateToProfile(suggestion.username)}
          />
          <Box flex={1}>
            <VStack align="start" spacing={1} mb={2}>
              <Text fontWeight="bold" color={colors.text} fontSize="md">
                {suggestion.username || "Unknown User"}
              </Text>
              <HStack spacing={2} flexWrap="wrap">
                <Badge colorScheme={getMatchTypeColor(suggestion.matchType)} fontSize="xs">
                  {suggestion.matchType}
                </Badge>
                <Badge colorScheme={getCompatibilityColor(suggestion.compatibilityScore)} fontSize="xs">
                  {suggestion.compatibilityScore}%
                </Badge>
              </HStack>
            </VStack>
            <Text fontSize="sm" color={colors.secondaryText}>
              {suggestion.profession || "No profession"}
            </Text>
            {/* FIXED: Display user bio as intro */}
            {suggestion.bio && (
              <Box mt={2}>
                <Text fontSize="sm" color="gray.200" fontWeight="semibold" mb={1}>
                  About:
                </Text>
                <Text fontSize="sm" color="gray.400" noOfLines={3}>
                  {suggestion.bio}
                </Text>
              </Box>
            )}
            <Text fontSize="sm" color={colors.primary[300]} mt={2} noOfLines={3}>
              {suggestion.reason}
            </Text>
          </Box>
        </Flex>
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
          {(suggestion.sharedInterests?.length > 0 || suggestion.sharedSkills?.length > 0) && (
            <HStack spacing={2} flexWrap="wrap" flex={1}>
              {suggestion.sharedInterests?.slice(0, 2).map((interest, i) => (
                <Badge key={i} colorScheme="green" fontSize="xs">
                  {interest}
                </Badge>
              ))}
              {suggestion.sharedSkills?.slice(0, 2).map((skill, i) => (
                <Badge key={i} colorScheme="blue" fontSize="xs">
                  {skill}
                </Badge>
              ))}
            </HStack>
          )}
          <Button
            size="md"
            bg={colors.gradient.primary}
            color={colors.text}
            _hover={{ bg: colors.gradient.hover }}
            onClick={() => sendConnectionRequest(suggestion)}
            isDisabled={!suggestion.id}
            leftIcon={<FiSend />}
            minW="100px"
          >
            Connect
          </Button>
        </Flex>
      </Flex>
    </MotionBox>
  );

  // Sent Request Item
  const SentRequestItem = ({ request }) => (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      bg={colors.cardBg}
      borderRadius="xl"
      p={4}
      boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
      _hover={{ transform: "translateY(-2px)", transition: "0.3s" }}
    >
      <Flex direction="column" gap={2}>
        <Flex align="center" gap={3}>
          <Avatar
            size={avatarSize}
            src={request.toUserProfilePic}
            name={request.toUserName}
          />
          <Box flex={1}>
            <Text fontWeight="bold" color={colors.text} fontSize="md">
              {request.toUserName}
            </Text>
            <Text fontSize="sm" color={colors.secondaryText}>
              {request.toUserProfession}
            </Text>
            {/* FIXED: Display connection reason for sent requests */}
            {request.connectionReason && (
              <Text fontSize="sm" color="gray.400" mt={1} noOfLines={2}>
                {request.connectionReason}
              </Text>
            )}
          </Box>
        </Flex>
        <Flex justify="space-between" align="center">
          <Text fontSize="sm" color="gray.500">
            Sent {request.timestamp?.toLocaleDateString?.() || new Date().toLocaleDateString()}
          </Text>
          <HStack spacing={2}>
            <Badge colorScheme="yellow" fontSize="xs">
              Pending
            </Badge>
            <IconButton
              icon={<FiX />}
              colorScheme="red"
              variant="ghost"
              size="md"
              onClick={() => handleDeclineConnection(request.id)}
              aria-label="Cancel request"
            />
          </HStack>
        </Flex>
      </Flex>
    </MotionBox>
  );

  // Connection Item
 // In your NotificationsPage.js, update the ConnectionItem component:

const ConnectionItem = ({ connection }) => {
  const isFromMe = connection.fromUserId === authUser.uid;
  const otherUser = isFromMe ? {
    name: connection.toUserName,
    profession: connection.toUserProfession,
    profilePic: connection.toUserProfilePic,
    username: connection.toUserName,
    bio: connection.toUserBio
  } : {
    name: connection.fromUserName,
    profession: connection.fromUserProfession,
    profilePic: connection.fromUserProfilePic,
    username: connection.fromUserName,
    bio: connection.fromUserBio
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      bg={colors.cardBg}
      borderRadius="xl"
      p={4}
      boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
      _hover={{ transform: "translateY(-2px)", transition: "0.3s" }}
    >
      <Flex direction="column" gap={2}>
        <Flex align="center" gap={3}>
          <Avatar
            size={avatarSize}
            src={otherUser.profilePic}
            name={otherUser.name}
            cursor="pointer"
            onClick={() => navigateToProfile(otherUser.username)}
          />
          <Box flex={1}>
            <Text 
              fontWeight="bold" 
              color={colors.text} 
              fontSize="md" 
              cursor="pointer" 
              onClick={() => navigateToProfile(otherUser.username)}
            >
              {otherUser.name}
            </Text>
            <Text fontSize="sm" color={colors.secondaryText}>
              {otherUser.profession}
            </Text>
            {otherUser.bio && (
              <Text fontSize="sm" color="gray.400" mt={1} noOfLines={2}>
                {otherUser.bio}
              </Text>
            )}
          </Box>
        </Flex>
        <Flex justify="space-between" align="center">
          <Text fontSize="sm" color="gray.500">
            Connected {connection.connectedAt?.toLocaleDateString?.() || new Date().toLocaleDateString()}
          </Text>
          <Button
            size="sm"
            variant="outline"
            colorScheme="blue"
            leftIcon={<FiMessageCircle size={14} />}
            onClick={() => {
              if (connection.chatRoomId) {
                // FIXED: Navigate to the specific chat room
                navigate(`/messages/${connection.chatRoomId}`);
              } else {
                // Fallback: navigate to messages and let it handle the chat
                navigate('/messages');
              }
            }}
          >
            Message
          </Button>
        </Flex>
      </Flex>
    </MotionBox>
  );
};

  // Tab configuration
  const tabData = [
    { 
      key: 'requests', 
      label: 'Requests', 
      icon: FiUserPlus, 
      count: connectionRequests.length,
      color: 'red'
    },
    { 
      key: 'suggestions', 
      label: 'AI', 
      icon: FiTrendingUp, 
      count: aiSuggestions.length,
      color: 'green'
    },
    { 
      key: 'sent', 
      label: 'Sent', 
      icon: FiSend, 
      count: sentRequests.length,
      color: 'blue'
    },
    { 
      key: 'connections', 
      label: 'Connections', 
      icon: FiCheck, 
      count: connections.length,
      color: 'green'
    },
  ];

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="50vh">
        <Spinner size="xl" color={colors.primary[400]} />
      </Flex>
    );
  }

  if (!authUser) {
    return (
      <Alert status="warning" borderRadius="lg" bg="orange.50">
        <AlertIcon />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          Please log in to view notifications and connections.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Container 
      maxW="container.lg" 
      py={0}
      px={containerPadding} 
      overflow="hidden" 
      bg={colors.bg} 
      color={colors.text}
      minH="100vh"
    >
      <MotionBox 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.6 }}
        pt={0}
      >
        <Tabs 
          colorScheme="blue" 
          variant="soft-rounded" 
          index={activeTab} 
          onChange={setActiveTab}
          isFitted
        >
          {/* Fixed header */}
          <Box 
            position="sticky" 
            top="0" 
            zIndex="1000" 
            bg={colors.bg} 
            pb={2} 
            pt={0}
          >
            <Flex justify="space-between" align="center" mb={2}>
              <Text 
                fontSize={{ base: "xl", md: "2xl" }} 
                fontWeight="bold" 
                color={colors.primary[300]}
              >
                Notifications
                {hasNewUpdates && (
                  <Badge 
                    ml={2} 
                    colorScheme="red" 
                    variant="solid"
                    borderRadius="full"
                    animation="pulse 1.5s infinite"
                  >
                    New
                  </Badge>
                )}
              </Text>
            </Flex>
            <TabList 
              bg={colors.cardBg}
              borderRadius="lg"
              p={1}
              gap={1}
              overflowX="auto"
              mb={2}
              sx={{
                "&::-webkit-scrollbar": {
                  display: "none",
                },
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              {tabData.map((tab) => (
                <Tab 
                  key={tab.key}
                  _selected={{ bg: colors.primary[500], color: "white" }} 
                  bg={colors.cardBg}
                  color="gray.300"
                  _hover={{ color: "white" }}
                  fontSize={tabFontSize}
                  whiteSpace="nowrap"
                  px={tabPx}
                  py={2}
                  flex="1"
                  borderRadius="md"
                >
                  <HStack spacing={1}>
                    <tab.icon size={16} />
                    <Text>{tab.label}</Text>
                    {tab.count > 0 && (
                      <Badge 
                        colorScheme={tab.color} 
                        borderRadius="full" 
                        fontSize="2xs"
                        minW="4"
                        h="4"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {tab.count}
                      </Badge>
                    )}
                  </HStack>
                </Tab>
              ))}
            </TabList>
            <Flex justify="end">
              <Tooltip label="Refresh AI Suggestions">
                <IconButton
                  icon={<FiRefreshCw />}
                  onClick={runAiAnalysis}
                  isLoading={isAiAnalyzing}
                  aria-label="Refresh suggestions"
                  borderRadius="full"
                  size="md"
                  bg={colors.primary[500]}
                  _hover={{ bg: colors.primary[600] }}
                />
              </Tooltip>
            </Flex>
          </Box>

          <TabPanels mt={4}>
            {/* Connection Requests Tab */}
            <TabPanel px={0} py={0}>
              {isFetching ? (
                <VStack spacing={6} align="stretch">
                  {[...Array(3)].map((_, i) => (
                    <Box key={i} bg={colors.cardBg} borderRadius="xl" p={4} height="120px" />
                  ))}
                </VStack>
              ) : connectionRequests.length === 0 ? (
                <Box textAlign="center" py={12} color={colors.secondaryText}>
                  <Text fontSize="xl" mb={2}>Chat with Mira</Text>
                  <Text fontSize="lg">Requests will appear here when received</Text>
                </Box>
              ) : (
                <VStack spacing={6} align="stretch">
                  {connectionRequests.map((connection) => (
                    <ConnectionRequestItem key={connection.id} connection={connection} />
                  ))}
                </VStack>
              )}
            </TabPanel>

            {/* AI Suggestions Tab */}
            <TabPanel px={0} py={0}>
              {isAiAnalyzing ? (
                <Box textAlign="center" py={12}>
                  <Spinner size="lg" color={colors.primary[400]} mb={4} />
                  <Text color={colors.secondaryText} fontSize="lg">
                    Analyzing potential connections...
                  </Text>
                </Box>
              ) : aiSuggestions.length === 0 ? (
                <Box textAlign="center" py={12} color={colors.secondaryText}>
                  <Text fontSize="xl" mb={2}>No AI suggestions yet</Text>
                  <Text mb={4} fontSize="lg">Complete your profile for better matches</Text>
                  <Button
                    bg={colors.gradient.primary}
                    color={colors.text}
                    _hover={{ bg: colors.gradient.hover }}
                    onClick={runAiAnalysis}
                    leftIcon={<FiRefreshCw />}
                    size="lg"
                  >
                    Generate Suggestions
                  </Button>
                </Box>
              ) : (
                <VStack spacing={6} align="stretch">
                  {aiSuggestions.map((suggestion, index) => (
                    <AISuggestionItem key={suggestion.id || index} suggestion={suggestion} index={index} />
                  ))}
                </VStack>
              )}
            </TabPanel>

            {/* Sent Requests Tab */}
            <TabPanel px={0} py={0}>
              {sentRequests.length === 0 ? (
                <Box textAlign="center" py={12} color={colors.secondaryText}>
                  <Text fontSize="xl" mb={2}>No sent requests</Text>
                  <Text fontSize="lg">Your pending requests will appear here</Text>
                </Box>
              ) : (
                <VStack spacing={6} align="stretch">
                  {sentRequests.map((request) => (
                    <SentRequestItem key={request.id} request={request} />
                  ))}
                </VStack>
              )}
            </TabPanel>

            {/* Connections Tab */}
            <TabPanel px={0} py={0}>
              {connections.length === 0 ? (
                <Box textAlign="center" py={12} color={colors.secondaryText}>
                  <Text fontSize="xl" mb={2}>No connections yet</Text>
                  <Text fontSize="lg">Build your network to see connections here</Text>
                </Box>
              ) : (
                <VStack spacing={6} align="stretch">
                  {connections.map((connection) => (
                    <ConnectionItem key={connection.id} connection={connection} />
                  ))}
                </VStack>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </MotionBox>
    </Container>
  );
};

export default NotificationsPage;