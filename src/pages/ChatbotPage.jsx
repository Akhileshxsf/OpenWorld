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
import { FaMicrophone, FaSmile, FaEllipsisV, FaComment, FaWhatsapp } from "react-icons/fa";
import { createGroq } from '@ai-sdk/groq';
import { streamText, generateText } from 'ai';
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

  // Cycling placeholders - more human-like
  const placeholders = [
    "Hey! I'm looking to connect with someone who can help me with web development...",
    "I want to find study partners for machine learning",
    "Anyone interested in collaborating on a startup idea?",
    "Looking for a mentor in data science",
    "I need help with my final year project - anyone experienced in React?",
    "Want to connect with people who share my interest in AI and robotics"
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
          const messagesWithDates = parsedMessages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messagesWithDates);
        } catch (error) {
          console.error("Error loading saved messages:", error);
          setMessages([{
            sender: "bot",
            text: "Hey there! 👋 I'm Mira, your AI friend from OpenWorld. I'm here to help you connect with amazing people around you. Tell me what you're looking for or who you'd like to meet!",
            timestamp: new Date(),
          }]);
        }
      } else {
        setMessages([{
          sender: "bot",
          text: "Hey there! 👋 I'm Mira, your AI friend from OpenWorld. I'm here to help you connect with amazing people around you. Tell me what you're looking for or who you'd like to meet!",
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

  // Save conversation to localStorage
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
    });

    // Fetch existing connections
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

  // Enhanced AI-powered connection reason generation
  const generateConnectionReason = async (currentUser, targetUser, userNeed) => {
    try {
      const systemPrompt = `
        You are an AI matchmaking expert. Analyze two users' profiles and generate a compelling, personalized reason why they should connect.

        Current User Profile:
        - Name: ${currentUser.username || 'User'}
        - Profession: ${currentUser.profession || 'Not specified'}
        - Skills: ${currentUser.skills?.join(', ') || 'No skills listed'}
        - Interests: ${currentUser.interests?.join(', ') || 'No interests listed'}
        - Bio: ${currentUser.bio || 'No bio available'}
        - Goals: ${currentUser.goals?.join(', ') || 'No goals specified'}

        Target User Profile:
        - Name: ${targetUser.username || 'User'}
        - Profession: ${targetUser.profession || 'Not specified'}
        - Skills: ${targetUser.skills?.join(', ') || 'No skills listed'}
        - Interests: ${targetUser.interests?.join(', ') || 'No interests listed'}
        - Bio: ${targetUser.bio || 'No bio available'}
        - Goals: ${targetUser.goals?.join(', ') || 'No goals specified'}

        Connection Context: ${userNeed}

        Your task: Create a compelling 2-3 sentence reason for connection that highlights:
        1. Specific shared interests, skills, or professional alignment
        2. Complementary strengths or potential collaboration opportunities
        3. How this connection could benefit both parties

        Be specific, genuine, and encouraging. Focus on real compatibility factors.
        Return only the connection reason text, no additional formatting.
      `;

      const { text } = await generateText({
        model: groqClient('openai/gpt-oss-120b'),
        system: systemPrompt,
        prompt: "Generate a personalized connection reason based on the user profiles above."
      });

      return text.trim();
    } catch (error) {
      console.error("Error generating connection reason:", error);
      
      // Fallback reason based on basic profile analysis
      const sharedInterests = currentUser.interests?.filter(interest => 
        targetUser.interests?.includes(interest)
      ) || [];
      
      const sharedSkills = currentUser.skills?.filter(skill => 
        targetUser.skills?.includes(skill)
      ) || [];

      let fallbackReason = "I think you two should connect because ";
      
      if (sharedInterests.length > 0) {
        fallbackReason += `you share interests in ${sharedInterests.slice(0, 2).join(' and ')}. `;
      }
      
      if (sharedSkills.length > 0) {
        fallbackReason += `You both have skills in ${sharedSkills.slice(0, 2).join(' and ')}. `;
      }
      
      if (currentUser.profession && targetUser.profession && currentUser.profession === targetUser.profession) {
        fallbackReason += `You're both ${currentUser.profession}s and could benefit from professional networking.`;
      } else {
        fallbackReason += `This connection could lead to valuable collaboration opportunities.`;
      }
      
      return fallbackReason;
    }
  };

  // Update user's AI chat history
  const updateUserAIData = async (newMessage, isUserMessage = false) => {
    if (!authUser) return;

    try {
      const userRef = doc(firestore, "users", authUser.uid);
      const chatEntry = {
        sender: isUserMessage ? "user" : "ai",
        text: newMessage,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(userRef, {
        aichathistory: arrayUnion(chatEntry),
        lastAIChatUpdate: serverTimestamp(),
      });

      if (isUserMessage && newMessage.length > 10) {
        await updateAISummary(newMessage);
      }
    } catch (error) {
      console.error("Error updating user AI data:", error);
    }
  };

  // Enhanced AI summary extraction with "wanting to help" and "seeking help" detection
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

      const extractedInfo = extractSummaryInfo(userMessage, currentSummary);
      
      await updateDoc(userRef, {
        aisummary: {
          ...extractedInfo,
          lastUpdated: new Date().toISOString(),
        },
      });

    } catch (error) {
      console.error("Error updating AI summary:", error);
    }
  };

  // Enhanced information extraction with "wanting to help" and "seeking help" detection
  const extractSummaryInfo = (userMessage, currentSummary) => {
    const message = userMessage.toLowerCase();
    const newSummary = { ...currentSummary };

    // Extract interests
    const interestPatterns = {
      technology: ['tech', 'programming', 'coding', 'software', 'ai', 'ml', 'llm', 'computer', 'developer', 'engineer'],
      business: ['business', 'startup', 'entrepreneur', 'marketing', 'finance', 'investment', 'venture', 'funding'],
      education: ['study', 'learn', 'education', 'university', 'college', 'professor', 'student', 'research', 'academic'],
      creative: ['art', 'design', 'music', 'writing', 'creative', 'photography', 'film', 'content creation'],
      science: ['research', 'science', 'engineering', 'physics', 'chemistry', 'biology', 'data science', 'analysis']
    };

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

    // ENHANCED: Extract "wanting to help" areas
    const helpOfferingPatterns = [
      'i can help', 'i can teach', 'i know about', 'i have experience in', 'i\'m good at',
      'i can mentor', 'i can guide', 'i can assist with', 'i can support with',
      'i\'d love to help', 'happy to help', 'willing to help', 'available to help',
      'i have skills in', 'i have knowledge of', 'i can share', 'i can collaborate on'
    ];

    helpOfferingPatterns.forEach(pattern => {
      if (message.includes(pattern)) {
        // Extract the area they want to help with
        const helpArea = extractHelpArea(message, pattern);
        if (helpArea && !newSummary.wantingToHelpWith.includes(helpArea)) {
          newSummary.wantingToHelpWith.push(helpArea);
        }
      }
    });

    // ENHANCED: Extract "seeking help" areas
    const helpSeekingPatterns = [
      'i need help', 'i need assistance', 'looking for help', 'searching for help',
      'can someone help', 'need guidance', 'need support', 'need advice',
      'i want to learn', 'i\'m learning', 'beginner in', 'new to',
      'struggling with', 'having trouble with', 'need mentor', 'looking for mentor'
    ];

    helpSeekingPatterns.forEach(pattern => {
      if (message.includes(pattern)) {
        // Extract the area they need help with
        const helpArea = extractHelpArea(message, pattern);
        if (helpArea && !newSummary.seekingHelpWith.includes(helpArea)) {
          newSummary.seekingHelpWith.push(helpArea);
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

  // Helper function to extract help areas from messages
  const extractHelpArea = (message, pattern) => {
    const messageLower = message.toLowerCase();
    const patternIndex = messageLower.indexOf(pattern);
    
    if (patternIndex !== -1) {
      const afterPattern = messageLower.substring(patternIndex + pattern.length);
      const words = afterPattern.split(/\s+/).slice(0, 5).join(' ').trim();
      
      // Clean up the extracted text
      const cleanArea = words
        .replace(/[.,!?;:].*$/, '') // Remove everything after punctuation
        .replace(/\b(with|in|for|about)\b/, '') // Remove common prepositions
        .trim();
      
      return cleanArea.length > 2 ? cleanArea : null;
    }
    
    return null;
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
      text: "Hey there! 👋 I'm Mira, your AI friend from OpenWorld. I'm here to help you connect with amazing people around you. Tell me what you're looking for or who you'd like to meet!",
      timestamp: new Date(),
    }]);
    setConversationContext({
      userInterests: userProfile?.interests || [],
      userSkills: userProfile?.skills || [],
      userGoals: userProfile?.goals || [],
      conversationHistory: []
    });
    
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

  // Handle feedback button click
  const handleFeedbackClick = () => {
    window.open("https://docs.google.com/forms/d/e/1FAIpQLSdsDTUTGsZyjVVhtm_GZX1ZaMpXsKgpART-RhkYZvBIihk2Mg/viewform?usp=dialog", "_blank");
  };

  // Enhanced user context extraction
  const extractUserContext = (userMessage, currentContext) => {
    const newContext = { ...currentContext };
    
    const message = userMessage.toLowerCase();

    // Update conversation history
    newContext.conversationHistory = [
      ...currentContext.conversationHistory.slice(-9),
      { role: 'user', content: userMessage, timestamp: new Date() }
    ];

    return newContext;
  };

  // ENHANCED: Connection request system with AI-generated reasons
  const sendConnectionRequests = async (userNeed) => {
    if (isSendingConnections) {
      return 0;
    }
    
    setIsSendingConnections(true);
    setConnectionStats({ sent: 0, total: 0 });
    
    try {
      if (!userProfile) {
        toast({
          title: "Profile Not Loaded",
          description: "Please wait for your profile to load",
          status: "warning",
          duration: 3000,
        });
        return 0;
      }

      // Use AI summary for better matching
      const aiSummary = userProfile.aisummary || {};
      const matchContext = {
        interests: [...conversationContext.userInterests, ...(aiSummary.interests || [])],
        skills: [...conversationContext.userSkills, ...(aiSummary.skills || [])],
        goals: [...conversationContext.userGoals, ...(aiSummary.goals || [])],
        connectionPreferences: aiSummary.connectionPreferences || [],
        wantingToHelpWith: aiSummary.wantingToHelpWith || [],
        seekingHelpWith: aiSummary.seekingHelpWith || []
      };

      // Find potential matches using enhanced matching
      const potentialMatches = users.filter(user => {
        if (existingConnections.has(user.id)) {
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
          user.aisummary?.goals?.join(' ') || '',
          user.aisummary?.wantingToHelpWith?.join(' ') || '',
          user.aisummary?.seekingHelpWith?.join(' ') || ''
        ].join(' ').toLowerCase();
        
        const needWords = userNeed.toLowerCase().split(' ').filter(word => word.length > 2);
        
        const keywordMatch = needWords.some(word => searchText.includes(word));
        
        // Enhanced matching based on help-seeking and help-offering
        const helpMatch = 
          // User is seeking help and target user wants to help in that area
          (matchContext.seekingHelpWith.some(area => 
            user.aisummary?.wantingToHelpWith?.some(helpArea => 
              helpArea.toLowerCase().includes(area.toLowerCase()) || area.toLowerCase().includes(helpArea.toLowerCase())
            )
          )) ||
          // User wants to help and target user is seeking help in that area
          (matchContext.wantingToHelpWith.some(area => 
            user.aisummary?.seekingHelpWith?.some(needArea => 
              needArea.toLowerCase().includes(area.toLowerCase()) || area.toLowerCase().includes(needArea.toLowerCase())
            )
          ));

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
          );

        const matchScore = calculateMatchScore(userProfile, user, userNeed, matchContext);
        
        return (keywordMatch || contextMatch || helpMatch) && matchScore > 10;
      });

      if (potentialMatches.length === 0) {
        toast({
          title: "No Matches Found",
          description: "I couldn't find any matching users right now. Try adding more details about what you're looking for!",
          status: "info",
          duration: 4000,
        });
        return 0;
      }

      let successfulRequests = 0;
      setConnectionStats({ sent: 0, total: potentialMatches.length });

      toast({
        title: "🔍 Finding Matches",
        description: `Found ${potentialMatches.length} potential connections...`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });

      // Create connection requests with AI-generated reasons
      for (const match of potentialMatches) {
        try {
          // Double-check if connection already exists
          const connectionCheckQuery = query(
            collection(firestore, "offers"),
            where("fromUserId", "==", authUser.uid),
            where("toUserId", "==", match.id),
            where("type", "==", "connection_request")
          );
          
          const existingConnectionsSnapshot = await getDocs(connectionCheckQuery);
          
          if (!existingConnectionsSnapshot.empty) {
            continue;
          }

          const offerId = `connection_${Date.now()}_${authUser.uid}_${match.id}`;
          const offerRef = doc(firestore, "offers", offerId);
          
          const matchScore = calculateMatchScore(userProfile, match, userNeed, matchContext);

          // ENHANCED: Generate AI-powered connection reason
          const connectionReason = await generateConnectionReason(userProfile, match, userNeed);

          // Create connection request
          await setDoc(offerRef, {
            // Connection data
            type: "connection_request",
            fromUserId: authUser.uid,
            fromUserName: userProfile.username || "User",
            fromUserProfession: userProfile.profession || "",
            fromUserBio: userProfile.bio || "", // INTRO FIELD
            fromUserProfilePic: userProfile.profilePicURL || "",
            fromUserInterests: userProfile.interests || [],
            fromUserSkills: userProfile.skills || [],
            fromUserAISummary: aiSummary,
            
            toUserId: match.id,
            toUserName: match.username || "User",
            toUserProfession: match.profession || "",
            toUserBio: match.bio || "", // INTRO FIELD
            toUserProfilePic: match.profilePicURL || "",
            toUserInterests: match.interests || [],
            toUserSkills: match.skills || [],
            toUserAISummary: match.aisummary || {},
            
            // Request details
            userNeed: userNeed,
            connectionReason: connectionReason, // AI-GENERATED WHY CONNECT FIELD
            aiContext: matchContext.goals.slice(0, 3),
            status: "pending",
            timestamp: serverTimestamp(),
            lastUpdated: serverTimestamp(),
            fromUserAccepted: true,
            toUserAccepted: false,
            chatRoomId: null,
            isAiSuggested: true,
            matchScore: matchScore,

            // Offer collection required fields
            name: `AI Connection: ${userProfile.username} → ${match.username}`,
            description: `${userProfile.username} wants to connect: ${userNeed.substring(0, 100)}`,
            contact: userProfile.email || "",
            offerType: "AI_Connection",
            joins: [],
            userId: authUser.uid
          });

          setExistingConnections(prev => new Set([...prev, match.id]));
          successfulRequests++;
          setConnectionStats(prev => ({ ...prev, sent: successfulRequests }));

          console.log(`✅ Connection sent to ${match.username} with AI-generated reason`);

          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`Failed to create connection:`, error);
        }
      }

      if (successfulRequests > 0) {
        toast({
          title: "🎉 Connections Sent!",
          description: `Successfully sent ${successfulRequests} connection requests with personalized introductions!`,
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
    
    // Profession match
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
    
    // Help-seeking and help-offering match (NEW)
    const helpMatchScore = 
      // User1 seeking help + User2 wanting to help
      matchContext.seekingHelpWith.filter(need => 
        user2.aisummary?.wantingToHelpWith?.some(help => 
          help.toLowerCase().includes(need.toLowerCase()) || need.toLowerCase().includes(help.toLowerCase())
        )
      ).length * 25 +
      // User1 wanting to help + User2 seeking help
      matchContext.wantingToHelpWith.filter(help => 
        user2.aisummary?.seekingHelpWith?.some(need => 
          need.toLowerCase().includes(help.toLowerCase()) || help.toLowerCase().includes(need.toLowerCase())
        )
      ).length * 25;
    
    score += helpMatchScore;
    
    // Bio keyword match
    const needWords = userNeed.toLowerCase().split(' ').filter(word => word.length > 3);
    const bioMatch = needWords.filter(word => 
      user2.bio?.toLowerCase().includes(word) ||
      user2.profession?.toLowerCase().includes(word) ||
      user2.aisummary?.goals?.some(goal => goal.toLowerCase().includes(word)) ||
      user2.expertise?.toLowerCase().includes(word)
    ).length;
    score += bioMatch * 12;

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

    await updateUserAIData(currentInput, true);

    const updatedContext = extractUserContext(currentInput, conversationContext);
    setConversationContext(updatedContext);

    try {
      const systemPrompt = `
        You are Mira, an AI friend from OpenWorld. You're talking to students and young professionals. Be warm, conversational, and genuinely human-like.

        CRITICAL GUIDELINES:
        - Speak like a real human friend, not a formal assistant. Use casual language, emojis occasionally, and be relatable.
        - Primary flow: Start by asking "Whom do you want to reach out to and why?" to understand their connection needs.
        - After the user responds to that, ask for some details about their interests, skills, and whom they can help. Store this in AI summary (automatically handled).
        - Then guide them: "Just use 'connect me' keyword with whom and why, and I'll initiate matchmaking."
        - Suggest updating profile: "For better matchmaking, update your profile with more details!"
        - Conversation motive: Focus on learning what they're interested in and working on naturally, without too many questions.
        - Encourage using "I can help X kind of people" keyword: "Tell me using 'I can help X kind of people' so I can send you relevant notifications about people who need that help."
        - Extract and remember "seeking help" or "wanting to help" areas naturally.
        - Keep responses concise, engaging, and simple (1-3 sentences max). Show empathy and excitement.
        - Only trigger connections when the user uses "connect me" (e.g., "connect me with developers because...").
        - When detecting "I can help X", acknowledge and say you'll send relevant notifications.
        - Always remind users to use keywords as usual in the flow.

        USER CONTEXT:
        - Interests: ${updatedContext.userInterests.join(', ')}
        - Skills: ${updatedContext.userSkills.join(', ')}
        - Goals: ${updatedContext.userGoals.join(', ')}
        - Recent conversation: ${updatedContext.conversationHistory.slice(-3).map(msg => msg.content).join(' | ')}

        CONNECTION GUIDANCE:
        - Trigger matchmaking only on "connect me".
        - Automatically extract info for better matches and notifications.

        Tone: Friendly, casual, supportive, like a peer mentor. Make the user feel heard and excited about connecting.
        Style: Use contractions, occasional emojis, and natural speech patterns for an engaging, simple chat.
      `;

      const conversationHistory = [...messages, newMessage]
        .slice(-8)
        .map((msg) => `${msg.sender === "user" ? "User" : "Mira"}: ${msg.text}`)
        .join("\n");

      const fullPrompt = `${systemPrompt}\n\nCurrent conversation:\n${conversationHistory}\n\nUser: ${currentInput}\n\nMira:`;

      const { textStream } = await streamText({
        model: groqClient('openai/gpt-oss-120b'),
        prompt: fullPrompt,
        temperature: 0.8, // Slightly higher temperature for more human-like responses
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

      await updateUserAIData(streamedText, false);

      // Enhanced connection detection with natural language processing
      const connectionKeywords = [
        'connect me with', 'connect me to', 'connect me'
      ];

      const helpOfferingKeywords = [
        'i can help', 'i can teach', 'i know about', 'i have experience',
        'i\'m good at', 'i can mentor', 'happy to help', 'willing to help'
      ];

      const helpSeekingKeywords = [
        'i need help', 'need assistance', 'looking for help', 'can someone help',
        'need guidance', 'struggling with', 'want to learn', 'new to'
      ];

      const wantsConnection = connectionKeywords.some(keyword => 
        currentInput.toLowerCase().includes(keyword)
      );

      const isOfferingHelp = helpOfferingKeywords.some(keyword =>
        currentInput.toLowerCase().includes(keyword)
      );

      const isSeekingHelp = helpSeekingKeywords.some(keyword =>
        currentInput.toLowerCase().includes(keyword)
      );

      // Provide feedback about extracted help areas
      if ((isOfferingHelp || isSeekingHelp) && !wantsConnection) {
        const aiSummary = userProfile?.aisummary || {};
        const updatedSummary = extractSummaryInfo(currentInput, aiSummary);
        
        if (isOfferingHelp && updatedSummary.wantingToHelpWith.length > 0) {
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                sender: "bot",
                text: `That's awesome that you can help with ${updatedSummary.wantingToHelpWith.slice(-1)[0]}! 🎉 I'll remember this for future matches and notify you about people who need it.`,
                timestamp: new Date(),
              },
            ]);
            scrollToBottom();
          }, 500);
        }

        if (isSeekingHelp && updatedSummary.seekingHelpWith.length > 0) {
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                sender: "bot",
                text: `Got it! You're looking for help with ${updatedSummary.seekingHelpWith.slice(-1)[0]}. I'll keep an eye out and notify you about relevant people. When ready, say 'connect me'! 👀`,
                timestamp: new Date(),
              },
            ]);
            scrollToBottom();
          }, 500);
        }
      }

      // Trigger connection matching only on "connect me"
      if (wantsConnection && !isSendingConnections) {
        const matchesSent = await sendConnectionRequests(currentInput);
        
        setTimeout(() => {
          if (matchesSent > 0) {
            setMessages((prev) => [
              ...prev,
              {
                sender: "bot",
                text: `🎉 Awesome! I just sent ${matchesSent} personalized connection requests to people who match what you're looking for! Each request includes a custom message explaining why you should connect based on shared interests and goals. Check your notifications for responses!`,
                timestamp: new Date(),
              },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                sender: "bot",
                text: `I'm keeping an eye out for great matches for you! 👀 In the meantime, you might want to add more details to your profile - it helps me find better connections and create more personalized introductions.`,
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
        title: "Oops, something went wrong!", 
        description: "Couldn't generate a response. Let's try that again? 😊", 
        status: "error",
        duration: 5000,
        isClosable: true 
      });
      setMessages((prev) => [...prev, { 
        sender: "bot", 
        text: "Hmm, I hit a snag there! 😅 What were we talking about again?",
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
      w="full"
      bg={bgColor}
      position="relative"
      overflow="hidden"
    >
      <Box 
        position="fixed" 
        top={-1} 
        left={{ base: 0, md: "150px" }} 
        w={{ base: "100vw", md: "calc(105vw - 250px)" }} 
        zIndex={10} 
        bg={bgColor} 
        borderBottom={`1px solid ${cardBorder}`}
      >
        <Flex p={4} align="center" justify="space-between">
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
                {userProfile?.aisummary?.wantingToHelpWith?.length > 0 && (
                  <Badge colorScheme="purple" fontSize="xs">
                    Can help with {userProfile.aisummary.wantingToHelpWith.length} areas
                  </Badge>
                )}
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
              <MenuList bg="black" borderColor={cardBorder}>
                <MenuItem 
                  icon={<DeleteIcon />} 
                  onClick={clearConversation}
                  bg="black"
                  _hover={{ bg: inputBg }}
                  color={textColor}
                >
                  Clear Conversation
                </MenuItem>
                <MenuItem 
                  icon={<FaComment />} 
                  onClick={handleFeedbackClick}
                  bg="black"
                  _hover={{ bg: inputBg }}
                  color={textColor}
                >
                  Feedback
                </MenuItem>
                {import.meta.env.VITE_WHATSAPP_NUMBER && (
                  <MenuItem
                    icon={<FaWhatsapp />}
                    as="a"
                    href={`https://wa.me/${String(import.meta.env.VITE_WHATSAPP_NUMBER).replace(/\D/g, "")}?text=${encodeURIComponent("Hi Mira")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    bg="black"
                    _hover={{ bg: inputBg }}
                    color={textColor}
                  >
                    Continue on WhatsApp
                  </MenuItem>
                )}
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Box>

      <Flex 
        direction="column" 
        flex={1} 
        p={{ base: 3, md: 5 }} 
        pt={{ base: "70px", md: "70px" }} 
        pb={{ base: 20, md: 5 }} 
        overflow="hidden"
      >
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