import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flex,
  Box,
  Text,
  Input,
  Button,
  IconButton,
  useToast,
  Image,
  Avatar,
  Spinner,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  Badge,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { ArrowForwardIcon, SearchIcon, DeleteIcon } from "@chakra-ui/icons";
import { FaMicrophone, FaSmile, FaEllipsisV } from "react-icons/fa";
import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { firestore, auth } from "./../firebase/firebase";
import { 
  doc, 
  setDoc, 
  updateDoc,
  serverTimestamp, 
  collection, 
  onSnapshot,
  query,
  where,
  getDocs,
  arrayUnion,
} from "firebase/firestore";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import EmojiPicker from 'emoji-picker-react';
import { motion } from 'framer-motion';
import { useAuthState } from "react-firebase-hooks/auth";

const groqClient = createGroq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
});

const MotionButton = motion(Button);
const MotionFlex = motion(Flex);

const ChatbotPage = () => {
  const [authUser, loading] = useAuthState(auth);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [users, setUsers] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [conversationContext, setConversationContext] = useState({
    userInterests: [],
    userGoals: [],
    userSkills: [],
    conversationHistory: []
  });
  const [existingConnections, setExistingConnections] = useState(new Set());
  const [isSendingConnections, setIsSendingConnections] = useState(false);
  const [connectionStats, setConnectionStats] = useState({ sent: 0, total: 0 });
  const navigate = useNavigate();
  const toast = useToast();
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Theme colors
  const bgColor = "black";
  const textColor = "white";
  const secondaryTextColor = "gray.400";
  const cardBg = "rgba(255, 255, 255, 0.02)";
  const cardBorder = "rgba(255, 255, 255, 0.08)";
  const inputBg = "rgba(255, 255, 255, 0.05)";
  const inputBorder = "rgba(255, 255, 255, 0.15)";
  const buttonBg = "blue.500";

  // Cycling placeholders
  const placeholders = [
    "connect me with professors working in llm",
    "connect me with students who are interested in drones",
    "connect me with startup founder in nitd",
    "connect me with alumni",
    "looking for a web developer for my project",
    "need help with marketing strategy",
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Load conversation from localStorage on component mount
  useEffect(() => {
    if (authUser) {
      const savedMessages = localStorage.getItem(`chatbot_messages_${authUser.uid}`);
      const savedContext = localStorage.getItem(`chatbot_context_${authUser.uid}`);
      
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          // Convert timestamp strings back to Date objects
          const messagesWithDates = parsedMessages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messagesWithDates);
        } catch (error) {
          console.error("Error loading saved messages:", error);
          // Initialize with welcome message if loading fails
          setMessages([{
            sender: "bot",
            text: "Hi, I'm your AI friend! I'm here to help you connect with amazing people. Tell me about yourself and what you're looking for, and I'll find the perfect matches for you!",
            timestamp: new Date(),
          }]);
        }
      } else {
        // Initialize with welcome message if no saved messages
        setMessages([{
          sender: "bot",
          text: "Hi, I'm your AI friend! I'm here to help you connect with amazing people. Tell me about yourself and what you're looking for, and I'll find the perfect matches for you!",
          timestamp: new Date(),
        }]);
      }

      if (savedContext) {
        try {
          const parsedContext = JSON.parse(savedContext);
          setConversationContext(parsedContext);
        } catch (error) {
          console.error("Error loading saved context:", error);
        }
      }
    }
  }, [authUser]);

  // Save conversation to localStorage whenever messages or context change
  useEffect(() => {
    if (authUser && messages.length > 0) {
      localStorage.setItem(`chatbot_messages_${authUser.uid}`, JSON.stringify(messages));
    }
  }, [messages, authUser]);

  useEffect(() => {
    if (authUser) {
      localStorage.setItem(`chatbot_context_${authUser.uid}`, JSON.stringify(conversationContext));
    }
  }, [conversationContext, authUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  // Fetch user profile, all users, and existing connections
  useEffect(() => {
    if (!authUser) return;

    // Fetch current user profile
    const userRef = doc(firestore, "users", authUser.uid);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const profile = doc.data();
        setUserProfile(profile);
        // Initialize conversation context with user profile
        setConversationContext(prev => ({
          ...prev,
          userInterests: profile.interests || [],
          userSkills: profile.skills || [],
          userGoals: profile.goals || []
        }));
      }
    });

    // Fetch all users for matching
    const usersRef = collection(firestore, "users");
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const usersData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.id !== authUser.uid);
      setUsers(usersData);
      console.log("Available users for matching:", usersData.length);
    });

    // Fetch existing connections to prevent duplicates
    const fetchExistingConnections = async () => {
      try {
        const offersRef = collection(firestore, "offers");
        const connectionQuery = query(
          offersRef,
          where("fromUserId", "==", authUser.uid),
          where("type", "==", "connection_request")
        );
        
        const snapshot = await getDocs(connectionQuery);
        const connections = new Set();
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.toUserId) {
            connections.add(data.toUserId);
          }
        });
        setExistingConnections(connections);
        console.log("Existing connections:", connections.size);
      } catch (error) {
        console.error("Error fetching existing connections:", error);
      }
    };

    fetchExistingConnections();

    return () => {
      unsubscribeUser();
      unsubscribeUsers();
    };
  }, [authUser]);

  // Update user's AI chat history and summary in Firestore
  const updateUserAIData = async (newMessage, isUserMessage = false) => {
    if (!authUser) return;

    try {
      const userRef = doc(firestore, "users", authUser.uid);
      
      // Prepare chat history entry - use regular Date instead of serverTimestamp for arrayUnion
      const chatEntry = {
        sender: isUserMessage ? "user" : "ai",
        text: newMessage,
        timestamp: new Date().toISOString(), // Use ISO string instead of serverTimestamp
      };

      // Update AI chat history
      await updateDoc(userRef, {
        aichathistory: arrayUnion(chatEntry),
        lastAIChatUpdate: serverTimestamp(), // serverTimestamp can be used here for the field update
      });

      // Update AI summary if it's a user message with substantial content
      if (isUserMessage && newMessage.length > 10) {
        await updateAISummary(newMessage);
      }
    } catch (error) {
      console.error("Error updating user AI data:", error);
    }
  };

  // Update AI summary based on user messages
  const updateAISummary = async (userMessage) => {
    if (!authUser) return;

    try {
      const userRef = doc(firestore, "users", authUser.uid);
      const currentSummary = userProfile?.aisummary || {
        interests: [],
        goals: [],
        skills: [],
        seekingHelpWith: [],
        wantingToHelpWith: [],
        connectionPreferences: [],
        lastUpdated: new Date().toISOString(),
      };

      // Extract information from user message
      const extractedInfo = extractSummaryInfo(userMessage, currentSummary);
      
      // Update the AI summary
      await updateDoc(userRef, {
        aisummary: {
          ...extractedInfo,
          lastUpdated: new Date().toISOString(), // Use ISO string instead of serverTimestamp
        },
      });

    } catch (error) {
      console.error("Error updating AI summary:", error);
    }
  };

  // Enhanced information extraction for AI summary
  const extractSummaryInfo = (userMessage, currentSummary) => {
    const message = userMessage.toLowerCase();
    const newSummary = { ...currentSummary };

    // Enhanced interest extraction
    const interestPatterns = {
      technology: ['tech', 'programming', 'coding', 'software', 'ai', 'ml', 'llm', 'computer', 'developer', 'engineer'],
      business: ['business', 'startup', 'entrepreneur', 'marketing', 'finance', 'investment', 'venture', 'funding'],
      education: ['study', 'learn', 'education', 'university', 'college', 'professor', 'student', 'research', 'academic'],
      creative: ['art', 'design', 'music', 'writing', 'creative', 'photography', 'film', 'content creation'],
      science: ['research', 'science', 'engineering', 'physics', 'chemistry', 'biology', 'data science', 'analysis']
    };

    // Extract and update interests
    Object.entries(interestPatterns).forEach(([category, keywords]) => {
      if (keywords.some(keyword => message.includes(keyword)) && !newSummary.interests.includes(category)) {
        newSummary.interests.push(category);
      }
    });

    // Extract skills
    const skillKeywords = [
      'javascript', 'python', 'react', 'node', 'web development', 'mobile development', 'frontend', 'backend',
      'design', 'ui/ux', 'graphic design', 'marketing', 'sales', 'writing', 'research', 'data analysis',
      'machine learning', 'ai development', 'project management', 'leadership', 'communication'
    ];

    skillKeywords.forEach(skill => {
      if (message.includes(skill) && !newSummary.skills.includes(skill)) {
        newSummary.skills.push(skill);
      }
    });

    // Extract goals
    const goalPatterns = [
      { pattern: 'learn', context: 5 },
      { pattern: 'build', context: 5 },
      { pattern: 'create', context: 5 },
      { pattern: 'start', context: 5 },
      { pattern: 'achieve', context: 5 },
      { pattern: 'become', context: 3 },
      { pattern: 'want to', context: 5 }
    ];

    goalPatterns.forEach(({ pattern, context }) => {
      if (message.includes(pattern)) {
        const goalText = extractContext(message, pattern, context);
        if (goalText && !newSummary.goals.includes(goalText)) {
          newSummary.goals.push(goalText);
        }
      }
    });

    // Extract seeking help with
    const helpSeekingPatterns = [
      'need help with', 'looking for help with', 'want help with', 'seeking assistance with',
      'need guidance on', 'looking for guidance on', 'want to learn about'
    ];

    helpSeekingPatterns.forEach(pattern => {
      if (message.includes(pattern)) {
        const helpText = extractContext(message, pattern, 5);
        if (helpText && !newSummary.seekingHelpWith.includes(helpText)) {
          newSummary.seekingHelpWith.push(helpText);
        }
      }
    });

    // Extract wanting to help with
    const helpingPatterns = [
      'can help with', 'want to help with', 'able to assist with', 'can teach', 'want to mentor',
      'expert in', 'experienced in', 'knowledgeable about'
    ];

    helpingPatterns.forEach(pattern => {
      if (message.includes(pattern)) {
        const helpText = extractContext(message, pattern, 5);
        if (helpText && !newSummary.wantingToHelpWith.includes(helpText)) {
          newSummary.wantingToHelpWith.push(helpText);
        }
      }
    });

    // Extract connection preferences
    const connectionPatterns = [
      'connect with', 'looking for', 'want to meet', 'interested in connecting with',
      'searching for', 'find someone who', 'looking to connect with'
    ];

    connectionPatterns.forEach(pattern => {
      if (message.includes(pattern)) {
        const connectionText = extractContext(message, pattern, 5);
        if (connectionText && !newSummary.connectionPreferences.includes(connectionText)) {
          newSummary.connectionPreferences.push(connectionText);
        }
      }
    });

    // Limit arrays to prevent infinite growth
    const limitArray = (arr, max = 10) => arr.slice(-max);
    newSummary.interests = limitArray(newSummary.interests);
    newSummary.skills = limitArray(newSummary.skills);
    newSummary.goals = limitArray(newSummary.goals);
    newSummary.seekingHelpWith = limitArray(newSummary.seekingHelpWith);
    newSummary.wantingToHelpWith = limitArray(newSummary.wantingToHelpWith);
    newSummary.connectionPreferences = limitArray(newSummary.connectionPreferences);

    return newSummary;
  };

  // Helper function to extract context around a pattern
  const extractContext = (text, pattern, wordCount) => {
    const patternIndex = text.indexOf(pattern);
    if (patternIndex === -1) return null;
    
    const start = Math.max(0, patternIndex - 20);
    const end = Math.min(text.length, patternIndex + pattern.length + wordCount * 10);
    const context = text.substring(start, end).trim();
    
    return context.length > 5 ? context : null;
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Voice recognition setup
  useEffect(() => {
    if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      console.warn("Speech recognition not supported");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserInput((prev) => prev + transcript);
    };
    recognitionRef.current.onend = () => setIsVoiceActive(false);
    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      toast({
        title: "Voice Input Error",
        description: "Something went wrong with voice recognition. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setIsVoiceActive(false);
    };
  }, [toast]);

  const toggleVoice = () => {
    if (isVoiceActive) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsVoiceActive(true);
      } catch (error) {
        console.error("Error starting voice recognition:", error);
        toast({
          title: "Voice Input Failed",
          description: "Unable to start voice recognition. Check permissions.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleEmojiClick = (emoji) => {
    setUserInput((prev) => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  // Clear conversation
  const clearConversation = async () => {
    setMessages([{
      sender: "bot",
      text: "Hi, I'm your AI friend! I'm here to help you connect with amazing people. Tell me about yourself and what you're looking for, and I'll find the perfect matches for you!",
      timestamp: new Date(),
    }]);
    setConversationContext({
      userInterests: userProfile?.interests || [],
      userSkills: userProfile?.skills || [],
      userGoals: userProfile?.goals || [],
      conversationHistory: []
    });
    
    // Also clear the AI chat history in Firestore
    if (authUser) {
      try {
        const userRef = doc(firestore, "users", authUser.uid);
        await updateDoc(userRef, {
          aichathistory: [],
          lastAIChatUpdate: serverTimestamp(),
        });
      } catch (error) {
        console.error("Error clearing AI chat history:", error);
      }
    }

    toast({
      title: "Conversation Cleared",
      description: "Starting a fresh conversation",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  // Enhanced user understanding and context extraction
  const extractUserContext = (userMessage, currentContext) => {
    const newContext = { ...currentContext };
    
    // Extract interests
    const interestKeywords = {
      technology: ['tech', 'programming', 'coding', 'software', 'ai', 'ml', 'llm', 'computer'],
      business: ['business', 'startup', 'entrepreneur', 'marketing', 'finance', 'investment'],
      education: ['study', 'learn', 'education', 'university', 'college', 'professor', 'student'],
      creative: ['art', 'design', 'music', 'writing', 'creative', 'photography'],
      science: ['research', 'science', 'engineering', 'physics', 'chemistry', 'biology']
    };

    // Extract skills
    const skillKeywords = [
      'javascript', 'python', 'react', 'node', 'web development', 'mobile development',
      'design', 'ui/ux', 'marketing', 'sales', 'writing', 'research', 'data analysis'
    ];

    // Extract goals
    const goalKeywords = [
      'learn', 'build', 'create', 'start', 'find', 'connect', 'collaborate', 
      'help', 'mentor', 'study', 'work', 'project'
    ];

    const message = userMessage.toLowerCase();

    // Update interests
    Object.entries(interestKeywords).forEach(([category, keywords]) => {
      if (keywords.some(keyword => message.includes(keyword))) {
        if (!newContext.userInterests.includes(category)) {
          newContext.userInterests.push(category);
        }
      }
    });

    // Update skills
    skillKeywords.forEach(skill => {
      if (message.includes(skill) && !newContext.userSkills.includes(skill)) {
        newContext.userSkills.push(skill);
      }
    });

    // Update goals
    goalKeywords.forEach(goal => {
      if (message.includes(goal)) {
        const goalPhrase = message.split(goal)[1]?.split('.')[0]?.split(' ').slice(0, 5).join(' ');
        if (goalPhrase && !newContext.userGoals.includes(goalPhrase.trim())) {
          newContext.userGoals.push(goalPhrase.trim());
        }
      }
    });

    // Update conversation history
    newContext.conversationHistory = [
      ...currentContext.conversationHistory.slice(-9), // Keep last 10 messages
      { role: 'user', content: userMessage, timestamp: new Date() }
    ];

    return newContext;
  };

  // FIXED: Enhanced connection request system with proper matching and real counts
  const sendConnectionRequests = async (userNeed) => {
    if (isSendingConnections) {
      console.log("Already sending connections, skipping...");
      return 0;
    }
    
    setIsSendingConnections(true);
    setConnectionStats({ sent: 0, total: 0 });
    
    try {
      if (!userProfile) {
        console.error("User profile not loaded");
        toast({
          title: "Profile Not Loaded",
          description: "Please wait for your profile to load",
          status: "warning",
          duration: 3000,
        });
        return 0;
      }

      console.log("Starting connection search for:", userNeed);
      console.log("Available users:", users.length);
      console.log("Existing connections:", existingConnections.size);

      // Use AI summary for better matching if available
      const aiSummary = userProfile.aisummary || {};
      const matchContext = {
        interests: [...conversationContext.userInterests, ...(aiSummary.interests || [])],
        skills: [...conversationContext.userSkills, ...(aiSummary.skills || [])],
        goals: [...conversationContext.userGoals, ...(aiSummary.goals || [])],
        connectionPreferences: aiSummary.connectionPreferences || []
      };

      // Find ALL potential matches based on user's need and context
      const potentialMatches = users.filter(user => {
        // Skip if already connected
        if (existingConnections.has(user.id)) {
          console.log(`Skipping ${user.username} - already connected`);
          return false;
        }

        const searchText = [
          user.profession || '',
          user.skills?.join(' ') || '',
          user.bio || '',
          user.interests?.join(' ') || '',
          user.expertise || '',
          user.aisummary?.skills?.join(' ') || '',
          user.aisummary?.interests?.join(' ') || '',
          user.goals?.join(' ') || '',
          user.aisummary?.goals?.join(' ') || ''
        ].join(' ').toLowerCase();
        
        const needWords = userNeed.toLowerCase().split(' ').filter(word => word.length > 2);
        
        // Check direct keyword matches with higher sensitivity
        const keywordMatch = needWords.some(word => searchText.includes(word));
        
        // Enhanced context-based matching
        const contextMatch = 
          matchContext.interests.some(interest => 
            user.interests?.includes(interest) || 
            user.profession?.toLowerCase().includes(interest) ||
            user.aisummary?.interests?.includes(interest) ||
            user.bio?.toLowerCase().includes(interest)
          ) ||
          matchContext.skills.some(skill =>
            user.skills?.includes(skill) ||
            user.aisummary?.skills?.includes(skill) ||
            user.profession?.toLowerCase().includes(skill)
          ) ||
          matchContext.goals.some(goal =>
            user.bio?.toLowerCase().includes(goal) ||
            user.aisummary?.goals?.some(userGoal => userGoal.toLowerCase().includes(goal)) ||
            user.goals?.some(userGoal => userGoal.toLowerCase().includes(goal))
          );

        // Calculate match score for filtering
        const matchScore = calculateMatchScore(userProfile, user, userNeed, matchContext);
        
        // Include if there's any match and score is above threshold
        const shouldInclude = (keywordMatch || contextMatch) && matchScore > 10;
        
        if (shouldInclude) {
          console.log(`Matched with ${user.username} - Score: ${matchScore}`);
        }
        
        return shouldInclude;
      });

      console.log("Potential matches found:", potentialMatches.length);

      if (potentialMatches.length === 0) {
        toast({
          title: "No Matches Found",
          description: "I couldn't find any matching users. Try adding more details to your profile!",
          status: "info",
          duration: 4000,
        });
        return 0;
      }

      let successfulRequests = 0;
      setConnectionStats({ sent: 0, total: potentialMatches.length });

      // Show initial toast
      toast({
        title: "🔍 Finding Matches",
        description: `Found ${potentialMatches.length} potential connections...`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });

      // Create connection requests for ALL potential matches
      for (const match of potentialMatches) {
        try {
          // Double-check if connection already exists to prevent duplicates
          const connectionCheckQuery = query(
            collection(firestore, "offers"),
            where("fromUserId", "==", authUser.uid),
            where("toUserId", "==", match.id),
            where("type", "==", "connection_request")
          );
          
          const existingConnectionsSnapshot = await getDocs(connectionCheckQuery);
          
          if (!existingConnectionsSnapshot.empty) {
            console.log(`Connection already exists with user ${match.username}`);
            continue;
          }

          const offerId = `connection_${Date.now()}_${authUser.uid}_${match.id}`;
          const offerRef = doc(firestore, "offers", offerId);
          
          const matchScore = calculateMatchScore(userProfile, match, userNeed, matchContext);
          
          await setDoc(offerRef, {
            // Connection data
            type: "connection_request",
            fromUserId: authUser.uid,
            fromUserName: userProfile.username || "Unknown User",
            fromUserProfession: userProfile.profession || "",
            fromUserBio: userProfile.bio || "",
            fromUserProfilePic: userProfile.profilePicURL || "",
            fromUserInterests: matchContext.interests,
            fromUserSkills: matchContext.skills,
            fromUserAISummary: aiSummary,
            
            toUserId: match.id,
            toUserName: match.username || "Unknown User",
            toUserProfession: match.profession || "",
            toUserBio: match.bio || "",
            toUserProfilePic: match.profilePicURL || "",
            toUserInterests: match.interests || [],
            toUserSkills: match.skills || [],
            toUserAISummary: match.aisummary || {},
            
            // Request details
            userNeed: userNeed,
            aiContext: matchContext.goals.slice(0, 3),
            status: "pending",
            timestamp: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            fromUserAccepted: false,
            toUserAccepted: false,
            chatRoomId: null,
            isAiSuggested: true,
            matchScore: matchScore,

            // Offer collection required fields
            name: `AI Connection: ${userProfile.username} → ${match.username}`,
            description: `${userProfile.username} wants to connect: ${userNeed.substring(0, 100)}...`,
            contact: userProfile.email || "",
            offerType: "AI_Connection",
            joins: [],
            userId: authUser.uid
          });

          // Add to existing connections to prevent duplicates in this session
          setExistingConnections(prev => new Set([...prev, match.id]));
          successfulRequests++;
          setConnectionStats(prev => ({ ...prev, sent: successfulRequests }));

          console.log(`✅ Connection sent to ${match.username}`);

          // Show individual connection toast
          toast({
            title: "Connection Sent",
            description: `Sent to ${match.username}`,
            status: "success",
            duration: 1500,
            isClosable: true,
          });

          // Small delay to prevent overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
          console.error(`❌ Failed to create connection for user ${match.username}:`, error);
        }
      }

      // Final success toast
      if (successfulRequests > 0) {
        toast({
          title: "🎉 Connections Sent!",
          description: `Successfully sent ${successfulRequests} connection requests!`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "No New Connections",
          description: "All potential matches already have connection requests.",
          status: "info",
          duration: 4000,
        });
      }

      console.log(`Total connections sent: ${successfulRequests}`);
      return successfulRequests;
    } catch (error) {
      console.error("Error sending connection requests:", error);
      toast({
        title: "Connection Error",
        description: "Failed to send connection requests. Please try again.",
        status: "error",
        duration: 3000,
      });
      return 0;
    } finally {
      setIsSendingConnections(false);
      setConnectionStats({ sent: 0, total: 0 });
    }
  };

  // Enhanced match score calculation
  const calculateMatchScore = (user1, user2, userNeed, matchContext) => {
    let score = 0;
    
    // Profession match (strong weight)
    if (user1.profession && user2.profession && 
        user1.profession.toLowerCase() === user2.profession.toLowerCase()) {
      score += 40;
    }
    
    // Skills match
    const commonSkills = matchContext.skills.filter(skill => 
      user2.skills?.includes(skill) || user2.aisummary?.skills?.includes(skill)
    ).length;
    score += commonSkills * 15;
    
    // Interests match
    const commonInterests = matchContext.interests.filter(interest => 
      user2.interests?.includes(interest) || user2.aisummary?.interests?.includes(interest)
    ).length;
    score += commonInterests * 10;
    
    // Bio keyword match with user need
    const needWords = userNeed.toLowerCase().split(' ').filter(word => word.length > 3);
    const bioMatch = needWords.filter(word => 
      user2.bio?.toLowerCase().includes(word) ||
      user2.profession?.toLowerCase().includes(word) ||
      user2.aisummary?.goals?.some(goal => goal.toLowerCase().includes(word)) ||
      user2.expertise?.toLowerCase().includes(word)
    ).length;
    score += bioMatch * 12;

    // Goals alignment
    const commonGoals = matchContext.goals.filter(goal => 
      user2.goals?.some(userGoal => userGoal.toLowerCase().includes(goal.toLowerCase())) ||
      user2.aisummary?.goals?.some(userGoal => userGoal.toLowerCase().includes(goal.toLowerCase()))
    ).length;
    score += commonGoals * 8;
    
    return Math.min(score, 100);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) {
      toast({
        title: "Please enter a message",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    const currentInput = userInput;
    const newMessage = { sender: "user", text: currentInput, timestamp: new Date() };
    setMessages((prev) => [...prev, newMessage]);
    setUserInput("");
    setIsBotTyping(true);
    scrollToBottom();

    // Update user's AI data in Firestore
    await updateUserAIData(currentInput, true);

    // Update conversation context
    const updatedContext = extractUserContext(currentInput, conversationContext);
    setConversationContext(updatedContext);

    try {
      const systemPrompt = `
        You are Mira, an AI friend from OpenWorld. Be warm, empathetic, and genuinely interested in helping users connect with others.

        USER CONTEXT:
        - Interests: ${updatedContext.userInterests.join(', ')}
        - Skills: ${updatedContext.userSkills.join(', ')}
        - Goals: ${updatedContext.userGoals.join(', ')}
        - Recent conversation: ${updatedContext.conversationHistory.slice(-3).map(msg => msg.content).join(' | ')}

        YOUR APPROACH:
        1. FIRST, understand the user deeply - ask follow-up questions about their interests, goals, and needs
        2. Build rapport by showing genuine interest in their aspirations
        3. When they mention connection needs, acknowledge and suggest you'll find matches
        4. DO NOT promise specific numbers of connections - say "I'll find relevant people" instead of "I'll send to X people"
        5. Always be encouraging and supportive

        CONNECTION PROCESS:
        - When user mentions connection needs, say: "I'll help you find relevant people!"
        - After sending: "I've sent connection requests to people who match your interests!"
        - Explain: "They'll receive notifications and can view your profile"

        IMPORTANT: NEVER mention specific numbers like "10 people" or "20 people" - this may not be accurate.
        Instead say: "I've sent connection requests" or "I'm finding matches for you"

        Tone: Warm, curious, genuinely helpful. Ask thoughtful follow-up questions.
        Keep responses conversational and under 150 words.
        Use the context to personalize your responses.
      `;

      const conversationHistory = [...messages, newMessage]
        .slice(-8)
        .map((msg) => `${msg.sender === "user" ? "User" : "Mira"}: ${msg.text}`)
        .join("\n");

      const fullPrompt = `${systemPrompt}\n\nCurrent conversation:\n${conversationHistory}\n\nUser: ${currentInput}\n\nMira:`;

      const { textStream } = await streamText({
        model: groqClient('llama-3.3-70b-versatile'),
        prompt: fullPrompt,
        temperature: 0.7,
      });

      let streamedText = '';
      const botMessage = { sender: "bot", text: '', timestamp: new Date() };
      setMessages((prev) => [...prev, botMessage]);

      for await (const chunk of textStream) {
        streamedText += chunk;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = streamedText;
          return newMessages;
        });
        scrollToBottom();
      }

      // Update AI data with bot response
      await updateUserAIData(streamedText, false);

      // Check if user wants to connect with someone - ENHANCED detection
      const connectionKeywords = [
        'connect', 'find', 'looking for', 'need help with', 'searching for', 
        'want to talk to', 'looking to connect', 'want to find', 'need someone who',
        'connect me with', 'find me a', 'looking for someone', 'need a', 'who can help',
        'introduce me to', 'know anyone who', 'find people', 'match me with', 'suggest someone',
        'recommend people', 'help me find', 'looking to meet', 'want to connect with', 'students',
        'professors', 'developers', 'designers', 'mentors', 'collaborators'
      ];

      const wantsConnection = connectionKeywords.some(keyword => 
        currentInput.toLowerCase().includes(keyword)
      );

      // Send connections immediately when detected
      if (wantsConnection && !isSendingConnections) {
        console.log("Connection intent detected, sending requests...");
        
        // Send connection requests in background
        const matchesSent = await sendConnectionRequests(currentInput);
        
        // Add follow-up message after connections are sent
        setTimeout(() => {
          if (matchesSent > 0) {
            setMessages((prev) => [
              ...prev,
              {
                sender: "bot",
                text: `🎉 Great! I've sent connection requests to people who match your interests! They'll receive notifications and can view your profile. \n\nCheck your notifications tab for responses! What else can I help you with?`,
                timestamp: new Date(),
              },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                sender: "bot",
                text: `I'm keeping an eye out for great matches for you! In the meantime, you might want to add more details to your profile - it helps me find better connections. What specific areas are you most interested in?`,
                timestamp: new Date(),
              },
            ]);
          }
          scrollToBottom();
        }, 1000);
      }

    } catch (error) {
      console.error("AI Response Error:", error);
      toast({ 
        title: "AI Response Failed", 
        description: "Couldn't generate a response. Please try again.", 
        status: "error",
        duration: 5000,
        isClosable: true 
      });
      setMessages((prev) => [...prev, { 
        sender: "bot", 
        text: "Oops, I hit a snag! Let's try that again. What were we talking about? 😊",
        timestamp: new Date() 
      }]);
    } finally {
      setIsBotTyping(false);
      scrollToBottom();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const markdownComponents = {
    img: ({ src, alt }) => (
      <Image src={src} alt={alt || "Image"} maxH="200px" mt={2} borderRadius="md" />
    ),
    a: ({ href, children }) => (
      <Text as="span" color="blue.300" _hover={{ textDecoration: "underline" }}>
        {children}
      </Text>
    ),
  };

  if (loading) {
    return (
      <Flex
        direction="column"
        minH="100vh"
        w="100vw"
        bg={bgColor}
        justify="center"
        align="center"
      >
        <Spinner color="blue.500" size="xl" />
        <Text mt={4} color={textColor}>Loading your AI friend...</Text>
      </Flex>
    );
  }

  if (!authUser) {
    return (
      <Flex
        direction="column"
        minH="100vh"
        w="100vw"
        bg={bgColor}
        justify="center"
        align="center"
      >
        <Text color={textColor} textAlign="center">Please log in to chat with your AI friend.</Text>
        <Button
          mt={4}
          onClick={() => navigate("/auth")}
          bg="blue.500"
          color="white"
          _hover={{ bg: "blue.600" }}
          borderRadius="md"
        >
          Go to Login
        </Button>
      </Flex>
    );
  }

  return (
    <Flex
      direction="column"
      minH="100vh"
      w="100vw"
      bg={bgColor}
      position="relative"
      overflow="hidden"
    >
      {/* Header with context info and menu */}
      <Flex p={4} borderBottom={`1px solid ${cardBorder}`} align="center" justify="space-between">
        <HStack>
          <Avatar
            size="sm"
            name="Mira"
            src="/aiavatar.jpeg"
          />
          <Box>
            <Text color={textColor} fontWeight="bold">Mira</Text>
            <Text color={secondaryTextColor} fontSize="sm">Your AI Friend From OpenWorld</Text>
          </Box>
        </HStack>
        <HStack>
          {conversationContext.userInterests.length > 0 && (
            <HStack display={{ base: "none", md: "flex" }}>
              <Badge colorScheme="blue" fontSize="xs">
                {conversationContext.userInterests.length} interests
              </Badge>
              <Badge colorScheme="green" fontSize="xs">
                {conversationContext.userSkills.length} skills
              </Badge>
            </HStack>
          )}
          {isSendingConnections && (
            <Badge colorScheme="purple" fontSize="xs">
              Sending {connectionStats.sent}/{connectionStats.total}
            </Badge>
          )}
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FaEllipsisV />}
              variant="ghost"
              color={textColor}
              _hover={{ bg: inputBg }}
            />
            <MenuList bg={cardBg} borderColor={cardBorder}>
              <MenuItem 
                icon={<DeleteIcon />} 
                onClick={clearConversation}
                bg={cardBg}
                _hover={{ bg: inputBg }}
                color={textColor}
              >
                Clear Conversation
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      <Flex direction="column" flex={1} p={{ base: 3, md: 5 }} pt={4} pb={{ base: 20, md: 5 }} overflow="hidden">
        <MotionFlex
          flex={1}
          direction="column"
          spacing={4}
          overflowY="auto"
          p={{ base: 2, md: 3 }}
          bg={cardBg}
          backdropFilter="blur(10px)"
          border={`1px solid ${cardBorder}`}
          borderRadius="lg"
          mb={5}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {messages.map((msg, idx) => (
            <MotionFlex
              key={idx}
              direction="row"
              align="flex-start"
              justify={msg.sender === "user" ? "flex-end" : "flex-start"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.02 }}
              mb={3}
            >
              {msg.sender === "bot" && (
                <Avatar
                  size="xs"
                  name="Mira"
                  src="/aiavatar.jpeg"
                  mr={2}
                  mt={1}
                />
              )}
              <Box
                bg={msg.sender === "user" ? buttonBg : cardBg}
                color={textColor}
                p={{ base: 3, md: 4 }}
                borderRadius="lg"
                maxW="75%"
                boxShadow="0 1px 6px rgba(0,0,0,0.05)"
                backdropFilter="blur(8px)"
                border={`1px solid ${cardBorder}`}
                lineHeight={1.6}
                fontSize="sm"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={markdownComponents}
                >
                  {msg.text}
                </ReactMarkdown>
                <Text 
                  fontSize="xs" 
                  color={secondaryTextColor} 
                  mt={2} 
                  textAlign="right"
                  lineHeight={1.2}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </Box>
            </MotionFlex>
          ))}
          {isBotTyping && (
            <Flex direction="row" align="flex-start">
              <Avatar size="xs" name="Mira" src="/aiavatar.jpeg" mr={2} mt={1} />
              <Box 
                bg={cardBg} 
                p={{ base: 3, md: 4 }} 
                borderRadius="lg"
                backdropFilter="blur(8px)"
                border={`1px solid ${cardBorder}`}
                lineHeight={1.6}
              >
                <Spinner color="blue.300" size="sm" />
                <Text ml={3} display="inline" color={secondaryTextColor} fontSize="sm">Thinking...</Text>
              </Box>
            </Flex>
          )}
          <div ref={messagesEndRef} />
        </MotionFlex>

        <Flex 
          gap={2} 
          align="center" 
          flexWrap="wrap" 
          position="relative" 
          mt={{ base: -4, md: 0 }}
          pb={{ base: 4, md: 0 }}
        >
          <InputGroup size="md" flex={1} minW="0">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.500" boxSize={4} />
            </InputLeftElement>
            <Input
              placeholder={placeholders[placeholderIndex]}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              bg={inputBg}
              color={textColor}
              border={`1px solid ${inputBorder}`}
              borderRadius="md"
              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px blue.400" }}
              pl={12}
              pr={20}
              fontSize="sm"
              lineHeight={1.5}
              backdropFilter="blur(8px)"
              _placeholder={{ color: "gray.500" }}
            />
            <InputRightElement width="auto" pr={3} display="flex" alignItems="center" gap={2}>
              <IconButton
                icon={<FaSmile size={16} />}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                variant="ghost"
                color="gray.500"
                size="xs"
                _hover={{ color: "blue.400" }}
              />
              <IconButton
                icon={<FaMicrophone size={16} />}
                onClick={toggleVoice}
                variant="ghost"
                color={isVoiceActive ? "red.400" : "gray.500"}
                size="xs"
                _hover={{ color: "blue.400" }}
              />
            </InputRightElement>
          </InputGroup>
          <Button
            leftIcon={<ArrowForwardIcon />}
            onClick={handleSendMessage}
            bg="blue.500"
            color="white"
            borderRadius="md"
            size={{ base: "sm", md: "md" }}
            _hover={{ bg: "blue.600", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
            backdropFilter="blur(8px)"
            fontSize="sm"
            fontWeight="medium"
            px={6}
            isDisabled={!userInput.trim() || isSendingConnections}
          >
            {isSendingConnections ? <Spinner size="sm" /> : "Send"}
          </Button>
        </Flex>
        {showEmojiPicker && (
          <Box position="absolute" bottom={20} right={4} zIndex={10}>
            <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
          </Box>
        )}
      </Flex>
    </Flex>
  );
};

export default ChatbotPage;