import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Flex,
  Box,
  Heading,
  Text,
  Input,
  Button,
  InputGroup,
  InputRightElement,
  useToast,
  VStack,
  Card,
  CardBody,
  Icon,
  Container,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Avatar,
  HStack,
  SimpleGrid,
  Spinner,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Wrap,
  WrapItem,
  Select,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Progress,
  Textarea,
  Code,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { 
  FaLock, 
  FaChartLine, 
  FaUsers, 
  FaGlobe,
  FaFire,
  FaRobot,
  FaEnvelope,
  FaLightbulb,
  FaHeart,
  FaHandsHelping,
  FaSync,
  FaExpand,
  FaUser,
  FaCircle,
  FaComment,
  FaUserFriends,
  FaSearch,
  FaSort,
  FaSortDown,
  FaSortUp,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaComments,
  FaUserPlus,
  FaCheckCircle,
  FaClock,
  FaBan,
  FaInbox,
  FaChartBar,
  FaPaperPlane,
  FaBullseye,
  FaVideo,
  FaThumbsUp,
  FaEdit,
  FaSave,
  FaUserEdit,
  FaTrash,
  FaUpload,
} from "react-icons/fa";
import { firestore, rtdb, storage } from "../../firebase/firebase";
import { 
  collection, 
  getDocs,
  Timestamp,
  query,
  where,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref, onValue, off } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Service Account Credentials for FCM V1
const SERVICE_ACCOUNT = {
  client_email: "firebase-adminsdk-tftjq@openworld-8f410.iam.gserviceaccount.com",
  private_key: `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCyNKrLk428M9Oc
ee6VOKNIZX3EPnofqUfu3HwuHFprZwhk5bD1QzMZaxHWxX1Czq8EobJeb8v05IfF
OM+ddvLBXUTO8MtCyQW3o8dDN1pBdrQnxKF0+vFTll70MMV3p5M5kcoA3eT8O1Yo
5ChVHpatK80QEhFLpA0mkXP+rzaKDW6FITbtH6yaaJtzURNTVQllfCqLefYkCulx
ABZsrr1dPeUhnWD8My88Q2dA1CnMXaL51QMnUFW7zfUF/C4DQJBy2WyfNyID7AIC
0eZ/YG6xKy5U7e0EpA70H9uPtDQvA9y8tVucK/2MRWbGw+8t/aN+KQ87syY6FWpF
EbgLqDR7AgMBAAECggEABYDq5W6hKfbPyj1ZyPH+2PWJdM4ZJ3Eq742PqDzn7fk4
oSUW2fxBT7+mxWNEAxQvA42a3J/HRMDqEIU4pDxQMviWb22wWVer/YfpV4IWH39z
AOdptRsq6NH0DMaU0qUyPszp2C0CLWgHuSuSs05GiQKZSq3EKvneDhrf4jW3EXxb
dld0Lp3H6t1bcxdeLVQ3b+1QpMMhaxMF7AszLu8I+o1oy5ODrvWk4H71vL48vn8+
CM42kNXl0Eoq7zF/0I2tYIvM70enkTLVz8iME7oZ8kNxwsPPbzF61wiwt+P25U6A
LkgC0+T6W5KR905b2LQcP6P7nvx5xJ0wUShH8VB5wQKBgQDpuJa1DQGMWGGSLD7U
xNITF0jOuRxe/ylooQOPkjul/6FiejqP2CWXTrT9pLm7sWpwSDarki2t+Dhq29lj
wCHsyR0iAGVNwFAeDRbGyLTRXhSVZ1+LxrAobsjpUcikRO6F8eBj8lG55+i2Wd8T
SZmXBFdCDvMtAXsRLDqK83M9DwKBgQDDMVukhdBl/pPlzk3Ilk2+IRPrPigxLGn6
WngSOEWRmYPNaBsRljmhRRpFufTNogjiwEJXs/A7uXfJvU5s6WGvBKdccbeqq4bE
Qtb3teOPnku3gptBfpiTe8lRSHVUDdPi1fAltwgE1lTn1xkTqbViAmQbuWLJhqXd
3A2tZhEp1QKBgBD9Vhc7Js2o7w7NIJQe6pZwrt44HpPZQI1Whwe8vZFHj9e0wuUJ
9VGWaxm1C7tVHkOjPDYkniVzUcaSzK6vnMe1puR92t9YB3rnwKwakupVSHHD3fIv
M0b9JqWvSEKIsD4UYxdg2ggFj6kRx2GDjCKqMh2fMJYo8WVCLc9D+zCJAoGAP5aG
ylQljfSfbdAFmwEMFpJkENDQ+yQC6mIql5TpZQNj4ri1iMctwxHl+y0XSR4uUuBb
PIMMEgjbs0cOk4B8KC4V75HESb9TSgCUU2JX3eOtuvy7Y1zAi9tZvDcksdtHWbBk
aYT1Ac5pHpX+P1+cDW/F+RotyoUo59vWQNTtZnkCgYAN9xeZw9fCohtZjApfmdSN
jbdu6+SyvdIee+e4ieJ9x7b5J8Z/A5L6ZI2zB8bl/ffwt3uJMCcCgNwROPIMs+S8
Sa6BBhPl0M9xQx6SHnQO1Fip9EcJTpZeEJY6SwSdmFpyyD6gXIxdlcGRjwnRxXCR
md2/1vql7M3gS9eAVPWPyA==
-----END PRIVATE KEY-----\n`,
  project_id: "openworld-8f410"
};

const PAGE_SIZE = 25;

const DashboardPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  
  // Data state
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [userMap, setUserMap] = useState({});
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hasAIDataFilter, setHasAIDataFilter] = useState("all");
  const [chatHistoryFilter, setChatHistoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("username");
  const [sortOrder, setSortOrder] = useState("asc");
  
  // Pagination state for Users
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Pagination for Offers
  const [pendingPage, setPendingPage] = useState(1);
  const [acceptedPage, setAcceptedPage] = useState(1);
  const [rejectedPage, setRejectedPage] = useState(1);
  const [totalPendingPages, setTotalPendingPages] = useState(1);
  const [totalAcceptedPages, setTotalAcceptedPages] = useState(1);
  const [totalRejectedPages, setTotalRejectedPages] = useState(1);
  
  // Pagination for Chat Rooms
  const [chatRoomsPage, setChatRoomsPage] = useState(1);
  const [totalChatRoomsPages, setTotalChatRoomsPages] = useState(1);
  
  // Pagination for Blasts
  const [blastsPage, setBlastsPage] = useState(1);
  const [totalBlastsPages, setTotalBlastsPages] = useState(1);
  
  // ============= LIVE ROOMS STATE =============
  const [liveRooms, setLiveRooms] = useState([]);
  const [liveRoomsPage, setLiveRoomsPage] = useState(1);
  const [totalLiveRoomsPages, setTotalLiveRoomsPages] = useState(1);
  const [selectedLiveRoom, setSelectedLiveRoom] = useState(null);
  const [liveRoomMessages, setLiveRoomMessages] = useState([]);
  const [liveRoomParticipants, setLiveRoomParticipants] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [liveRoomSearchTerm, setLiveRoomSearchTerm] = useState("");
  const [liveRoomStatusFilter, setLiveRoomStatusFilter] = useState("all");
  const [liveRoomSortBy, setLiveRoomSortBy] = useState("participants");
  const [liveRoomSortOrder, setLiveRoomSortOrder] = useState("desc");
  
  // ============= CLONE USERS STATE =============
  const [cloneUsers, setCloneUsers] = useState([]);
  const [cloneUsersPage, setCloneUsersPage] = useState(1);
  const [totalCloneUsersPages, setTotalCloneUsersPages] = useState(1);
  const [selectedCloneUser, setSelectedCloneUser] = useState(null);
  const [cloneSearchTerm, setCloneSearchTerm] = useState("");
  const [cloneSortBy, setCloneSortBy] = useState("username");
  const [cloneSortOrder, setCloneSortOrder] = useState("asc");
  
  // ============= CLONE LIKES & COMMENTS STATE =============
  const [cloneLikesMap, setCloneLikesMap] = useState({});
  const [cloneCommentsMap, setCloneCommentsMap] = useState({});
  const [selectedCloneLikes, setSelectedCloneLikes] = useState([]);
  const [selectedCloneComments, setSelectedCloneComments] = useState([]);
  const [isLoadingCloneLikes, setIsLoadingCloneLikes] = useState(false);
  const [isLoadingCloneComments, setIsLoadingCloneComments] = useState(false);
  
  // ============= EDIT USERS STATE =============
  const [editMode, setEditMode] = useState({});
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState({});
  const [editUsersSearchTerm, setEditUsersSearchTerm] = useState("");
  const [editUsersPage, setEditUsersPage] = useState(1);
  const [editUsersSortBy, setEditUsersSortBy] = useState("username");
  const [editUsersSortOrder, setEditUsersSortOrder] = useState("asc");
  const [uploadingImage, setUploadingImage] = useState({});
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  
  // Offers/Analytics state
  const [allPendingRequests, setAllPendingRequests] = useState([]);
  const [allAcceptedConnections, setAllAcceptedConnections] = useState([]);
  const [allRejectedRequests, setAllRejectedRequests] = useState([]);
  const [allChatRooms, setAllChatRooms] = useState([]);
  const [allBlasts, setAllBlasts] = useState([]);
  
  // Display lists for pagination
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedConnections, setAcceptedConnections] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [blasts, setBlasts] = useState([]);
  
  // Analytics counts
  const [totalPendingRequests, setTotalPendingRequests] = useState(0);
  const [totalAcceptedConnections, setTotalAcceptedConnections] = useState(0);
  const [totalRejectedRequests, setTotalRejectedRequests] = useState(0);
  const [totalChatRooms, setTotalChatRooms] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [avgMessagesPerRoom, setAvgMessagesPerRoom] = useState(0);
  const [totalBlasts, setTotalBlasts] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [activeBlasts, setActiveBlasts] = useState(0);
  
  // Engagement analytics
  const [avgDailyActiveUsers, setAvgDailyActiveUsers] = useState(0);
  const [peakHour, setPeakHour] = useState("");
  const [mostActiveUser, setMostActiveUser] = useState({ name: "", count: 0 });
  
  // Bot message state
  const [botMessageUser, setBotMessageUser] = useState(null);
  const [botMessageText, setBotMessageText] = useState("");
  const [isSendingBotMessage, setIsSendingBotMessage] = useState(false);
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedChatHistory, setSelectedChatHistory] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedBlast, setSelectedBlast] = useState(null);
  const [blastComments, setBlastComments] = useState([]);
  const [blastCreator, setBlastCreator] = useState(null);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // ============= SHARE CHATROOMS STATE =============
  const [selectedShareBlast, setSelectedShareBlast] = useState(null);
  const [shareUserChatRooms, setShareUserChatRooms] = useState([]);
  const [isLoadingShareChatRooms, setIsLoadingShareChatRooms] = useState(false);
  const [selectedShareChatRoom, setSelectedShareChatRoom] = useState(null);
  const [shareChatMessages, setShareChatMessages] = useState([]);
  const [isLoadingShareChatMessages, setIsLoadingShareChatMessages] = useState(false);

  const { isOpen: isAIModalOpen, onOpen: onAIModalOpen, onClose: onAIModalClose } = useDisclosure();
  const { isOpen: isChatModalOpen, onOpen: onChatModalOpen, onClose: onChatModalClose } = useDisclosure();
  const { isOpen: isOfferModalOpen, onOpen: onOfferModalOpen, onClose: onOfferModalClose } = useDisclosure();
  const { isOpen: isBlastModalOpen, onOpen: onBlastModalOpen, onClose: onBlastModalClose } = useDisclosure();
  const { isOpen: isBlastDetailsModalOpen, onOpen: onBlastDetailsModalOpen, onClose: onBlastDetailsModalClose } = useDisclosure();
  const { isOpen: isBotModalOpen, onOpen: onBotModalOpen, onClose: onBotModalClose } = useDisclosure();
  const { isOpen: isGoalsInterestsModalOpen, onOpen: onGoalsInterestsModalOpen, onClose: onGoalsInterestsModalClose } = useDisclosure();
  const { isOpen: isLiveRoomMessagesModalOpen, onOpen: onLiveRoomMessagesModalOpen, onClose: onLiveRoomMessagesModalClose } = useDisclosure();
  const { isOpen: isLiveRoomParticipantsModalOpen, onOpen: onLiveRoomParticipantsModalOpen, onClose: onLiveRoomParticipantsModalClose } = useDisclosure();
  const { isOpen: isClonePromptModalOpen, onOpen: onClonePromptModalOpen, onClose: onClonePromptModalClose } = useDisclosure();
  const { isOpen: isCloneLikesModalOpen, onOpen: onCloneLikesModalOpen, onClose: onCloneLikesModalClose } = useDisclosure();
  const { isOpen: isCloneCommentsModalOpen, onOpen: onCloneCommentsModalOpen, onClose: onCloneCommentsModalClose } = useDisclosure();
  const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
  const { isOpen: isShareChatroomsModalOpen, onOpen: onShareChatroomsModalOpen, onClose: onShareChatroomsModalClose } = useDisclosure();
  const { isOpen: isShareChatMessagesModalOpen, onOpen: onShareChatMessagesModalOpen, onClose: onShareChatMessagesModalClose } = useDisclosure();
  
  const toast = useToast();
  const cancelRef = useRef();
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "Openworldx@2026";

  // Helper functions for FCM
  const stringToArrayBuffer = (str) => {
    const pem = str
      .replace("-----BEGIN PRIVATE KEY-----\n", "")
      .replace("\n-----END PRIVATE KEY-----", "")
      .replace(/\n/g, "");
    const binaryString = atob(pem);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const arrayBufferToString = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return binary;
  };

  const getAccessToken = async () => {
    try {
      const payload = {
        iss: SERVICE_ACCOUNT.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };
      
      const header = { alg: "RS256", typ: "JWT" };
      
      const base64url = (str) => {
        return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      };
      
      const encodedHeader = base64url(JSON.stringify(header));
      const encodedPayload = base64url(JSON.stringify(payload));
      const signingInput = `${encodedHeader}.${encodedPayload}`;
      
      const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        stringToArrayBuffer(SERVICE_ACCOUNT.private_key),
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
      );
      
      const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        privateKey,
        new TextEncoder().encode(signingInput)
      );
      
      const encodedSignature = base64url(arrayBufferToString(signature));
      const jwt = `${signingInput}.${encodedSignature}`;
      
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: jwt,
        }),
      });
      
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  };

  const sendFCMNotification = async (fcmToken, message, username) => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        console.error("Failed to get access token");
        return false;
      }
      
      const response = await fetch(`https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id}/messages:send`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: {
              title: "Mira",
              body: message,
            },
            data: {
              type: "admin_message",
              message: message,
              username: username,
              timestamp: Date.now().toString(),
            },
            android: {
              priority: "high",
              notification: {
                sound: "default",
                channel_id: "admin_messages",
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: "default",
                  badge: 1,
                },
              },
            },
            webpush: {
              headers: {
                Urgency: "high",
              },
              notification: {
                icon: "/logohero.jpeg",
                badge: "/logohero.jpeg",
                requireInteraction: true,
                vibrate: [200, 100, 200],
              },
            },
          },
        }),
      });
      
      const result = await response.json();
      console.log("FCM V1 Response:", result);
      return result.name ? true : false;
    } catch (error) {
      console.error("FCM V1 Error:", error);
      return false;
    }
  };

  // Check for existing login on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem("dashboard_auth");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  // Format date helper
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      let date;
      if (timestamp instanceof Timestamp) {
        date = timestamp.toDate();
      } else if (timestamp?.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        return "Invalid date";
      }
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      let date;
      if (timestamp instanceof Timestamp) {
        date = timestamp.toDate();
      } else if (timestamp?.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        return "";
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return "";
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Never";
    
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const hasAISummaryData = (aiSummary) => {
    if (!aiSummary) return false;
    return (
      (aiSummary.interests?.length > 0) ||
      (aiSummary.skills?.length > 0) ||
      (aiSummary.goals?.length > 0) ||
      (aiSummary.wantingToHelpWith?.length > 0) ||
      (aiSummary.seekingHelpWith?.length > 0)
    );
  };

  // ============= EDIT USER FUNCTIONS =============
  const toggleEditMode = (user) => {
    if (editMode[user.id]) {
      setEditMode(prev => ({ ...prev, [user.id]: false }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [user.id]: {
          username: user.username || "",
          bio: user.bio || "",
          profession: user.profession || "",
          profilePicURL: user.profilePicURL || "",
        }
      }));
      setEditMode(prev => ({ ...prev, [user.id]: true }));
    }
  };

  const handleEditInputChange = (userId, field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value
      }
    }));
  };

  const handleProfilePicUpload = async (userId, file) => {
    if (!file) return;
    setUploadingImage(prev => ({ ...prev, [userId]: true }));
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `profile_pics/${userId}_${Date.now()}.${fileExt}`;
      const imageRef = storageRef(storage, fileName);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      setEditFormData(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          profilePicURL: downloadURL
        }
      }));
      toast({ title: "Image uploaded", description: "Profile picture uploaded successfully", status: "success", duration: 2000 });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({ title: "Upload failed", description: error.message, status: "error", duration: 3000 });
    } finally {
      setUploadingImage(prev => ({ ...prev, [userId]: false }));
    }
  };

  const saveUserEdits = async (userId) => {
    setIsSaving(prev => ({ ...prev, [userId]: true }));
    try {
      const userRef = doc(firestore, "users", userId);
      const updatedData = {
        username: editFormData[userId]?.username,
        bio: editFormData[userId]?.bio || "",
        profession: editFormData[userId]?.profession || "",
        profilePicURL: editFormData[userId]?.profilePicURL || "",
        updatedAt: serverTimestamp(),
      };
      await updateDoc(userRef, updatedData);
      setAllUsers(prevUsers => prevUsers.map(user => user.id === userId ? { ...user, ...updatedData } : user));
      setUserMap(prev => ({ ...prev, [userId]: { ...prev[userId], ...updatedData } }));
      setEditMode(prev => ({ ...prev, [userId]: false }));
      toast({ title: "User updated", description: "Changes saved successfully", status: "success", duration: 3000 });
    } catch (error) {
      console.error("Error saving user:", error);
      toast({ title: "Save failed", description: error.message, status: "error", duration: 3000 });
    } finally {
      setIsSaving(prev => ({ ...prev, [userId]: false }));
    }
  };

  const deleteUser = async (userId) => {
    try {
      const userRef = doc(firestore, "users", userId);
      await deleteDoc(userRef);
      setAllUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      setUserMap(prev => {
        const newMap = { ...prev };
        delete newMap[userId];
        return newMap;
      });
      toast({ title: "User deleted", description: "User has been removed", status: "warning", duration: 3000 });
      setDeleteConfirmUser(null);
      onDeleteConfirmClose();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({ title: "Delete failed", description: error.message, status: "error", duration: 3000 });
    }
  };

  // Fetch clone likes and comments for a specific user
  const fetchCloneLikesAndComments = useCallback(async (userId) => {
    try {
      const [likesSnapshot, commentsSnapshot] = await Promise.all([
        getDocs(query(collection(firestore, "cloneLikes"), where("cloneOwnerId", "==", userId))),
        getDocs(query(collection(firestore, "cloneComments"), where("cloneOwnerId", "==", userId)))
      ]);
      
      const likes = likesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const comments = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return { likes, comments };
    } catch (error) {
      console.error("Error fetching clone interactions:", error);
      return { likes: [], comments: [] };
    }
  }, []);

  // Fetch all clone users with their likes and comments
  const fetchAllCloneData = useCallback(async (usersList) => {
    const cloneUsersList = usersList.filter(user => user.cloneSystemPrompt && user.cloneSystemPrompt.length > 0);
    setCloneUsers(cloneUsersList);
    
    const likesMap = {};
    const commentsMap = {};
    
    await Promise.all(
      cloneUsersList.map(async (user) => {
        const { likes, comments } = await fetchCloneLikesAndComments(user.id);
        likesMap[user.id] = likes;
        commentsMap[user.id] = comments;
      })
    );
    
    setCloneLikesMap(likesMap);
    setCloneCommentsMap(commentsMap);
  }, [fetchCloneLikesAndComments]);

  // Send bot message function with FCM
  const sendBotMessage = async () => {
    if (!botMessageText.trim() || !botMessageUser) return;
    
    setIsSendingBotMessage(true);
    let fcmSent = false;
    
    try {
      await addDoc(collection(firestore, "bot"), {
        targetUserId: botMessageUser.id,
        message: botMessageText.trim(),
        sentAt: serverTimestamp(),
      });
      
      try {
        const userRef = doc(firestore, "users", botMessageUser.id);
        const userSnap = await getDoc(userRef);
        const fcmToken = userSnap.data()?.fcmToken;
        
        if (fcmToken) {
          fcmSent = await sendFCMNotification(
            fcmToken,
            botMessageText.trim(),
            botMessageUser.username
          );
        }
      } catch (fcmError) {
        console.error("FCM Error:", fcmError);
      }
      
      if (fcmSent) {
        toast({
          title: "✓ Message Sent!",
          description: `Message and push notification sent to ${botMessageUser.username}`,
          status: "success",
          duration: 4000,
          isClosable: true,
        });
      } else {
        toast({
          title: "⚠️ Message Saved",
          description: `Message saved to database. Push notification failed.`,
          status: "warning",
          duration: 4000,
        });
      }
      
      setBotMessageText("");
      onBotModalClose();
    } catch (error) {
      console.error("Error sending bot message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsSendingBotMessage(false);
    }
  };

  // Fetch Live Rooms from Realtime Database
  const fetchLiveRooms = useCallback(() => {
    const liveSessionsRef = ref(rtdb, 'live_sessions');
    
    onValue(liveSessionsRef, (snapshot) => {
      const rooms = [];
      const data = snapshot.val();
      
      if (data) {
        Object.keys(data).forEach(roomId => {
          const room = data[roomId];
          if (room && room.isActive === true) {
            rooms.push({
              id: roomId,
              hostUserId: room.hostUserId,
              hostUsername: room.hostUsername,
              topic: room.topic,
              isActive: room.isActive,
              startedAt: room.startedAt,
              participants: room.participants ? Object.keys(room.participants).length : 0,
              participantsList: room.participants || {},
              messageCount: room.messages ? Object.keys(room.messages).length : 0,
            });
          }
        });
      }
      
      setLiveRooms(rooms);
    }, (error) => {
      console.error("Error fetching live rooms:", error);
    });
  }, []);

  // Fetch messages for a specific live room
  const fetchLiveRoomMessages = useCallback(async (roomId) => {
    setIsLoadingMessages(true);
    try {
      const messagesRef = ref(rtdb, `live_sessions/${roomId}/messages`);
      
      const messages = await new Promise((resolve) => {
        onValue(messagesRef, (snapshot) => {
          const msgList = [];
          const data = snapshot.val();
          
          if (data) {
            Object.keys(data).forEach(key => {
              msgList.push({
                id: key,
                ...data[key]
              });
            });
          }
          
          resolve(msgList.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)));
        }, { onlyOnce: true });
      });
      
      setLiveRoomMessages(messages);
      return messages;
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Fetch participants for a specific live room
  const fetchLiveRoomParticipants = useCallback(async (roomId) => {
    try {
      const participantsRef = ref(rtdb, `live_sessions/${roomId}/participants`);
      
      const participants = await new Promise((resolve) => {
        onValue(participantsRef, (snapshot) => {
          const partList = [];
          const data = snapshot.val();
          
          if (data) {
            Object.keys(data).forEach(key => {
              partList.push({
                userId: key,
                ...data[key]
              });
            });
          }
          
          resolve(partList);
        }, { onlyOnce: true });
      });
      
      setLiveRoomParticipants(participants);
      return participants;
    } catch (error) {
      console.error("Error fetching participants:", error);
      return [];
    }
  }, []);

  const extractCloneName = (prompt) => {
    if (!prompt) return "No name";
    const match = prompt.match(/AI clone named ["']([^"']+)["']/);
    return match ? match[1] : "Unnamed Clone";
  };

  // OPTIMIZED: Fetch all data without nested queries
  const fetchAllData = useCallback(async () => {
    setIsFetching(true);
    
    try {
      console.log("🚀 Fetching all data in parallel (optimized)...");
      
      const [
        usersSnapshot,
        offersSnapshot,
        chatRoomsSnapshot,
        postsSnapshot
      ] = await Promise.all([
        getDocs(collection(firestore, "users")),
        getDocs(collection(firestore, "offers")),
        getDocs(collection(firestore, "chatRooms")).catch(err => {
          console.warn("Chat rooms may not exist:", err);
          return { docs: [] };
        }),
        getDocs(query(collection(firestore, "posts"), where("type", "==", "blast"))).catch(err => {
          console.warn("Blasts may not exist:", err);
          return { docs: [] };
        })
      ]);
      
      const usersMap = {};
      const usersList = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        const userObj = {
          id: doc.id,
          username: data.username || "No username",
          email: data.email || "",
          profilePicURL: data.profilePicURL || "",
          profession: data.profession || "",
          bio: data.bio || "",
          rating: data.rating || 0,
          aiChatHistory: data.aiChatHistory || [],
          aiSummary: data.aiSummary || null,
          createdAt: data.createdAt,
          interests: data.interests || [],
          skills: data.skills || [],
          goals: data.goals || [],
          cloneSystemPrompt: data.cloneSystemPrompt || "",
          isOnline: false,
          presenceStatus: "offline",
          lastSeen: null,
        };
        usersMap[doc.id] = userObj;
        return userObj;
      });
      
      setAllUsers(usersList);
      setUserMap(usersMap);
      
      await fetchAllCloneData(usersList);
      
      const allOffers = offersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
        connectedAt: doc.data().connectedAt?.toDate?.() || null
      }));
      
      const pending = allOffers.filter(o => o.status === "pending" && o.type === "connection_request");
      const accepted = allOffers.filter(o => o.status === "connected" && o.type === "connection_request");
      const rejected = allOffers.filter(o => o.status === "rejected" && o.type === "connection_request");
      
      setAllPendingRequests(pending);
      setAllAcceptedConnections(accepted);
      setAllRejectedRequests(rejected);
      setTotalPendingRequests(pending.length);
      setTotalAcceptedConnections(accepted.length);
      setTotalRejectedRequests(rejected.length);
      
      const updatePaginated = (page, items, setter, setPages) => {
        const start = (page - 1) * PAGE_SIZE;
        setter(items.slice(start, start + PAGE_SIZE));
        setPages(Math.ceil(items.length / PAGE_SIZE));
      };
      
      updatePaginated(pendingPage, pending, setPendingRequests, setTotalPendingPages);
      updatePaginated(acceptedPage, accepted, setAcceptedConnections, setTotalAcceptedPages);
      updatePaginated(rejectedPage, rejected, setRejectedRequests, setTotalRejectedPages);
      
      const roomsList = [];
      for (const docSnapshot of chatRoomsSnapshot.docs) {
        const roomData = docSnapshot.data();
        roomsList.push({
          id: docSnapshot.id,
          ...roomData,
          messageCount: 0,
          createdAt: roomData.createdAt,
          lastActivity: roomData.lastActivity,
          participants: roomData.participants || [],
        });
      }
      
      setAllChatRooms(roomsList);
      setTotalChatRooms(roomsList.length);
      setTotalMessages(0);
      setAvgMessagesPerRoom(0);
      setTotalChatRoomsPages(Math.ceil(roomsList.length / PAGE_SIZE));
      setChatRooms(roomsList.slice(0, PAGE_SIZE));
      
      const blastList = [];
      let totalCommentCount = 0;
      let activeCount = 0;
      let userMessageCount = {};
      
      for (const docSnapshot of postsSnapshot.docs) {
        const blastData = docSnapshot.data();
        const commentCount = blastData.commentCount || 0;
        totalCommentCount += commentCount;
        
        if (blastData.status === "active") {
          activeCount++;
        }
        
        const userId = blastData.createdBy;
        if (userId) {
          userMessageCount[userId] = (userMessageCount[userId] || 0) + 1;
        }
        
        blastList.push({
          id: docSnapshot.id,
          ...blastData,
          actualCommentCount: commentCount,
          comments: [],
          creatorName: usersMap[userId]?.username || userId?.substring(0, 15) || "Unknown",
          creatorProfilePic: usersMap[userId]?.profilePicURL || "",
        });
      }
      
      let maxCount = 0;
      let mostActiveUserId = "";
      Object.entries(userMessageCount).forEach(([userId, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostActiveUserId = userId;
        }
      });
      
      setMostActiveUser({
        name: usersMap[mostActiveUserId]?.username || mostActiveUserId?.substring(0, 15) || "Unknown",
        count: maxCount
      });
      
      setAllBlasts(blastList);
      setTotalBlasts(blastList.length);
      setTotalComments(totalCommentCount);
      setActiveBlasts(activeCount);
      setTotalBlastsPages(Math.ceil(blastList.length / PAGE_SIZE));
      setBlasts(blastList.slice(0, PAGE_SIZE));
      
      setPeakHour("6 PM - 9 PM");
      setAvgDailyActiveUsers(Math.round(onlineUsers.length * 0.7));
      
      console.log("✅ Data loaded instantly!", {
        users: usersList.length,
        cloneUsers: cloneUsers.length,
        offers: allOffers.length,
        chatRooms: roomsList.length,
        blasts: blastList.length
      });
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ 
        title: "Error", 
        description: "Failed to load dashboard data: " + error.message, 
        status: "error", 
        duration: 5000 
      });
    } finally {
      setIsFetching(false);
    }
  }, [pendingPage, acceptedPage, rejectedPage, onlineUsers.length, fetchAllCloneData]);

  // Lazy load chat room messages when needed
  const fetchChatRoomMessages = useCallback(async (roomId) => {
    try {
      const messagesRef = collection(firestore, `chatRooms/${roomId}/messages`);
      const messagesSnapshot = await getDocs(messagesRef);
      const messageCount = messagesSnapshot.size;
      
      setAllChatRooms(prev => prev.map(room => 
        room.id === roomId ? { ...room, messageCount } : room
      ));
      
      setTotalMessages(prev => prev + messageCount);
      
      return messageCount;
    } catch (error) {
      console.error("Error fetching messages:", error);
      return 0;
    }
  }, []);

  // Lazy load blast comments when modal opens
  const loadBlastComments = useCallback(async (blastId) => {
    setIsLoadingComments(true);
    try {
      const commentsRef = collection(firestore, `posts/${blastId}/comments`);
      const commentsSnapshot = await getDocs(commentsRef);
      const commentsList = commentsSnapshot.docs.map(commentDoc => ({
        id: commentDoc.id,
        ...commentDoc.data(),
      }));
      setBlastComments(commentsList);
      return commentsList;
    } catch (error) {
      console.error("Error fetching comments:", error);
      setBlastComments([]);
      return [];
    } finally {
      setIsLoadingComments(false);
    }
  }, []);

  // Open clone likes modal
  const openCloneLikesModal = useCallback(async (user) => {
    setSelectedCloneUser(user);
    setIsLoadingCloneLikes(true);
    try {
      const likes = cloneLikesMap[user.id] || [];
      setSelectedCloneLikes(likes);
      onCloneLikesModalOpen();
    } finally {
      setIsLoadingCloneLikes(false);
    }
  }, [cloneLikesMap, onCloneLikesModalOpen]);

  // Open clone comments modal
  const openCloneCommentsModal = useCallback(async (user) => {
    setSelectedCloneUser(user);
    setIsLoadingCloneComments(true);
    try {
      const comments = cloneCommentsMap[user.id] || [];
      setSelectedCloneComments(comments);
      onCloneCommentsModalOpen();
    } finally {
      setIsLoadingCloneComments(false);
    }
  }, [cloneCommentsMap, onCloneCommentsModalOpen]);

  // Modified openBlastComments to lazy load
  const openBlastCommentsWithLazyLoad = useCallback(async (blast) => {
    setSelectedBlast(blast);
    onBlastModalOpen();
    await loadBlastComments(blast.id);
  }, [loadBlastComments, onBlastModalOpen]);

  // Open chat rooms list for a share's creator
  const openShareUserChatrooms = useCallback(async (blast) => {
    setSelectedShareBlast(blast);
    setIsLoadingShareChatRooms(true);
    onShareChatroomsModalOpen();
    try {
      const userRooms = allChatRooms.filter(room =>
        room.participants && room.participants.includes(blast.createdBy)
      );
      setShareUserChatRooms(userRooms);
    } catch (error) {
      console.error("Error finding share chat rooms:", error);
      setShareUserChatRooms([]);
    } finally {
      setIsLoadingShareChatRooms(false);
    }
  }, [allChatRooms, onShareChatroomsModalOpen]);

  // Open messages for a specific share chat room
  const openShareChatMessages = useCallback(async (room) => {
    setSelectedShareChatRoom(room);
    setIsLoadingShareChatMessages(true);
    onShareChatMessagesModalOpen();
    try {
      const messagesRef = collection(firestore, `chatRooms/${room.id}/messages`);
      const messagesSnapshot = await getDocs(messagesRef);
      const messages = messagesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      messages.sort((a, b) => {
        const aTime = a.timestamp?.seconds || 0;
        const bTime = b.timestamp?.seconds || 0;
        return aTime - bTime;
      });
      setShareChatMessages(messages);
    } catch (error) {
      console.error("Error fetching share chat messages:", error);
      setShareChatMessages([]);
    } finally {
      setIsLoadingShareChatMessages(false);
    }
  }, [onShareChatMessagesModalOpen]);

  // Open live room messages modal
  const openLiveRoomMessages = useCallback(async (room) => {
    setSelectedLiveRoom(room);
    await fetchLiveRoomMessages(room.id);
    onLiveRoomMessagesModalOpen();
  }, [fetchLiveRoomMessages, onLiveRoomMessagesModalOpen]);

  // Open live room participants modal
  const openLiveRoomParticipants = useCallback(async (room) => {
    setSelectedLiveRoom(room);
    await fetchLiveRoomParticipants(room.id);
    onLiveRoomParticipantsModalOpen();
  }, [fetchLiveRoomParticipants, onLiveRoomParticipantsModalOpen]);

  // Open clone prompt modal
  const openClonePromptModal = useCallback((user) => {
    setSelectedCloneUser(user);
    onClonePromptModalOpen();
  }, [onClonePromptModalOpen]);

  // Update paginated lists when pages change
  useEffect(() => {
    if (allPendingRequests.length) {
      const start = (pendingPage - 1) * PAGE_SIZE;
      setPendingRequests(allPendingRequests.slice(start, start + PAGE_SIZE));
    }
  }, [pendingPage, allPendingRequests]);
  
  useEffect(() => {
    if (allAcceptedConnections.length) {
      const start = (acceptedPage - 1) * PAGE_SIZE;
      setAcceptedConnections(allAcceptedConnections.slice(start, start + PAGE_SIZE));
    }
  }, [acceptedPage, allAcceptedConnections]);
  
  useEffect(() => {
    if (allRejectedRequests.length) {
      const start = (rejectedPage - 1) * PAGE_SIZE;
      setRejectedRequests(allRejectedRequests.slice(start, start + PAGE_SIZE));
    }
  }, [rejectedPage, allRejectedRequests]);

  // Set up REAL-TIME presence listener from Realtime Database
  useEffect(() => {
    if (!isAuthenticated) return;
    
    console.log("Setting up Realtime Database presence listener...");
    
    fetchAllData();
    fetchLiveRooms();
    
    const presenceRef = ref(rtdb, 'presence');
    
    onValue(presenceRef, (snapshot) => {
      const presence = snapshot.val();
      console.log("Presence update from RTDB:", presence ? Object.keys(presence).length : 0, "users");
      
      if (presence) {
        setAllUsers(prevUsers => {
          const updatedUsers = prevUsers.map(user => {
            const userPresence = presence[user.id];
            return {
              ...user,
              isOnline: userPresence?.status === "online",
              presenceStatus: userPresence?.status || "offline",
              lastSeen: userPresence?.lastSeen || user.lastSeen,
            };
          });
          
          const online = updatedUsers.filter(user => user.isOnline);
          setOnlineUsers(online);
          
          return updatedUsers;
        });
      } else {
        setAllUsers(prevUsers => {
          const updatedUsers = prevUsers.map(user => ({
            ...user,
            isOnline: false,
            presenceStatus: "offline",
          }));
          setOnlineUsers([]);
          return updatedUsers;
        });
      }
    }, (error) => {
      console.error("RTDB Presence listener error:", error);
    });
    
    return () => {
      console.log("Cleaning up RTDB presence listener");
      off(presenceRef);
    };
  }, [isAuthenticated, fetchAllData, fetchLiveRooms]);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...allUsers];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.profession?.toLowerCase().includes(term) ||
        user.bio?.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== "all") {
      result = result.filter(user => user.presenceStatus === statusFilter);
    }
    
    if (hasAIDataFilter === "has") {
      result = result.filter(user => hasAISummaryData(user.aiSummary));
    } else if (hasAIDataFilter === "none") {
      result = result.filter(user => !hasAISummaryData(user.aiSummary));
    }
    
    if (chatHistoryFilter === "has") {
      result = result.filter(user => user.aiChatHistory && user.aiChatHistory.length > 0);
    } else if (chatHistoryFilter === "none") {
      result = result.filter(user => !user.aiChatHistory || user.aiChatHistory.length === 0);
    }
    
    result.sort((a, b) => {
      let aVal, bVal;
      switch(sortBy) {
        case "username":
          aVal = a.username.toLowerCase();
          bVal = b.username.toLowerCase();
          break;
        case "rating":
          aVal = a.rating || 0;
          bVal = b.rating || 0;
          break;
        case "lastSeen":
          aVal = a.lastSeen || 0;
          bVal = b.lastSeen || 0;
          break;
        case "chatCount":
          aVal = a.aiChatHistory?.length || 0;
          bVal = b.aiChatHistory?.length || 0;
          break;
        default:
          aVal = a.username.toLowerCase();
          bVal = b.username.toLowerCase();
      }
      
      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return result;
  }, [allUsers, searchTerm, statusFilter, hasAIDataFilter, chatHistoryFilter, sortBy, sortOrder]);

  // Filter and sort live rooms
  const filteredAndSortedLiveRooms = useMemo(() => {
    let result = [...liveRooms];
    
    if (liveRoomSearchTerm) {
      const term = liveRoomSearchTerm.toLowerCase();
      result = result.filter(room => 
        room.hostUsername?.toLowerCase().includes(term) ||
        room.topic?.toLowerCase().includes(term)
      );
    }
    
    if (liveRoomStatusFilter !== "all") {
      result = result.filter(room => 
        liveRoomStatusFilter === "active" ? room.isActive : !room.isActive
      );
    }
    
    result.sort((a, b) => {
      let aVal, bVal;
      switch(liveRoomSortBy) {
        case "host":
          aVal = a.hostUsername?.toLowerCase() || "";
          bVal = b.hostUsername?.toLowerCase() || "";
          break;
        case "participants":
          aVal = a.participants || 0;
          bVal = b.participants || 0;
          break;
        case "messages":
          aVal = a.messageCount || 0;
          bVal = b.messageCount || 0;
          break;
        case "started":
          aVal = a.startedAt || 0;
          bVal = b.startedAt || 0;
          break;
        default:
          aVal = a.participants || 0;
          bVal = b.participants || 0;
      }
      
      if (liveRoomSortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return result;
  }, [liveRooms, liveRoomSearchTerm, liveRoomStatusFilter, liveRoomSortBy, liveRoomSortOrder]);

  // Filter and sort clone users
  const filteredAndSortedCloneUsers = useMemo(() => {
    let result = [...cloneUsers];
    
    if (cloneSearchTerm) {
      const term = cloneSearchTerm.toLowerCase();
      result = result.filter(user => 
        user.username?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.profession?.toLowerCase().includes(term)
      );
    }
    
    result.sort((a, b) => {
      let aVal, bVal;
      switch(cloneSortBy) {
        case "username":
          aVal = a.username?.toLowerCase() || "";
          bVal = b.username?.toLowerCase() || "";
          break;
        case "profession":
          aVal = a.profession?.toLowerCase() || "";
          bVal = b.profession?.toLowerCase() || "";
          break;
        case "promptLength":
          aVal = a.cloneSystemPrompt?.length || 0;
          bVal = b.cloneSystemPrompt?.length || 0;
          break;
        default:
          aVal = a.username?.toLowerCase() || "";
          bVal = b.username?.toLowerCase() || "";
      }
      
      if (cloneSortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return result;
  }, [cloneUsers, cloneSearchTerm, cloneSortBy, cloneSortOrder]);

  // Filter and sort edit users
  const filteredAndSortedEditUsers = useMemo(() => {
    let result = [...allUsers];
    
    if (editUsersSearchTerm) {
      const term = editUsersSearchTerm.toLowerCase();
      result = result.filter(user => 
        user.username?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.profession?.toLowerCase().includes(term) ||
        user.bio?.toLowerCase().includes(term)
      );
    }
    
    result.sort((a, b) => {
      let aVal, bVal;
      switch(editUsersSortBy) {
        case "username":
          aVal = a.username?.toLowerCase() || "";
          bVal = b.username?.toLowerCase() || "";
          break;
        case "profession":
          aVal = a.profession?.toLowerCase() || "";
          bVal = b.profession?.toLowerCase() || "";
          break;
        case "email":
          aVal = a.email?.toLowerCase() || "";
          bVal = b.email?.toLowerCase() || "";
          break;
        default:
          aVal = a.username?.toLowerCase() || "";
          bVal = b.username?.toLowerCase() || "";
      }
      
      if (editUsersSortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return result;
  }, [allUsers, editUsersSearchTerm, editUsersSortBy, editUsersSortOrder]);

  // Pagination for users
  const currentUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedUsers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredAndSortedUsers, currentPage]);

  // Current page live rooms
  const currentLiveRooms = useMemo(() => {
    const startIndex = (liveRoomsPage - 1) * PAGE_SIZE;
    return filteredAndSortedLiveRooms.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredAndSortedLiveRooms, liveRoomsPage]);

  // Current page clone users
  const currentCloneUsers = useMemo(() => {
    const startIndex = (cloneUsersPage - 1) * PAGE_SIZE;
    return filteredAndSortedCloneUsers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredAndSortedCloneUsers, cloneUsersPage]);

  // Current page edit users
  const currentEditUsers = useMemo(() => {
    const startIndex = (editUsersPage - 1) * PAGE_SIZE;
    return filteredAndSortedEditUsers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredAndSortedEditUsers, editUsersPage]);

  const totalEditUsersPages = Math.ceil(filteredAndSortedEditUsers.length / PAGE_SIZE);

  // Update total pages
  useEffect(() => {
    setTotalPages(Math.ceil(filteredAndSortedUsers.length / PAGE_SIZE));
    if (currentPage > Math.ceil(filteredAndSortedUsers.length / PAGE_SIZE)) {
      setCurrentPage(1);
    }
  }, [filteredAndSortedUsers, currentPage]);

  useEffect(() => {
    setTotalLiveRoomsPages(Math.ceil(filteredAndSortedLiveRooms.length / PAGE_SIZE));
  }, [filteredAndSortedLiveRooms]);

  useEffect(() => {
    setTotalCloneUsersPages(Math.ceil(filteredAndSortedCloneUsers.length / PAGE_SIZE));
  }, [filteredAndSortedCloneUsers]);

  useEffect(() => {
    setTotalChatRoomsPages(Math.ceil(allChatRooms.length / PAGE_SIZE));
  }, [allChatRooms]);

  useEffect(() => {
    setTotalBlastsPages(Math.ceil(allBlasts.length / PAGE_SIZE));
  }, [allBlasts]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginLoading(true);

    setTimeout(() => {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        localStorage.setItem("dashboard_auth", "true");
        toast({ title: "Login Successful", description: "Welcome to the Admin Dashboard!", status: "success", duration: 3000 });
        fetchAllData();
        fetchLiveRooms();
      } else {
        toast({ title: "Login Failed", description: "Invalid username or password.", status: "error", duration: 3000 });
      }
      setLoginLoading(false);
    }, 500);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
    setAllUsers([]);
    setOnlineUsers([]);
    setAllPendingRequests([]);
    setAllAcceptedConnections([]);
    setAllRejectedRequests([]);
    setAllChatRooms([]);
    setAllBlasts([]);
    setLiveRooms([]);
    setCloneUsers([]);
    setCloneLikesMap({});
    setCloneCommentsMap({});
    localStorage.removeItem("dashboard_auth");
    toast({ title: "Logged Out", description: "You have been logged out.", status: "info", duration: 3000 });
  };

  const handleRefresh = () => {
    fetchAllData();
    fetchLiveRooms();
    toast({ title: "Refreshing", description: "Fetching latest data...", status: "info", duration: 2000 });
  };

  const openChatHistory = (user) => {
    setSelectedUser(user);
    setSelectedChatHistory(user.aiChatHistory || []);
    onChatModalOpen();
  };

  const openAIModal = (user) => {
    setSelectedUser(user);
    onAIModalOpen();
  };

  const openGoalsInterestsModal = (user) => {
    setSelectedUser(user);
    onGoalsInterestsModalOpen();
  };

  const openOfferDetails = (offer) => {
    setSelectedOffer(offer);
    onOfferModalOpen();
  };

  const openBlastDetails = (blast) => {
    setSelectedBlast(blast);
    setBlastCreator(userMap[blast.createdBy] || null);
    onBlastDetailsModalOpen();
  };

  const openBotMessageModal = (user) => {
    setBotMessageUser(user);
    setBotMessageText("");
    onBotModalOpen();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'online': return 'green';
      case 'offline': return 'gray';
      case 'away': return 'orange';
      default: return 'gray';
    }
  };

  const getReputationColor = (rating) => {
    if (rating >= 80) return 'purple';
    if (rating >= 60) return 'yellow';
    if (rating >= 40) return 'blue';
    return 'gray';
  };

  const getLastSeenText = (user) => {
    if (user.isOnline) return "Online now";
    if (user.lastSeen) return formatRelativeTime(user.lastSeen);
    return "Never seen";
  };

  const getOfferStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <Badge colorScheme="yellow">Pending</Badge>;
      case 'connected':
        return <Badge colorScheme="green">Connected</Badge>;
      case 'rejected':
        return <Badge colorScheme="red">Rejected</Badge>;
      default:
        return <Badge colorScheme="gray">{status}</Badge>;
    }
  };

  const renderFullAISummary = (aiSummary) => {
    if (!aiSummary) {
      return (
        <VStack py={8} spacing={3}>
          <Icon as={FaRobot} boxSize={12} color="gray.600" />
          <Text color="gray.500">No AI data available for this user</Text>
          <Text fontSize="sm" color="gray.400">User hasn&apos;t interacted with Mira yet</Text>
        </VStack>
      );
    }
    
    const hasData = hasAISummaryData(aiSummary);
    if (!hasData) {
      return (
        <VStack py={8} spacing={3}>
          <Icon as={FaRobot} boxSize={12} color="gray.600" />
          <Text color="gray.500">No AI summary data yet</Text>
          <Text fontSize="sm" color="gray.400">User hasn&apos;t shared enough information</Text>
        </VStack>
      );
    }
    
    return (
      <VStack align="start" spacing={5} w="100%">
        {aiSummary.interests?.length > 0 && (
          <Box w="100%">
            <HStack mb={3}><Icon as={FaHeart} color="pink.400" boxSize={5} /><Text fontWeight="bold" color="white">Interests</Text><Badge colorScheme="pink" ml={2}>{aiSummary.interests.length}</Badge></HStack>
            <Wrap spacing={2}>{aiSummary.interests.map((interest, idx) => (<WrapItem key={idx}><Badge colorScheme="pink" px={3} py={1} borderRadius="full">{interest}</Badge></WrapItem>))}</Wrap>
          </Box>
        )}
        {aiSummary.skills?.length > 0 && (
          <Box w="100%">
            <HStack mb={3}><Icon as={FaLightbulb} color="yellow.400" boxSize={5} /><Text fontWeight="bold" color="white">Skills</Text><Badge colorScheme="yellow" ml={2}>{aiSummary.skills.length}</Badge></HStack>
            <Wrap spacing={2}>{aiSummary.skills.map((skill, idx) => (<WrapItem key={idx}><Badge colorScheme="yellow" px={3} py={1} borderRadius="full">{skill}</Badge></WrapItem>))}</Wrap>
          </Box>
        )}
        {aiSummary.goals?.length > 0 && (
          <Box w="100%">
            <HStack mb={3}><Icon as={FaUser} color="green.400" boxSize={5} /><Text fontWeight="bold" color="white">Goals</Text><Badge colorScheme="green" ml={2}>{aiSummary.goals.length}</Badge></HStack>
            <Wrap spacing={2}>{aiSummary.goals.map((goal, idx) => (<WrapItem key={idx}><Badge colorScheme="green" px={3} py={1} borderRadius="full">{goal}</Badge></WrapItem>))}</Wrap>
          </Box>
        )}
        {aiSummary.wantingToHelpWith?.length > 0 && (
          <Box w="100%">
            <HStack mb={3}><Icon as={FaHandsHelping} color="blue.400" boxSize={5} /><Text fontWeight="bold" color="white">Can Help With</Text><Badge colorScheme="blue" ml={2}>{aiSummary.wantingToHelpWith.length}</Badge></HStack>
            <Wrap spacing={2}>{aiSummary.wantingToHelpWith.map((help, idx) => (<WrapItem key={idx}><Badge colorScheme="blue" px={3} py={1} borderRadius="full">{help}</Badge></WrapItem>))}</Wrap>
          </Box>
        )}
        {aiSummary.seekingHelpWith?.length > 0 && (
          <Box w="100%">
            <HStack mb={3}><Icon as={FaUserFriends} color="orange.400" boxSize={5} /><Text fontWeight="bold" color="white">Needs Help With</Text><Badge colorScheme="orange" ml={2}>{aiSummary.seekingHelpWith.length}</Badge></HStack>
            <Wrap spacing={2}>{aiSummary.seekingHelpWith.map((need, idx) => (<WrapItem key={idx}><Badge colorScheme="orange" px={3} py={1} borderRadius="full">{need}</Badge></WrapItem>))}</Wrap>
          </Box>
        )}
        {aiSummary.lastUpdated && <Text fontSize="xs" color="gray.500" pt={2}>Last updated: {formatDate(aiSummary.lastUpdated)}</Text>}
      </VStack>
    );
  };

  const renderAISummaryPreview = (user) => {
    const hasData = hasAISummaryData(user.aiSummary);
    
    if (!hasData) {
      return (
        <HStack spacing={2}>
          <Icon as={FaRobot} color="gray.500" boxSize="12px" />
          <Text fontSize="xs" color="gray.500">No AI data</Text>
          <Badge colorScheme="gray" fontSize="9px">No Data</Badge>
        </HStack>
      );
    }
    
    return (
      <HStack spacing={2}>
        <Icon as={FaRobot} color="blue.400" boxSize="12px" />
        <Text fontSize="xs" color="blue.400" noOfLines={1}>
          {user.aiSummary.interests?.length > 0 && `${user.aiSummary.interests.length} interests`}
          {user.aiSummary.skills?.length > 0 && `, ${user.aiSummary.skills.length} skills`}
          {user.aiSummary.goals?.length > 0 && `, ${user.aiSummary.goals.length} goals`}
        </Text>
        <IconButton 
          icon={<FaExpand />} 
          size="xs" 
          variant="ghost" 
          color="blue.400" 
          onClick={() => openAIModal(user)} 
          aria-label="View full AI summary"
        />
      </HStack>
    );
  };

  const renderGoalsInterestsPreview = (user) => {
    const goals = user.goals || [];
    const interests = user.interests || [];
    const totalItems = goals.length + interests.length;
    
    if (totalItems === 0) {
      return (
        <HStack spacing={2}>
          <Icon as={FaBullseye} color="gray.500" boxSize="12px" />
          <Text fontSize="xs" color="gray.500">No goals or interests</Text>
        </HStack>
      );
    }
    
    return (
      <VStack align="start" spacing={1}>
        {goals.length > 0 && (
          <HStack spacing={1}>
            <Icon as={FaUser} color="green.400" boxSize="10px" />
            <Text fontSize="xs" color="gray.400" noOfLines={1}>
              {goals.slice(0, 2).join(", ")}
              {goals.length > 2 && ` +${goals.length - 2}`}
            </Text>
          </HStack>
        )}
        {interests.length > 0 && (
          <HStack spacing={1}>
            <Icon as={FaHeart} color="pink.400" boxSize="10px" />
            <Text fontSize="xs" color="gray.400" noOfLines={1}>
              {interests.slice(0, 2).join(", ")}
              {interests.length > 2 && ` +${interests.length - 2}`}
            </Text>
          </HStack>
        )}
        <HStack spacing={2}>
          <Badge colorScheme="green" fontSize="9px">{goals.length} goals</Badge>
          <Badge colorScheme="pink" fontSize="9px">{interests.length} interests</Badge>
          <IconButton 
            icon={<FaExpand />} 
            size="xs" 
            variant="ghost" 
            color="blue.400" 
            onClick={() => openGoalsInterestsModal(user)} 
            aria-label="View goals and interests"
          />
        </HStack>
      </VStack>
    );
  };

  const renderChatHistoryPreview = (user) => {
    const chatHistory = user.aiChatHistory;
    if (!chatHistory || chatHistory.length === 0) {
      return <Text color="gray.500" fontSize="xs">No chats with Mira</Text>;
    }
    
    const lastMessage = chatHistory[chatHistory.length - 1];
    return (
      <HStack spacing={2}>
        <Icon as={FaComment} color="purple.400" boxSize="10px" />
        <Text fontSize="xs" color="gray.400" noOfLines={1} flex={1}>
          {lastMessage.sender === "user" ? `${user.username}: ` : "Mira: "}
          {lastMessage.text?.substring(0, 35)}...
        </Text>
        <IconButton icon={<FaExpand />} size="xs" variant="ghost" color="blue.400" onClick={() => openChatHistory(user)} aria-label="View full chat" />
      </HStack>
    );
  };

  // Pagination component
  const PaginationControls = ({ currentPage, totalPages, onPageChange, isDisabled }) => (
    <Flex justify="center" align="center" mt={6} gap={4}>
      <Button
        leftIcon={<FaChevronLeft />}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        isDisabled={currentPage === 1 || isDisabled}
        size="sm"
        variant="outline"
        colorScheme="blue"
      >
        Previous
      </Button>
      <Text color="gray.400" fontSize="sm">
        Page {currentPage} of {totalPages}
      </Text>
      <Button
        rightIcon={<FaChevronRight />}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        isDisabled={currentPage === totalPages || isDisabled}
        size="sm"
        variant="outline"
        colorScheme="blue"
      >
        Next
      </Button>
    </Flex>
  );

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="black">
        <Spinner color="blue.500" size="xl" />
      </Flex>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <Flex position="fixed" top={0} left={0} right={0} bottom={0} align="center" justify="center" bg="black" zIndex={9999}>
        <Container maxW="md">
          <Card bg="rgba(0,0,0,0.95)" border="1px solid rgba(0,100,255,0.3)" borderRadius="2xl" backdropFilter="blur(10px)">
            <CardBody p={10}>
              <VStack spacing={8}>
                <Icon as={FaLock} boxSize={16} color="blue.500" />
                <Heading size="xl" color="white">Admin Dashboard</Heading>
                <Text color="gray.400">Enter your credentials to access the dashboard</Text>
                <form onSubmit={handleLogin} style={{ width: "100%" }}>
                  <VStack spacing={5}>
                    <Input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} bg="rgba(255,255,255,0.05)" border="1px solid rgba(0,100,255,0.3)" color="white" size="lg" required />
                    <InputGroup>
                      <Input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} bg="rgba(255,255,255,0.05)" border="1px solid rgba(0,100,255,0.3)" color="white" size="lg" required />
                      <InputRightElement width="4.5rem"><Button h="2rem" size="sm" onClick={() => setShowPassword(!showPassword)} variant="ghost">{showPassword ? "Hide" : "Show"}</Button></InputRightElement>
                    </InputGroup>
                    <Button type="submit" width="full" isLoading={loginLoading} loadingText="Logging in..." size="lg" bg="blue.600" color="white" _hover={{ bg: "blue.700" }}>Login</Button>
                  </VStack>
                </form>
              </VStack>
            </CardBody>
          </Card>
        </Container>
      </Flex>
    );
  }

  // Dashboard Content
  return (
    <Flex minH="100vh" w="100%" bg="black" direction="column">
      {/* Header */}
      <Box bg="rgba(0,0,0,0.95)" borderBottom="1px solid rgba(0,100,255,0.3)" position="sticky" top={0} zIndex={10} backdropFilter="blur(10px)">
        <Container maxW="container.xl" py={4}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <Flex align="center" gap={4}>
              <Icon as={FaChartLine} boxSize={8} color="blue.500" />
              <Heading size="lg" color="white">OpenWorldX Admin</Heading>
            </Flex>
            <HStack spacing={4}>
              <Badge colorScheme="blue" fontSize="md" px={3} py={1.5} borderRadius="full"><HStack spacing={1}><Icon as={FaUsers} /><Text>{allUsers.length} Users</Text></HStack></Badge>
              <Badge colorScheme="green" fontSize="md" px={3} py={1.5} borderRadius="full"><HStack spacing={1}><Icon as={FaGlobe} /><Text>{onlineUsers.length} Online</Text></HStack></Badge>
              <Badge colorScheme="yellow" fontSize="md" px={3} py={1.5} borderRadius="full"><HStack spacing={1}><Icon as={FaClock} /><Text>{totalPendingRequests} Pending</Text></HStack></Badge>
              <Badge colorScheme="green" fontSize="md" px={3} py={1.5} borderRadius="full"><HStack spacing={1}><Icon as={FaCheckCircle} /><Text>{totalAcceptedConnections} Connected</Text></HStack></Badge>
              <Badge colorScheme="purple" fontSize="md" px={3} py={1.5} borderRadius="full"><HStack spacing={1}><Icon as={FaVideo} /><Text>{liveRooms.length} Live</Text></HStack></Badge>
              <IconButton icon={<FaSync />} onClick={handleRefresh} isLoading={isFetching} variant="ghost" color="gray.400" _hover={{ color: "white" }} aria-label="Refresh" />
              <Button colorScheme="red" variant="outline" onClick={handleLogout}>Logout</Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Box flex={1}>
        <Container maxW="container.xl" py={6}>
          <Tabs variant="soft-rounded" colorScheme="blue" index={tabIndex} onChange={setTabIndex}>
            <TabList
              mb={6}
              bg="rgba(255,255,255,0.02)"
              p={2}
              borderRadius="xl"
              border="1px solid rgba(0,100,255,0.15)"
              overflowX="auto"
              flexWrap="nowrap"
              css={{ "&::-webkit-scrollbar": { height: "4px" }, "&::-webkit-scrollbar-thumb": { background: "rgba(66,153,225,0.4)", borderRadius: "4px" } }}
            >
              {[
                { icon: FaUsers,     label: "Users",       count: filteredAndSortedUsers.length },
                { icon: FaUserEdit,  label: "Edit Users",  count: allUsers.length },
                { icon: FaGlobe,     label: "Online",      count: onlineUsers.length },
                { icon: FaInbox,     label: "Offers",      count: totalPendingRequests + totalAcceptedConnections + totalRejectedRequests },
                { icon: FaComments,  label: "Chat Rooms",  count: totalChatRooms },
                { icon: FaFire,      label: "Shares",      count: totalBlasts },
                { icon: FaVideo,     label: "Live Rooms",  count: liveRooms.length },
                { icon: FaRobot,     label: "Clone Users", count: cloneUsers.length },
                { icon: FaChartBar,  label: "Analytics",   count: null },
              ].map(({ icon: IconComp, label, count }, i) => (
                <Tab
                  key={i}
                  px={3}
                  py={2}
                  fontSize="sm"
                  fontWeight="semibold"
                  borderRadius="lg"
                  color="gray.400"
                  whiteSpace="nowrap"
                  flexShrink={0}
                  _selected={{ bg: "blue.600", color: "white", shadow: "0 0 10px rgba(66,153,225,0.4)" }}
                  _hover={{ bg: "rgba(66,153,225,0.15)", color: "white" }}
                >
                  <HStack spacing={1.5}>
                    <Box as={IconComp} fontSize="12px" />
                    <Text fontSize="sm">{label}{count !== null ? ` (${count})` : ""}</Text>
                  </HStack>
                </Tab>
              ))}
            </TabList>

            <TabPanels>
              {/* ALL USERS TAB - Keep as is from original */}
              <TabPanel p={0}>
                <Card bg="rgba(255,255,255,0.02)" border="1px solid rgba(0,100,255,0.2)" borderRadius="xl">
                  <CardBody p={4}>
                    <Flex wrap="wrap" gap={4} mb={6} align="center">
                      <InputGroup maxW="300px">
                        <InputLeftElement><Icon as={FaSearch} color="gray.500" /></InputLeftElement>
                        <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} bg="rgba(255,255,255,0.05)" border="1px solid rgba(0,100,255,0.3)" color="white" />
                        {searchTerm && <InputRightElement><IconButton icon={<FaTimes />} size="xs" variant="ghost" onClick={() => setSearchTerm("")} /></InputRightElement>}
                      </InputGroup>
                      <Select w="140px" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} bg="rgba(255,255,255,0.05)" border="1px solid rgba(0,100,255,0.3)" color="white"><option value="all">All Status</option><option value="online">Online</option><option value="offline">Offline</option></Select>
                      <Select w="140px" value={hasAIDataFilter} onChange={(e) => setHasAIDataFilter(e.target.value)} bg="rgba(255,255,255,0.05)" border="1px solid rgba(0,100,255,0.3)" color="white"><option value="all">All AI Data</option><option value="has">Has AI Data</option><option value="none">No AI Data</option></Select>
                      <Select w="140px" value={chatHistoryFilter} onChange={(e) => setChatHistoryFilter(e.target.value)} bg="rgba(255,255,255,0.05)" border="1px solid rgba(0,100,255,0.3)" color="white"><option value="all">All Chat History</option><option value="has">Has Chat History</option><option value="none">No Chat History</option></Select>
                      <Menu>
                        <MenuButton as={Button} rightIcon={<Icon as={FaSort} />} variant="outline" colorScheme="blue" size="sm">Sort: {sortBy}</MenuButton>
                        <MenuList bg="gray.900">
                          <MenuItem onClick={() => { setSortBy("username"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>Username {sortBy === "username" && (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}</MenuItem>
                          <MenuItem onClick={() => { setSortBy("rating"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>Rating {sortBy === "rating" && (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}</MenuItem>
                          <MenuItem onClick={() => { setSortBy("lastSeen"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>Last Seen {sortBy === "lastSeen" && (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}</MenuItem>
                          <MenuItem onClick={() => { setSortBy("chatCount"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>Chat Count {sortBy === "chatCount" && (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}</MenuItem>
                        </MenuList>
                      </Menu>
                      <Text color="gray.500" fontSize="sm" ml="auto">Showing {currentUsers.length} of {filteredAndSortedUsers.length} users (Page {currentPage} of {totalPages})</Text>
                    </Flex>
                    
                    {isFetching && allUsers.length === 0 ? (<Flex justify="center" py={20}><Spinner color="blue.500" size="xl" /><Text ml={4}>Loading users...</Text></Flex>) : currentUsers.length === 0 ? (<Flex justify="center" py={20}><Text color="gray.500">No users found</Text></Flex>) : (
                      <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr bg="rgba(0,100,255,0.1)">
                              <Th color="gray.300" fontSize="xs" py={3}>User</Th>
                              <Th color="gray.300" fontSize="xs" py={3}>Contact & Bio</Th>
                              <Th color="gray.300" fontSize="xs" py={3}>Status & Last Seen</Th>
                              <Th color="gray.300" fontSize="xs" py={3}>AI Summary</Th>
                              <Th color="gray.300" fontSize="xs" py={3}>Goals & Interests</Th>
                              <Th color="gray.300" fontSize="xs" py={3}>Chat History</Th>
                              <Th color="gray.300" fontSize="xs" py={3}>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {currentUsers.map((user) => (
                              <Tr key={user.id} _hover={{ bg: "rgba(255,255,255,0.03)" }}>
                                <Td py={3}><HStack spacing={3}><Avatar size="sm" name={user.username} src={user.profilePicURL} /><Box><Text color="white" fontSize="sm" fontWeight="medium">{user.username}</Text><Text color="gray.500" fontSize="xs">{user.profession || "No profession"}</Text>{user.rating > 0 && <Badge colorScheme={getReputationColor(user.rating)} fontSize="9px" mt={1}>Rating: {user.rating}</Badge>}</Box></HStack></Td>
                                <Td py={3}><VStack align="start" spacing={1}><HStack><Icon as={FaEnvelope} color="gray.500" boxSize="10px" /><Text color="gray.300" fontSize="xs" noOfLines={1}>{user.email}</Text></HStack><Text color="gray.400" fontSize="xs" noOfLines={2} maxW="200px">{user.bio || "No bio"}</Text></VStack></Td>
                                <Td py={3}><Badge colorScheme={getStatusColor(user.presenceStatus)} fontSize="xs" px={2} py={1} borderRadius="full">{user.presenceStatus}</Badge><Text fontSize="xs" color="gray.500" mt={1}>{getLastSeenText(user)}</Text></Td>
                                <Td py={3}>{renderAISummaryPreview(user)}</Td>
                                <Td py={3}>{renderGoalsInterestsPreview(user)}</Td>
                                <Td py={3}>{renderChatHistoryPreview(user)}</Td>
                                <Td py={3}>
                                  <IconButton
                                    icon={<FaPaperPlane />}
                                    size="sm"
                                    variant="ghost"
                                    color="blue.400"
                                    onClick={() => openBotMessageModal(user)}
                                    aria-label="Send bot message"
                                    title="Send bot message to this user"
                                  />
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    )}
                    
                    {filteredAndSortedUsers.length > PAGE_SIZE && (
                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        isDisabled={isFetching}
                      />
                    )}
                  </CardBody>
                </Card>
              </TabPanel>

              {/* EDIT USERS TAB - NEW */}
              <TabPanel p={0}>
                <Card bg="rgba(255,255,255,0.02)" border="1px solid rgba(0,100,255,0.2)" borderRadius="xl">
                  <CardBody p={4}>
                    <Flex wrap="wrap" gap={4} mb={6} align="center">
                      <InputGroup maxW="300px">
                        <InputLeftElement><Icon as={FaSearch} color="gray.500" /></InputLeftElement>
                        <Input 
                          placeholder="Search users by name, email, bio..." 
                          value={editUsersSearchTerm} 
                          onChange={(e) => setEditUsersSearchTerm(e.target.value)} 
                          bg="rgba(255,255,255,0.05)" 
                          border="1px solid rgba(0,100,255,0.3)" 
                          color="white" 
                        />
                        {editUsersSearchTerm && (
                          <InputRightElement>
                            <IconButton 
                              icon={<FaTimes />} 
                              size="xs" 
                              variant="ghost" 
                              onClick={() => setEditUsersSearchTerm("")} 
                              aria-label="Clear search"
                            />
                          </InputRightElement>
                        )}
                      </InputGroup>
                      
                      <Menu>
                        <MenuButton as={Button} rightIcon={<Icon as={FaSort} />} variant="outline" colorScheme="blue" size="sm">
                          Sort: {editUsersSortBy}
                        </MenuButton>
                        <MenuList bg="gray.900">
                          <MenuItem onClick={() => { setEditUsersSortBy("username"); setEditUsersSortOrder(editUsersSortOrder === "asc" ? "desc" : "asc"); }}>
                            Username {editUsersSortBy === "username" && (editUsersSortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                          </MenuItem>
                          <MenuItem onClick={() => { setEditUsersSortBy("profession"); setEditUsersSortOrder(editUsersSortOrder === "asc" ? "desc" : "asc"); }}>
                            Profession {editUsersSortBy === "profession" && (editUsersSortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                          </MenuItem>
                          <MenuItem onClick={() => { setEditUsersSortBy("email"); setEditUsersSortOrder(editUsersSortOrder === "asc" ? "desc" : "asc"); }}>
                            Email {editUsersSortBy === "email" && (editUsersSortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                          </MenuItem>
                        </MenuList>
                      </Menu>
                      
                      <Text color="gray.500" fontSize="sm" ml="auto">
                        Showing {currentEditUsers.length} of {filteredAndSortedEditUsers.length} users (Page {editUsersPage} of {totalEditUsersPages})
                      </Text>
                    </Flex>
                    
                    {isFetching && allUsers.length === 0 ? (
                      <Flex justify="center" py={20}>
                        <Spinner color="blue.500" size="xl" />
                        <Text ml={4}>Loading users...</Text>
                      </Flex>
                    ) : currentEditUsers.length === 0 ? (
                      <Flex justify="center" py={20}>
                        <Text color="gray.500">No users found</Text>
                      </Flex>
                    ) : (
                      <Box overflowX="auto">
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr bg="rgba(0,100,255,0.1)">
                              <Th color="gray.300" fontSize="xs" py={3} w="200px">Profile Picture</Th>
                              <Th color="gray.300" fontSize="xs" py={3} w="200px">Username</Th>
                              <Th color="gray.300" fontSize="xs" py={3} w="250px">Profession</Th>
                              <Th color="gray.300" fontSize="xs" py={3} w="300px">Bio</Th>
                              <Th color="gray.300" fontSize="xs" py={3} w="120px">Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {currentEditUsers.map((user) => {
                              const isEditing = editMode[user.id];
                              const isUserSaving = isSaving[user.id];
                              const isUploading = uploadingImage[user.id];
                              
                              return (
                                <Tr key={user.id} _hover={{ bg: "rgba(255,255,255,0.03)" }}>
                                  {/* Profile Picture Column */}
                                  <Td py={3}>
                                    {isEditing ? (
                                      <VStack spacing={2}>
                                        <Avatar 
                                          size="lg" 
                                          name={editFormData[user.id]?.username || user.username} 
                                          src={editFormData[user.id]?.profilePicURL || user.profilePicURL} 
                                        />
                                        <input
                                          type="file"
                                          accept="image/*"
                                          id={`profile-upload-${user.id}`}
                                          style={{ display: 'none' }}
                                          onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                              handleProfilePicUpload(user.id, e.target.files[0]);
                                            }
                                          }}
                                        />
                                        <Button
                                          size="xs"
                                          leftIcon={isUploading ? <Spinner size="xs" /> : <FaUpload />}
                                          onClick={() => document.getElementById(`profile-upload-${user.id}`).click()}
                                          isLoading={isUploading}
                                          variant="outline"
                                          colorScheme="blue"
                                        >
                                          Upload Photo
                                        </Button>
                                      </VStack>
                                    ) : (
                                      <Avatar size="lg" name={user.username} src={user.profilePicURL} />
                                    )}
                                  </Td>
                                  
                                  {/* Username Column */}
                                  <Td py={3}>
                                    {isEditing ? (
                                      <Input
                                        value={editFormData[user.id]?.username || ""}
                                        onChange={(e) => handleEditInputChange(user.id, "username", e.target.value)}
                                        bg="rgba(255,255,255,0.05)"
                                        border="1px solid rgba(0,100,255,0.3)"
                                        color="white"
                                        size="sm"
                                      />
                                    ) : (
                                      <Text color="white" fontWeight="bold">{user.username}</Text>
                                    )}
                                    {!isEditing && user.email && (
                                      <Text fontSize="xs" color="gray.500" mt={1}>{user.email}</Text>
                                    )}
                                  </Td>
                                  
                                  {/* Profession Column */}
                                  <Td py={3}>
                                    {isEditing ? (
                                      <Input
                                        value={editFormData[user.id]?.profession || ""}
                                        onChange={(e) => handleEditInputChange(user.id, "profession", e.target.value)}
                                        bg="rgba(255,255,255,0.05)"
                                        border="1px solid rgba(0,100,255,0.3)"
                                        color="white"
                                        size="sm"
                                        placeholder="Enter profession"
                                      />
                                    ) : (
                                      <Text color="gray.300">{user.profession || <em className="gray-500">Not set</em>}</Text>
                                    )}
                                  </Td>
                                  
                                  {/* Bio Column */}
                                  <Td py={3}>
                                    {isEditing ? (
                                      <Textarea
                                        value={editFormData[user.id]?.bio || ""}
                                        onChange={(e) => handleEditInputChange(user.id, "bio", e.target.value)}
                                        bg="rgba(255,255,255,0.05)"
                                        border="1px solid rgba(0,100,255,0.3)"
                                        color="white"
                                        size="sm"
                                        rows={3}
                                        placeholder="Enter bio"
                                      />
                                    ) : (
                                      <Text color="gray.400" noOfLines={3}>{user.bio || <em className="gray-500">No bio</em>}</Text>
                                    )}
                                  </Td>
                                  
                                  {/* Actions Column */}
                                  <Td py={3}>
                                    <HStack spacing={2}>
                                      {isEditing ? (
                                        <>
                                          <IconButton
                                            icon={<FaSave />}
                                            size="sm"
                                            colorScheme="green"
                                            onClick={() => saveUserEdits(user.id)}
                                            isLoading={isUserSaving}
                                            aria-label="Save changes"
                                            title="Save changes"
                                          />
                                          <IconButton
                                            icon={<FaTimes />}
                                            size="sm"
                                            colorScheme="gray"
                                            onClick={() => toggleEditMode(user)}
                                            aria-label="Cancel edit"
                                            title="Cancel edit"
                                          />
                                        </>
                                      ) : (
                                        <>
                                          <IconButton
                                            icon={<FaEdit />}
                                            size="sm"
                                            variant="ghost"
                                            color="blue.400"
                                            onClick={() => toggleEditMode(user)}
                                            aria-label="Edit user"
                                            title="Edit user"
                                          />
                                          <IconButton
                                            icon={<FaTrash />}
                                            size="sm"
                                            variant="ghost"
                                            color="red.400"
                                            onClick={() => {
                                              setDeleteConfirmUser(user);
                                              onDeleteConfirmOpen();
                                            }}
                                            aria-label="Delete user"
                                            title="Delete user"
                                          />
                                          <IconButton
                                            icon={<FaPaperPlane />}
                                            size="sm"
                                            variant="ghost"
                                            color="purple.400"
                                            onClick={() => openBotMessageModal(user)}
                                            aria-label="Send message"
                                            title="Send bot message"
                                          />
                                        </>
                                      )}
                                    </HStack>
                                  </Td>
                                </Tr>
                              );
                            })}
                          </Tbody>
                        </Table>
                      </Box>
                    )}
                    
                    {filteredAndSortedEditUsers.length > PAGE_SIZE && (
                      <PaginationControls
                        currentPage={editUsersPage}
                        totalPages={totalEditUsersPages}
                        onPageChange={setEditUsersPage}
                        isDisabled={isFetching}
                      />
                    )}
                  </CardBody>
                </Card>
              </TabPanel>

              {/* ONLINE USERS TAB */}
              <TabPanel p={0}>
                <Card bg="rgba(255,255,255,0.02)" border="1px solid rgba(0,100,255,0.2)" borderRadius="xl">
                  <CardBody p={6}>
                    <Heading size="md" color="white" mb={6}>Online Users <Badge colorScheme="green" ml={2}>{onlineUsers.length}</Badge></Heading>
                    {onlineUsers.length === 0 ? (<Flex justify="center" py={12}><Text color="gray.500">No users online</Text></Flex>) : (
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
                        {onlineUsers.map((user) => (
                          <Box key={user.id} bg="rgba(0,100,255,0.1)" border="1px solid rgba(0,100,255,0.3)" borderRadius="xl" p={4} _hover={{ bg: "rgba(0,100,255,0.2)" }}>
                            <HStack spacing={3}>
                              <Avatar size="md" name={user.username} src={user.profilePicURL} />
                              <Box flex={1}>
                                <Text color="white" fontWeight="bold">{user.username}</Text>
                                <Text color="gray.400" fontSize="xs">{user.profession || "No profession"}</Text>
                                <HStack mt={2}>
                                  <Badge colorScheme="green">Online Now</Badge>
                                  <Box as="span"><Icon as={FaCircle} color="green.400" boxSize="8px" /></Box>
                                </HStack>
                              </Box>
                              <IconButton
                                icon={<FaPaperPlane />}
                                size="sm"
                                variant="ghost"
                                color="blue.400"
                                onClick={() => openBotMessageModal(user)}
                                aria-label="Send bot message"
                                title="Send bot message to this user"
                              />
                            </HStack>
                          </Box>
                        ))}
                      </SimpleGrid>
                    )}
                  </CardBody>
                </Card>
              </TabPanel>

              {/* OFFERS TAB */}
              <TabPanel p={0}>
                <VStack spacing={6} align="stretch">
                  <Card bg="rgba(255,255,255,0.02)" border="1px solid rgba(0,100,255,0.2)" borderRadius="xl">
                    <CardBody p={6}>
                      <Heading size="md" color="white" mb={4}><HStack><Icon as={FaClock} color="yellow.400" /><Text>Pending Requests ({totalPendingRequests})</Text></HStack></Heading>
                      {pendingRequests.length === 0 ? <Text color="gray.500">No pending requests</Text> : (
                        <>
                          <Box overflowX="auto">
                            <Table variant="simple" size="sm">
                              <Thead><Tr bg="rgba(0,100,255,0.1)"><Th color="gray.300">From</Th><Th color="gray.300">To</Th><Th color="gray.300">Reason</Th><Th color="gray.300">Created</Th><Th color="gray.300">Status</Th></Tr></Thead>
                              <Tbody>
                                {pendingRequests.map((request) => (
                                  <Tr key={request.id} _hover={{ bg: "rgba(255,255,255,0.03)" }} cursor="pointer" onClick={() => openOfferDetails(request)}>
                                    <Td><Text color="white">{request.fromUserName}</Text><Text fontSize="xs" color="gray.500">{request.fromUserProfession}</Text></Td>
                                    <Td><Text color="white">{request.toUserName}</Text><Text fontSize="xs" color="gray.500">{request.toUserProfession}</Text></Td>
                                    <Td><Text color="gray.400" fontSize="sm" noOfLines={2}>{request.userNeed || request.connectionReason}</Text></Td>
                                    <Td><Text fontSize="xs" color="gray.500">{formatDate(request.timestamp)}</Text></Td>
                                    <Td>{getOfferStatusBadge(request.status)}</Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Box>
                          <PaginationControls
                            currentPage={pendingPage}
                            totalPages={totalPendingPages}
                            onPageChange={setPendingPage}
                            isDisabled={isFetching}
                          />
                        </>
                      )}
                    </CardBody>
                  </Card>

                  <Card bg="rgba(255,255,255,0.02)" border="1px solid rgba(0,100,255,0.2)" borderRadius="xl">
                    <CardBody p={6}>
                      <Heading size="md" color="white" mb={4}><HStack><Icon as={FaCheckCircle} color="green.400" /><Text>Accepted Connections ({totalAcceptedConnections})</Text></HStack></Heading>
                      {acceptedConnections.length === 0 ? <Text color="gray.500">No accepted connections</Text> : (
                        <>
                          <Box overflowX="auto">
                            <Table variant="simple" size="sm">
                              <Thead><Tr bg="rgba(0,100,255,0.1)"><Th color="gray.300">Users</Th><Th color="gray.300">Connected At</Th><Th color="gray.300">Chat Room</Th><Th color="gray.300">Status</Th></Tr></Thead>
                              <Tbody>
                                {acceptedConnections.map((connection) => (
                                  <Tr key={connection.id} _hover={{ bg: "rgba(255,255,255,0.03)" }} cursor="pointer" onClick={() => openOfferDetails(connection)}>
                                    <Td><Text color="white">{connection.fromUserName} ↔ {connection.toUserName}</Text><Text fontSize="xs" color="gray.500">{connection.fromUserProfession} | {connection.toUserProfession}</Text></Td>
                                    <Td><Text fontSize="xs" color="gray.500">{formatDate(connection.connectedAt)}</Text></Td>
                                    <Td><Badge colorScheme="blue">{connection.chatRoomId?.substring(0, 20)}...</Badge></Td>
                                    <Td>{getOfferStatusBadge(connection.status)}</Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Box>
                          <PaginationControls
                            currentPage={acceptedPage}
                            totalPages={totalAcceptedPages}
                            onPageChange={setAcceptedPage}
                            isDisabled={isFetching}
                          />
                        </>
                      )}
                    </CardBody>
                  </Card>

                  <Card bg="rgba(255,255,255,0.02)" border="1px solid rgba(0,100,255,0.2)" borderRadius="xl">
                    <CardBody p={6}>
                      <Heading size="md" color="white" mb={4}><HStack><Icon as={FaBan} color="red.400" /><Text>Rejected Requests ({totalRejectedRequests})</Text></HStack></Heading>
                      {rejectedRequests.length === 0 ? <Text color="gray.500">No rejected requests</Text> : (
                        <>
                          <Box overflowX="auto">
                            <Table variant="simple" size="sm">
                              <Thead><Tr bg="rgba(0,100,255,0.1)"><Th color="gray.300">From</Th><Th color="gray.300">To</Th><Th color="gray.300">Reason</Th><Th color="gray.300">Created</Th><Th color="gray.300">Status</Th></Tr></Thead>
                              <Tbody>
                                {rejectedRequests.map((request) => (
                                  <Tr key={request.id} _hover={{ bg: "rgba(255,255,255,0.03)" }} cursor="pointer" onClick={() => openOfferDetails(request)}>
                                    <Td><Text color="white">{request.fromUserName}</Text></Td>
                                    <Td><Text color="white">{request.toUserName}</Text></Td>
                                    <Td><Text color="gray.400" fontSize="sm" noOfLines={2}>{request.userNeed || request.connectionReason}</Text></Td>
                                    <Td><Text fontSize="xs" color="gray.500">{formatDate(request.timestamp)}</Text></Td>
                                    <Td>{getOfferStatusBadge(request.status)}</Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Box>
                          <PaginationControls
                            currentPage={rejectedPage}
                            totalPages={totalRejectedPages}
                            onPageChange={setRejectedPage}
                            isDisabled={isFetching}
                          />
                        </>
                      )}
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>

              {/* CHAT ROOMS TAB */}
              <TabPanel p={0}>
                <Card bg="rgba(255,255,255,0.02)" border="1px solid rgba(0,100,255,0.2)" borderRadius="xl">
                  <CardBody p={6}>
                    <Heading size="md" color="white" mb={6}>Chat Rooms ({totalChatRooms})</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
                      <Card bg="rgba(0,100,255,0.1)" p={4}><Stat><StatLabel color="gray.400">Total Rooms</StatLabel><StatNumber color="white" fontSize="3xl">{totalChatRooms}</StatNumber><StatHelpText color="blue.400">Active conversations</StatHelpText></Stat></Card>
                      <Card bg="rgba(0,100,255,0.1)" p={4}><Stat><StatLabel color="gray.400">Total Messages</StatLabel><StatNumber color="white" fontSize="3xl">{totalMessages}</StatNumber><StatHelpText color="green.400">Messages sent</StatHelpText></Stat></Card>
                      <Card bg="rgba(0,100,255,0.1)" p={4}><Stat><StatLabel color="gray.400">Avg Messages/Room</StatLabel><StatNumber color="white" fontSize="3xl">{avgMessagesPerRoom.toFixed(1)}</StatNumber><StatHelpText color="purple.400">Per conversation</StatHelpText></Stat></Card>
                      <Card bg="rgba(0,100,255,0.1)" p={4}><Stat><StatLabel color="gray.400">Total Participants</StatLabel><StatNumber color="white" fontSize="3xl">{allChatRooms.reduce((sum, room) => sum + (room.participants?.length || 0), 0)}</StatNumber><StatHelpText color="orange.400">Unique connections</StatHelpText></Stat></Card>
                    </SimpleGrid>
                    <Heading size="sm" color="white" mb={4}>Recent Chat Rooms</Heading>
                    <Box overflowX="auto">
                      <Table variant="simple" size="sm">
                        <Thead><Tr bg="rgba(0,100,255,0.1)"><Th color="gray.300">Room ID</Th><Th color="gray.300">Participants</Th><Th color="gray.300">Messages</Th><Th color="gray.300">Created</Th><Th color="gray.300">Last Activity</Th></Tr></Thead>
                        <Tbody>
                          {chatRooms.map((room) => (
                            <Tr key={room.id} _hover={{ bg: "rgba(255,255,255,0.03)" }}>
                              <Td><Text color="gray.300" fontSize="xs" noOfLines={1}>{room.id?.substring(0, 30)}...</Text></Td>
                              <Td><Text color="gray.400" fontSize="xs">{room.participants?.length || 0} users</Text></Td>
                              <Td><Badge colorScheme="blue">{room.messageCount || 0}</Badge></Td>
                              <Td><Text fontSize="xs" color="gray.500">{formatDate(room.createdAt)}</Text></Td>
                              <Td><Text fontSize="xs" color="gray.500">{formatDate(room.lastActivity)}</Text></Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                    {allChatRooms.length > PAGE_SIZE && (
                      <PaginationControls
                        currentPage={chatRoomsPage}
                        totalPages={totalChatRoomsPages}
                        onPageChange={setChatRoomsPage}
                        isDisabled={isFetching}
                      />
                    )}
                  </CardBody>
                </Card>
              </TabPanel>

              {/* SHARES TAB */}
              <TabPanel p={0}>
                <Card bg="rgba(255,255,255,0.02)" border="1px solid rgba(0,100,255,0.2)" borderRadius="xl">
                  <CardBody p={6}>
                    <Heading size="md" color="white" mb={6}>Shares Analytics</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={6}>
                      <Card bg="rgba(0,100,255,0.1)" p={4}><Stat><StatLabel color="gray.400">Total Shares</StatLabel><StatNumber color="white" fontSize="3xl">{totalBlasts}</StatNumber><StatHelpText color="red.400">Created</StatHelpText></Stat></Card>
                      <Card bg="rgba(0,100,255,0.1)" p={4}><Stat><StatLabel color="gray.400">Active Shares</StatLabel><StatNumber color="white" fontSize="3xl">{activeBlasts}</StatNumber><StatHelpText color="green.400">Currently active</StatHelpText></Stat></Card>
                      <Card bg="rgba(0,100,255,0.1)" p={4}><Stat><StatLabel color="gray.400">Total Comments</StatLabel><StatNumber color="white" fontSize="3xl">{totalComments}</StatNumber><StatHelpText color="blue.400">Engagement</StatHelpText></Stat></Card>
                      <Card bg="rgba(0,100,255,0.1)" p={4}><Stat><StatLabel color="gray.400">Avg Comments/Share</StatLabel><StatNumber color="white" fontSize="3xl">{(totalComments / totalBlasts).toFixed(1) || 0}</StatNumber><StatHelpText color="purple.400">Per share</StatHelpText></Stat></Card>
                    </SimpleGrid>
                    <Heading size="sm" color="white" mb={4}>Recent Shares</Heading>
                    <Box overflowX="auto">
                      <Table variant="simple" size="sm">
                        <Thead><Tr bg="rgba(0,100,255,0.1)"><Th color="gray.300">Message</Th><Th color="gray.300">Created By</Th><Th color="gray.300">Chatroom</Th><Th color="gray.300">Status</Th><Th color="gray.300">Time</Th><Th color="gray.300">Actions</Th></Tr></Thead>
                        <Tbody>
                          {blasts.map((blast) => (
                            <Tr key={blast.id} _hover={{ bg: "rgba(255,255,255,0.03)" }}>
                              <Td><Text color="white" noOfLines={2}>{blast.message}</Text></Td>
                              <Td><HStack><Avatar size="xs" name={blast.creatorName} src={blast.creatorProfilePic} /><Text color="gray.400" fontSize="xs">{blast.creatorName}</Text></HStack></Td>
                              <Td>
                                <Badge
                                  colorScheme="purple"
                                  cursor="pointer"
                                  onClick={() => openShareUserChatrooms(blast)}
                                  _hover={{ opacity: 0.8 }}
                                >
                                  View Chats
                                </Badge>
                              </Td>
                              <Td><Badge colorScheme={blast.status === "active" ? "green" : "gray"}>{blast.status || "active"}</Badge></Td>
                              <Td><Text fontSize="xs" color="gray.500">{formatDate(blast.timestamp)}</Text></Td>
                              <Td>
                                <IconButton
                                  icon={<FaPaperPlane />}
                                  size="sm"
                                  variant="ghost"
                                  color="blue.400"
                                  onClick={() => openBotMessageModal({ id: blast.createdBy, username: blast.creatorName })}
                                  aria-label="Send bot message"
                                  title="Send bot message to this user"
                                />
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                    {allBlasts.length > PAGE_SIZE && (
                      <PaginationControls
                        currentPage={blastsPage}
                        totalPages={totalBlastsPages}
                        onPageChange={setBlastsPage}
                        isDisabled={isFetching}
                      />
                    )}
                  </CardBody>
                </Card>
              </TabPanel>

              {/* LIVE ROOMS TAB */}
              <TabPanel p={0}>
                <Card bg="rgba(255,255,255,0.02)" border="1px solid rgba(0,100,255,0.2)" borderRadius="xl">
                  <CardBody p={4}>
                    <Flex wrap="wrap" gap={4} mb={6} align="center">
                      <InputGroup maxW="300px">
                        <InputLeftElement><Icon as={FaSearch} color="gray.500" /></InputLeftElement>
                        <Input placeholder="Search by host or topic..." value={liveRoomSearchTerm} onChange={(e) => setLiveRoomSearchTerm(e.target.value)} bg="rgba(255,255,255,0.05)" border="1px solid rgba(0,100,255,0.3)" color="white" />
                        {liveRoomSearchTerm && <InputRightElement><IconButton icon={<FaTimes />} size="xs" variant="ghost" onClick={() => setLiveRoomSearchTerm("")} /></InputRightElement>}
                      </InputGroup>
                      <Select w="140px" value={liveRoomStatusFilter} onChange={(e) => setLiveRoomStatusFilter(e.target.value)} bg="rgba(255,255,255,0.05)" border="1px solid rgba(0,100,255,0.3)" color="white"><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></Select>
                      <Menu>
                        <MenuButton as={Button} rightIcon={<Icon as={FaSort} />} variant="outline" colorScheme="blue" size="sm">Sort: {liveRoomSortBy}</MenuButton>
                        <MenuList bg="gray.900">
                          <MenuItem onClick={() => { setLiveRoomSortBy("host"); setLiveRoomSortOrder(liveRoomSortOrder === "asc" ? "desc" : "asc"); }}>Host</MenuItem>
                          <MenuItem onClick={() => { setLiveRoomSortBy("participants"); setLiveRoomSortOrder(liveRoomSortOrder === "asc" ? "desc" : "asc"); }}>Participants</MenuItem>
                          <MenuItem onClick={() => { setLiveRoomSortBy("messages"); setLiveRoomSortOrder(liveRoomSortOrder === "asc" ? "desc" : "asc"); }}>Messages</MenuItem>
                          <MenuItem onClick={() => { setLiveRoomSortBy("started"); setLiveRoomSortOrder(liveRoomSortOrder === "asc" ? "desc" : "asc"); }}>Started</MenuItem>
                        </MenuList>
                      </Menu>
                      <Text color="gray.500" fontSize="sm" ml="auto">Showing {currentLiveRooms.length} of {filteredAndSortedLiveRooms.length} rooms (Page {liveRoomsPage} of {totalLiveRoomsPages})</Text>
                    </Flex>
                    
                    <Box overflowX="auto">
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr bg="rgba(0,100,255,0.1)">
                            <Th color="gray.300" fontSize="xs" py={3}>Room / Host</Th>
                            <Th color="gray.300" fontSize="xs" py={3}>Topic</Th>
                            <Th color="gray.300" fontSize="xs" py={3}>Status & Started</Th>
                            <Th color="gray.300" fontSize="xs" py={3}>Participants</Th>
                            <Th color="gray.300" fontSize="xs" py={3}>Messages</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {currentLiveRooms.map((room) => (
                            <Tr key={room.id} _hover={{ bg: "rgba(255,255,255,0.03)" }}>
                              <Td py={3}>
                                <HStack spacing={3}>
                                  <Avatar size="sm" name={room.hostUsername} />
                                  <Box>
                                    <Text color="white" fontSize="sm" fontWeight="medium">{room.hostUsername}</Text>
                                    <Text color="gray.500" fontSize="xs">{room.id?.substring(0, 20)}...</Text>
                                  </Box>
                                </HStack>
                              </Td>
                              <Td py={3}>
                                <Text color="gray.300" fontSize="sm" noOfLines={2}>{room.topic}</Text>
                              </Td>
                              <Td py={3}>
                                <Badge colorScheme={room.isActive ? "green" : "gray"}>{room.isActive ? "Active" : "Ended"}</Badge>
                                <Text fontSize="xs" color="gray.500" mt={1}>{formatDate(room.startedAt)}</Text>
                              </Td>
                              <Td py={3}>
                                <Badge 
                                  colorScheme="purple" 
                                  cursor="pointer" 
                                  onClick={() => openLiveRoomParticipants(room)}
                                  _hover={{ opacity: 0.8 }}
                                >
                                  {room.participants} participants
                                </Badge>
                              </Td>
                              <Td py={3}>
                                <Badge 
                                  colorScheme="blue" 
                                  cursor="pointer" 
                                  onClick={() => openLiveRoomMessages(room)}
                                  _hover={{ opacity: 0.8 }}
                                >
                                  {room.messageCount || 0} messages
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                    
                    {filteredAndSortedLiveRooms.length > PAGE_SIZE && (
                      <PaginationControls
                        currentPage={liveRoomsPage}
                        totalPages={totalLiveRoomsPages}
                        onPageChange={setLiveRoomsPage}
                        isDisabled={isFetching}
                      />
                    )}
                  </CardBody>
                </Card>
              </TabPanel>

              {/* CLONE USERS TAB */}
              <TabPanel p={0}>
                <Card bg="rgba(255,255,255,0.02)" border="1px solid rgba(0,100,255,0.2)" borderRadius="xl">
                  <CardBody p={4}>
                    <Flex wrap="wrap" gap={4} mb={6} align="center">
                      <InputGroup maxW="300px">
                        <InputLeftElement><Icon as={FaSearch} color="gray.500" /></InputLeftElement>
                        <Input placeholder="Search by username..." value={cloneSearchTerm} onChange={(e) => setCloneSearchTerm(e.target.value)} bg="rgba(255,255,255,0.05)" border="1px solid rgba(0,100,255,0.3)" color="white" />
                        {cloneSearchTerm && <InputRightElement><IconButton icon={<FaTimes />} size="xs" variant="ghost" onClick={() => setCloneSearchTerm("")} /></InputRightElement>}
                      </InputGroup>
                      <Menu>
                        <MenuButton as={Button} rightIcon={<Icon as={FaSort} />} variant="outline" colorScheme="blue" size="sm">Sort: {cloneSortBy}</MenuButton>
                        <MenuList bg="gray.900">
                          <MenuItem onClick={() => { setCloneSortBy("username"); setCloneSortOrder(cloneSortOrder === "asc" ? "desc" : "asc"); }}>Username</MenuItem>
                          <MenuItem onClick={() => { setCloneSortBy("profession"); setCloneSortOrder(cloneSortOrder === "asc" ? "desc" : "asc"); }}>Profession</MenuItem>
                          <MenuItem onClick={() => { setCloneSortBy("promptLength"); setCloneSortOrder(cloneSortOrder === "asc" ? "desc" : "asc"); }}>Prompt Length</MenuItem>
                        </MenuList>
                      </Menu>
                      <Text color="gray.500" fontSize="sm" ml="auto">Showing {currentCloneUsers.length} of {filteredAndSortedCloneUsers.length} clone users (Page {cloneUsersPage} of {totalCloneUsersPages})</Text>
                    </Flex>
                    
                    <Box overflowX="auto">
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr bg="rgba(0,100,255,0.1)">
                            <Th color="gray.300" fontSize="xs" py={3}>User</Th>
                            <Th color="gray.300" fontSize="xs" py={3}>Contact & Bio</Th>
                            <Th color="gray.300" fontSize="xs" py={3}>Clone Name</Th>
                            <Th color="gray.300" fontSize="xs" py={3}>Likes</Th>
                            <Th color="gray.300" fontSize="xs" py={3}>Comments</Th>
                            <Th color="gray.300" fontSize="xs" py={3}>Prompt Preview</Th>
                            <Th color="gray.300" fontSize="xs" py={3}>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {currentCloneUsers.map((user) => {
                            const likesCount = cloneLikesMap[user.id]?.length || 0;
                            const commentsCount = cloneCommentsMap[user.id]?.length || 0;
                            
                            return (
                              <Tr key={user.id} _hover={{ bg: "rgba(255,255,255,0.03)" }}>
                                <Td py={3}>
                                  <HStack spacing={3}>
                                    <Avatar size="sm" name={user.username} src={user.profilePicURL} />
                                    <Box>
                                      <Text color="white" fontSize="sm" fontWeight="medium">{user.username}</Text>
                                      <Text color="gray.500" fontSize="xs">{user.profession || "No profession"}</Text>
                                      {user.rating > 0 && <Badge colorScheme={getReputationColor(user.rating)} fontSize="9px" mt={1}>Rating: {user.rating}</Badge>}
                                    </Box>
                                  </HStack>
                                </Td>
                                <Td py={3}>
                                  <VStack align="start" spacing={1}>
                                    <HStack><Icon as={FaEnvelope} color="gray.500" boxSize="10px" /><Text color="gray.300" fontSize="xs" noOfLines={1}>{user.email}</Text></HStack>
                                    <Text color="gray.400" fontSize="xs" noOfLines={2} maxW="200px">{user.bio || "No bio"}</Text>
                                  </VStack>
                                </Td>
                                <Td py={3}>
                                  <Badge colorScheme="purple" fontSize="xs">{extractCloneName(user.cloneSystemPrompt)}</Badge>
                                </Td>
                                <Td py={3}>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    colorScheme="pink"
                                    leftIcon={<FaThumbsUp />}
                                    onClick={() => openCloneLikesModal(user)}
                                    isDisabled={likesCount === 0}
                                  >
                                    {likesCount} Like{likesCount !== 1 ? 's' : ''}
                                  </Button>
                                </Td>
                                <Td py={3}>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    colorScheme="blue"
                                    leftIcon={<FaComment />}
                                    onClick={() => openCloneCommentsModal(user)}
                                    isDisabled={commentsCount === 0}
                                  >
                                    {commentsCount} Comment{commentsCount !== 1 ? 's' : ''}
                                  </Button>
                                </Td>
                                <Td py={3}>
                                  <Text fontSize="xs" color="gray.400" noOfLines={2}>
                                    {user.cloneSystemPrompt?.substring(0, 100)}...
                                  </Text>
                                </Td>
                                <Td py={3}>
                                  <IconButton
                                    icon={<FaExpand />}
                                    size="sm"
                                    variant="ghost"
                                    color="blue.400"
                                    onClick={() => openClonePromptModal(user)}
                                    aria-label="View full prompt"
                                    title="View full clone prompt"
                                  />
                                </Td>
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </Box>
                    
                    {filteredAndSortedCloneUsers.length > PAGE_SIZE && (
                      <PaginationControls
                        currentPage={cloneUsersPage}
                        totalPages={totalCloneUsersPages}
                        onPageChange={setCloneUsersPage}
                        isDisabled={isFetching}
                      />
                    )}
                  </CardBody>
                </Card>
              </TabPanel>

              {/* ANALYTICS TAB */}
              <TabPanel p={0}>
                <VStack spacing={6} align="stretch">
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                    <Card bg="rgba(0,100,255,0.1)" p={4} borderRadius="xl">
                      <Stat><StatLabel color="gray.400">Total Users</StatLabel><StatNumber color="white" fontSize="3xl">{allUsers.length}</StatNumber><StatHelpText color="green.400">+{Math.round(allUsers.length * 0.05)} this month</StatHelpText></Stat>
                    </Card>
                    <Card bg="rgba(0,100,255,0.1)" p={4} borderRadius="xl">
                      <Stat><StatLabel color="gray.400">Daily Active Users</StatLabel><StatNumber color="white" fontSize="3xl">{onlineUsers.length}</StatNumber><StatHelpText color="blue.400">{Math.round((onlineUsers.length / allUsers.length) * 100)}% of total</StatHelpText></Stat>
                    </Card>
                    <Card bg="rgba(0,100,255,0.1)" p={4} borderRadius="xl">
                      <Stat><StatLabel color="gray.400">Total Connections</StatLabel><StatNumber color="white" fontSize="3xl">{totalAcceptedConnections}</StatNumber><StatHelpText color="purple.400">Successful matches</StatHelpText></Stat>
                    </Card>
                    <Card bg="rgba(0,100,255,0.1)" p={4} borderRadius="xl">
                      <Stat><StatLabel color="gray.400">Engagement Rate</StatLabel><StatNumber color="white" fontSize="3xl">{Math.round((totalMessages / (totalChatRooms || 1)) * 10)}%</StatNumber><StatHelpText color="orange.400">Active conversations</StatHelpText></Stat>
                    </Card>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <Card bg="rgba(255,255,255,0.02)" border="1px solid rgba(0,100,255,0.2)" borderRadius="xl">
                      <CardBody>
                        <Heading size="sm" color="white" mb={4}>Connection Status</Heading>
                        <VStack spacing={3} align="stretch">
                          <Box><Flex justify="space-between"><Text color="gray.400">Pending</Text><Text color="yellow.400">{totalPendingRequests}</Text></Flex><Progress value={(totalPendingRequests / (totalPendingRequests + totalAcceptedConnections + totalRejectedRequests)) * 100} colorScheme="yellow" size="sm" borderRadius="full" /></Box>
                          <Box><Flex justify="space-between"><Text color="gray.400">Accepted</Text><Text color="green.400">{totalAcceptedConnections}</Text></Flex><Progress value={(totalAcceptedConnections / (totalPendingRequests + totalAcceptedConnections + totalRejectedRequests)) * 100} colorScheme="green" size="sm" borderRadius="full" /></Box>
                          <Box><Flex justify="space-between"><Text color="gray.400">Rejected</Text><Text color="red.400">{totalRejectedRequests}</Text></Flex><Progress value={(totalRejectedRequests / (totalPendingRequests + totalAcceptedConnections + totalRejectedRequests)) * 100} colorScheme="red" size="sm" borderRadius="full" /></Box>
                        </VStack>
                      </CardBody>
                    </Card>

                    <Card bg="rgba(255,255,255,0.02)" border="1px solid rgba(0,100,255,0.2)" borderRadius="xl">
                      <CardBody>
                        <Heading size="sm" color="white" mb={4}>Platform Activity</Heading>
                        <VStack spacing={3} align="stretch">
                          <Box><Flex justify="space-between"><Text color="gray.400">Messages</Text><Text color="blue.400">{totalMessages}</Text></Flex><Progress value={Math.min((totalMessages / 10000) * 100, 100)} colorScheme="blue" size="sm" borderRadius="full" /></Box>
                          <Box><Flex justify="space-between"><Text color="gray.400">Comments</Text><Text color="purple.400">{totalComments}</Text></Flex><Progress value={Math.min((totalComments / 5000) * 100, 100)} colorScheme="purple" size="sm" borderRadius="full" /></Box>
                          <Box><Flex justify="space-between"><Text color="gray.400">Blasts</Text><Text color="orange.400">{totalBlasts}</Text></Flex><Progress value={Math.min((totalBlasts / 1000) * 100, 100)} colorScheme="orange" size="sm" borderRadius="full" /></Box>
                        </VStack>
                      </CardBody>
                    </Card>
                  </SimpleGrid>

                  <Card bg="rgba(255,255,255,0.02)" border="1px solid rgba(0,100,255,0.2)" borderRadius="xl">
                    <CardBody>
                      <Heading size="sm" color="white" mb={4}>User Insights</Heading>
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                        <Box><Text color="gray.400">Most Active User</Text><Text color="white" fontWeight="bold">{mostActiveUser.name}</Text><Text fontSize="sm" color="blue.400">{mostActiveUser.count} blasts</Text></Box>
                        <Box><Text color="gray.400">Peak Activity Hour</Text><Text color="white" fontWeight="bold">{peakHour}</Text><Text fontSize="sm" color="gray.500">Highest engagement</Text></Box>
                        <Box><Text color="gray.400">Avg Daily Active</Text><Text color="white" fontWeight="bold">{avgDailyActiveUsers}</Text><Text fontSize="sm" color="gray.500">Users per day</Text></Box>
                      </SimpleGrid>
                    </CardBody>
                  </Card>

                  <Card bg="rgba(255,255,255,0.02)" border="1px solid rgba(0,100,255,0.2)" borderRadius="xl">
                    <CardBody>
                      <Heading size="sm" color="white" mb={4}>AI Adoption</Heading>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <Box><Text color="gray.400">Users with AI Data</Text><Text color="white" fontSize="2xl" fontWeight="bold">{allUsers.filter(u => hasAISummaryData(u.aiSummary)).length}</Text><Progress value={(allUsers.filter(u => hasAISummaryData(u.aiSummary)).length / allUsers.length) * 100} colorScheme="green" size="sm" borderRadius="full" mt={2} /></Box>
                        <Box><Text color="gray.400">Users with Chat History</Text><Text color="white" fontSize="2xl" fontWeight="bold">{allUsers.filter(u => u.aiChatHistory?.length > 0).length}</Text><Progress value={(allUsers.filter(u => u.aiChatHistory?.length > 0).length / allUsers.length) * 100} colorScheme="blue" size="sm" borderRadius="full" mt={2} /></Box>
                        <Box><Text color="gray.400">Users with AI Clones</Text><Text color="white" fontSize="2xl" fontWeight="bold">{cloneUsers.length}</Text><Progress value={(cloneUsers.length / allUsers.length) * 100} colorScheme="purple" size="sm" borderRadius="full" mt={2} /></Box>
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Container>
      </Box>

      {/* Bot Message Modal */}
      <Modal isOpen={isBotModalOpen} onClose={onBotModalClose} size="md">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
        <ModalContent bg="gray.900" border="1px solid rgba(0,100,255,0.3)" borderRadius="2xl">
          <ModalHeader color="white" borderBottom="1px solid rgba(0,100,255,0.3)">
            <HStack>
              <Icon as={FaRobot} color="blue.400" />
              <Box>
                <Text fontSize="lg" fontWeight="bold">Send Bot Message</Text>
                <Text fontSize="xs" color="gray.400">Message will appear to the user</Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={4}>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text color="gray.400" fontSize="sm">To:</Text>
                <Text color="white" fontWeight="bold">{botMessageUser?.username}</Text>
                <Text fontSize="xs" color="gray.500">{botMessageUser?.id}</Text>
              </Box>
              <Box>
                <Text color="gray.400" fontSize="sm" mb={2}>Message:</Text>
                <Textarea
                  placeholder="Enter your message..."
                  value={botMessageText}
                  onChange={(e) => setBotMessageText(e.target.value)}
                  bg="rgba(255,255,255,0.05)"
                  border="1px solid rgba(0,100,255,0.3)"
                  color="white"
                  _focus={{ borderColor: "blue.500" }}
                  minH="120px"
                  resize="vertical"
                />
                <Text fontSize="xs" color="gray.500" mt={1}>{botMessageText.length}/500 characters</Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px solid rgba(0,100,255,0.3)">
            <Button variant="ghost" onClick={onBotModalClose} mr={3}>Cancel</Button>
            <Button colorScheme="blue" onClick={sendBotMessage} isLoading={isSendingBotMessage} isDisabled={!botMessageText.trim()} leftIcon={<FaPaperPlane />}>Send Message</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteConfirmClose}
      >
        <AlertDialogOverlay bg="blackAlpha.800" backdropFilter="blur(5px)">
          <AlertDialogContent bg="gray.900" border="1px solid rgba(255,0,0,0.3)" borderRadius="xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              Delete User
            </AlertDialogHeader>
            
            <AlertDialogBody color="gray.300">
              Are you sure you want to delete <strong>{deleteConfirmUser?.username}</strong>?
              <br />
              This action cannot be undone and will remove all user data.
            </AlertDialogBody>
            
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteConfirmClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={() => deleteUser(deleteConfirmUser?.id)} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Rest of modals (LiveRoomMessages, LiveRoomParticipants, ClonePrompt, CloneLikes, CloneComments, AI, Goals, Chat, Offer, Blast, BlastDetails) - keep from original */}
      <Modal isOpen={isLiveRoomMessagesModalOpen} onClose={onLiveRoomMessagesModalClose} size="xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
        <ModalContent bg="gray.900" border="1px solid rgba(0,100,255,0.3)" borderRadius="2xl" maxH="85vh">
          <ModalHeader color="white" borderBottom="1px solid rgba(0,100,255,0.3)">
            <HStack>
              <Icon as={FaComments} color="blue.400" />
              <Box>
                <Text fontSize="lg" fontWeight="bold">Live Room Messages</Text>
                <Text fontSize="xs" color="gray.400">Room: {selectedLiveRoom?.id?.substring(0, 20)}... • Topic: {selectedLiveRoom?.topic}</Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            {isLoadingMessages ? (
              <Flex justify="center" py={8}><Spinner color="blue.500" /><Text ml={3}>Loading messages...</Text></Flex>
            ) : liveRoomMessages.length === 0 ? (
              <VStack py={8}><Icon as={FaComment} boxSize={12} color="gray.600" /><Text color="gray.500">No messages yet</Text></VStack>
            ) : (
              <VStack spacing={3} align="stretch">
                {liveRoomMessages.map((msg, idx) => (
                  <Box key={idx} p={3} bg={msg.userId === selectedLiveRoom?.hostUserId ? "rgba(0,255,0,0.1)" : msg.isMira ? "rgba(128,0,255,0.1)" : "gray.800"} borderRadius="lg" borderLeft="4px solid" borderLeftColor={msg.userId === selectedLiveRoom?.hostUserId ? "green.500" : msg.isMira ? "purple.500" : "blue.500"}>
                    <HStack justify="space-between" mb={2}>
                      <HStack>
                        <Avatar size="xs" name={msg.username} />
                        <Text fontWeight="bold" color="white" fontSize="sm">
                          {msg.username}
                          {msg.userId === selectedLiveRoom?.hostUserId && <Badge colorScheme="green" ml={2}>Host</Badge>}
                          {msg.isMira && <Badge colorScheme="purple" ml={2}>Mira</Badge>}
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">{formatMessageTime(msg.timestamp)}</Text>
                    </HStack>
                    <Text color="gray.300" fontSize="sm">{msg.message}</Text>
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter><Button colorScheme="blue" onClick={onLiveRoomMessagesModalClose}>Close</Button></ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isLiveRoomParticipantsModalOpen} onClose={onLiveRoomParticipantsModalClose} size="md">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
        <ModalContent bg="gray.900" border="1px solid rgba(0,100,255,0.3)" borderRadius="2xl">
          <ModalHeader color="white" borderBottom="1px solid rgba(0,100,255,0.3)">
            <HStack>
              <Icon as={FaUsers} color="green.400" />
              <Box>
                <Text fontSize="lg" fontWeight="bold">Participants</Text>
                <Text fontSize="xs" color="gray.400">Room: {selectedLiveRoom?.topic}</Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            {liveRoomParticipants.length === 0 ? (
              <VStack py={8}><Text color="gray.500">No participants</Text></VStack>
            ) : (
              <VStack spacing={2} align="stretch">
                {liveRoomParticipants.map((p) => (
                  <Box key={p.userId} p={3} bg={p.isHost ? "rgba(0,255,0,0.1)" : "gray.800"} borderRadius="lg">
                    <HStack>
                      <Avatar size="sm" name={p.username} />
                      <Box>
                        <Text color="white" fontWeight="bold">{p.username}{p.isHost && <Badge colorScheme="green" ml={2}>Host</Badge>}</Text>
                        <Text fontSize="xs" color="gray.500">Joined: {formatDate(p.joinedAt)}</Text>
                      </Box>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter><Button colorScheme="blue" onClick={onLiveRoomParticipantsModalClose}>Close</Button></ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isClonePromptModalOpen} onClose={onClonePromptModalClose} size="xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
        <ModalContent bg="gray.900" border="1px solid rgba(0,100,255,0.3)" borderRadius="2xl" maxH="85vh">
          <ModalHeader color="white" borderBottom="1px solid rgba(0,100,255,0.3)">
            <HStack>
              <Icon as={FaRobot} color="purple.400" />
              <Box>
                <Text fontSize="lg" fontWeight="bold">AI Clone System Prompt</Text>
                <Text fontSize="xs" color="gray.400">User: {selectedCloneUser?.username}</Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            <VStack align="start" spacing={4}>
              <Box w="100%">
                <Text fontWeight="bold" color="green.400" mb={2}>Clone Name:</Text>
                <Badge colorScheme="purple" fontSize="md" px={3} py={2}>{extractCloneName(selectedCloneUser?.cloneSystemPrompt)}</Badge>
              </Box>
              <Box w="100%">
                <Text fontWeight="bold" color="blue.400" mb={2}>Full System Prompt:</Text>
                <Code display="block" p={4} borderRadius="md" bg="gray.800" color="gray.300" whiteSpace="pre-wrap" fontSize="sm">
                  {selectedCloneUser?.cloneSystemPrompt || "No prompt available"}
                </Code>
                <Text fontSize="xs" color="gray.500" mt={2}>Prompt length: {selectedCloneUser?.cloneSystemPrompt?.length || 0} characters</Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter><Button colorScheme="blue" onClick={onClonePromptModalClose}>Close</Button></ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isCloneLikesModalOpen} onClose={onCloneLikesModalClose} size="lg" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
        <ModalContent bg="gray.900" border="1px solid rgba(0,100,255,0.3)" borderRadius="2xl" maxH="85vh">
          <ModalHeader color="white" borderBottom="1px solid rgba(0,100,255,0.3)">
            <HStack>
              <Icon as={FaThumbsUp} color="pink.400" />
              <Box>
                <Text fontSize="lg" fontWeight="bold">Likes Received</Text>
                <Text fontSize="xs" color="gray.400">Clone: {extractCloneName(selectedCloneUser?.cloneSystemPrompt)}</Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            {isLoadingCloneLikes ? (
              <Flex justify="center" py={8}><Spinner color="blue.500" /><Text ml={3}>Loading likes...</Text></Flex>
            ) : selectedCloneLikes.length === 0 ? (
              <VStack py={8}><Icon as={FaThumbsUp} boxSize={12} color="gray.600" /><Text color="gray.500">No likes yet</Text></VStack>
            ) : (
              <VStack spacing={4} align="stretch">
                {selectedCloneLikes.map((like) => (
                  <Box key={like.id} p={4} bg="gray.800" borderRadius="lg" borderLeft="4px solid" borderLeftColor="pink.500">
                    <HStack justify="space-between" mb={2}>
                      <HStack>
                        <Avatar size="sm" name={like.likedByUsername} />
                        <Box>
                          <Text fontWeight="bold" color="white">{like.likedByUsername}</Text>
                          <Text fontSize="xs" color="gray.500">Liked this response</Text>
                        </Box>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">{formatDate(like.timestamp)}</Text>
                    </HStack>
                    <Box mt={2} p={2} bg="gray.700" borderRadius="md">
                      <Text fontSize="sm" color="gray.300" fontStyle="italic">
                        "{like.messageText}"
                      </Text>
                    </Box>
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter><Button colorScheme="blue" onClick={onCloneLikesModalClose}>Close</Button></ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isCloneCommentsModalOpen} onClose={onCloneCommentsModalClose} size="lg" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
        <ModalContent bg="gray.900" border="1px solid rgba(0,100,255,0.3)" borderRadius="2xl" maxH="85vh">
          <ModalHeader color="white" borderBottom="1px solid rgba(0,100,255,0.3)">
            <HStack>
              <Icon as={FaComment} color="blue.400" />
              <Box>
                <Text fontSize="lg" fontWeight="bold">Comments Received</Text>
                <Text fontSize="xs" color="gray.400">Clone: {extractCloneName(selectedCloneUser?.cloneSystemPrompt)}</Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            {isLoadingCloneComments ? (
              <Flex justify="center" py={8}><Spinner color="blue.500" /><Text ml={3}>Loading comments...</Text></Flex>
            ) : selectedCloneComments.length === 0 ? (
              <VStack py={8}><Icon as={FaComment} boxSize={12} color="gray.600" /><Text color="gray.500">No comments yet</Text></VStack>
            ) : (
              <VStack spacing={4} align="stretch">
                {selectedCloneComments.map((comment) => (
                  <Box key={comment.id} p={4} bg="gray.800" borderRadius="lg" borderLeft="4px solid" borderLeftColor="blue.500">
                    <HStack justify="space-between" mb={2}>
                      <HStack>
                        <Avatar size="sm" name={comment.commentedByUsername} />
                        <Box>
                          <Text fontWeight="bold" color="white">{comment.commentedByUsername}</Text>
                          <Text fontSize="xs" color="gray.500">Commented</Text>
                        </Box>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">{formatDate(comment.timestamp)}</Text>
                    </HStack>
                    <Box mt={2} p={2} bg="gray.700" borderRadius="md">
                      <Text fontSize="sm" color="white" fontWeight="medium">💬 {comment.commentText}</Text>
                    </Box>
                    <Box mt={2} p={2} bg="rgba(0,100,255,0.1)" borderRadius="md">
                      <Text fontSize="xs" color="gray.400">On: "{comment.messageText}"</Text>
                    </Box>
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter><Button colorScheme="blue" onClick={onCloneCommentsModalClose}>Close</Button></ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isAIModalOpen} onClose={onAIModalClose} size="xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
        <ModalContent bg="gray.900" border="1px solid rgba(0,100,255,0.3)" borderRadius="2xl" maxH="85vh">
          <ModalHeader color="white" borderBottom="1px solid rgba(0,100,255,0.3)">
            <HStack><Avatar size="md" name={selectedUser?.username} src={selectedUser?.profilePicURL} /><Box><Text fontSize="lg" fontWeight="bold">{selectedUser?.username}&apos;s AI Profile</Text><Text fontSize="xs" color="gray.400">Complete AI analysis</Text></Box></HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>{renderFullAISummary(selectedUser?.aiSummary)}</ModalBody>
          <ModalFooter><Button colorScheme="blue" onClick={onAIModalClose}>Close</Button></ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isGoalsInterestsModalOpen} onClose={onGoalsInterestsModalClose} size="lg" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
        <ModalContent bg="gray.900" border="1px solid rgba(0,100,255,0.3)" borderRadius="2xl" maxH="85vh">
          <ModalHeader color="white" borderBottom="1px solid rgba(0,100,255,0.3)">
            <HStack><Avatar size="md" name={selectedUser?.username} src={selectedUser?.profilePicURL} /><Box><Text fontSize="lg" fontWeight="bold">{selectedUser?.username}&apos;s Goals & Interests</Text><Text fontSize="xs" color="gray.400">User-provided information</Text></Box></HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            <VStack align="start" spacing={6} w="100%">
              <Box w="100%"><HStack mb={3}><Icon as={FaUser} color="green.400" /><Text fontWeight="bold" color="white">Goals</Text><Badge colorScheme="green" ml={2}>{selectedUser?.goals?.length || 0}</Badge></HStack>{selectedUser?.goals?.length > 0 ? <Wrap spacing={2}>{selectedUser.goals.map((goal, idx) => (<WrapItem key={idx}><Badge colorScheme="green" px={3} py={1.5} borderRadius="full" fontSize="sm">🎯 {goal}</Badge></WrapItem>))}</Wrap> : <Text color="gray.500" fontSize="sm">No goals set</Text>}</Box>
              <Box w="100%"><HStack mb={3}><Icon as={FaHeart} color="pink.400" /><Text fontWeight="bold" color="white">Interests</Text><Badge colorScheme="pink" ml={2}>{selectedUser?.interests?.length || 0}</Badge></HStack>{selectedUser?.interests?.length > 0 ? <Wrap spacing={2}>{selectedUser.interests.map((interest, idx) => (<WrapItem key={idx}><Badge colorScheme="pink" px={3} py={1.5} borderRadius="full" fontSize="sm">❤️ {interest}</Badge></WrapItem>))}</Wrap> : <Text color="gray.500" fontSize="sm">No interests set</Text>}</Box>
              {selectedUser?.skills && selectedUser.skills.length > 0 && (<Box w="100%"><HStack mb={3}><Icon as={FaLightbulb} color="yellow.400" /><Text fontWeight="bold" color="white">Skills</Text><Badge colorScheme="yellow" ml={2}>{selectedUser.skills.length}</Badge></HStack><Wrap spacing={2}>{selectedUser.skills.map((skill, idx) => (<WrapItem key={idx}><Badge colorScheme="yellow" px={3} py={1.5} borderRadius="full" fontSize="sm">💡 {skill}</Badge></WrapItem>))}</Wrap></Box>)}
            </VStack>
          </ModalBody>
          <ModalFooter><Button colorScheme="blue" onClick={onGoalsInterestsModalClose}>Close</Button></ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isChatModalOpen} onClose={onChatModalClose} size="xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
        <ModalContent bg="gray.900" border="1px solid rgba(0,100,255,0.3)" borderRadius="2xl" maxH="85vh">
          <ModalHeader color="white" borderBottom="1px solid rgba(0,100,255,0.3)">
            <HStack><Avatar size="md" name={selectedUser?.username} src={selectedUser?.profilePicURL} /><Box><Text fontSize="lg" fontWeight="bold">Chat with Mira</Text><Text fontSize="xs" color="gray.400">{selectedChatHistory.length} messages</Text></Box></HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            {selectedChatHistory.length === 0 ? (<VStack py={8}><Icon as={FaComment} boxSize={12} color="gray.600" /><Text color="gray.500">No chat history</Text></VStack>) : (<VStack spacing={4} align="stretch">{selectedChatHistory.map((msg, idx) => (<Box key={idx} p={4} bg={msg.sender === "user" ? "blue.900" : "gray.800"} borderRadius="xl" borderLeft="4px solid" borderLeftColor={msg.sender === "user" ? "blue.500" : "purple.500"}><HStack justify="space-between" mb={2}><HStack><Icon as={msg.sender === "user" ? FaUser : FaRobot} /><Text fontWeight="bold" color="white">{msg.sender === "user" ? selectedUser?.username : "Mira (AI)"}</Text><Badge colorScheme={msg.sender === "user" ? "blue" : "purple"}>{msg.sender === "user" ? "User" : "AI"}</Badge></HStack><Text fontSize="xs" color="gray.500">{formatMessageTime(msg.timestamp)}</Text></HStack><Text color="gray.200" whiteSpace="pre-wrap">{msg.text}</Text></Box>))}</VStack>)}
          </ModalBody>
          <ModalFooter><Button colorScheme="blue" onClick={onChatModalClose}>Close</Button></ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isOfferModalOpen} onClose={onOfferModalClose} size="lg" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
        <ModalContent bg="gray.900" border="1px solid rgba(0,100,255,0.3)" borderRadius="2xl" maxH="85vh">
          <ModalHeader color="white" borderBottom="1px solid rgba(0,100,255,0.3)"><HStack><Icon as={FaUserPlus} /><Box><Text fontSize="lg" fontWeight="bold">Connection Details</Text><Text fontSize="xs" color="gray.400">Offer ID: {selectedOffer?.id?.substring(0, 20)}...</Text></Box></HStack></ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>{selectedOffer && (<VStack align="start" spacing={4}><Box><Text fontWeight="bold" color="blue.400">From:</Text><Text color="white">{selectedOffer.fromUserName}</Text><Text fontSize="xs" color="gray.500">{selectedOffer.fromUserProfession}</Text></Box><Box><Text fontWeight="bold" color="green.400">To:</Text><Text color="white">{selectedOffer.toUserName}</Text><Text fontSize="xs" color="gray.500">{selectedOffer.toUserProfession}</Text></Box><Box><Text fontWeight="bold" color="yellow.400">User Need:</Text><Text color="gray.300">{selectedOffer.userNeed}</Text></Box><Box><Text fontWeight="bold" color="purple.400">Connection Reason:</Text><Text color="gray.300">{selectedOffer.connectionReason}</Text></Box><Box><Text fontWeight="bold" color="orange.400">Status:</Text>{getOfferStatusBadge(selectedOffer.status)}</Box><Box><Text fontWeight="bold" color="gray.400">Created:</Text><Text color="gray.500">{formatDate(selectedOffer.timestamp)}</Text></Box>{selectedOffer.connectedAt && <Box><Text fontWeight="bold" color="gray.400">Connected At:</Text><Text color="gray.500">{formatDate(selectedOffer.connectedAt)}</Text></Box>}{selectedOffer.chatRoomId && <Box><Text fontWeight="bold" color="gray.400">Chat Room ID:</Text><Text color="gray.500">{selectedOffer.chatRoomId}</Text></Box>}{selectedOffer.matchScore && <Box><Text fontWeight="bold" color="gray.400">Match Score:</Text><Badge colorScheme={selectedOffer.matchScore > 70 ? "green" : selectedOffer.matchScore > 40 ? "yellow" : "red"}>{selectedOffer.matchScore}%</Badge></Box>}</VStack>)}</ModalBody>
          <ModalFooter><Button colorScheme="blue" onClick={onOfferModalClose}>Close</Button></ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isBlastModalOpen} onClose={onBlastModalClose} size="lg" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
        <ModalContent bg="gray.900" border="1px solid rgba(0,100,255,0.3)" borderRadius="2xl" maxH="85vh">
          <ModalHeader color="white" borderBottom="1px solid rgba(0,100,255,0.3)"><HStack><Icon as={FaFire} color="orange.400" /><Box><Text fontSize="lg" fontWeight="bold">Blast Comments</Text><Text fontSize="xs" color="gray.400">{selectedBlast?.message?.substring(0, 50)}</Text></Box></HStack></ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>{isLoadingComments ? (<Flex justify="center" py={8}><Spinner color="blue.500" /><Text ml={3}>Loading comments...</Text></Flex>) : blastComments.length === 0 ? (<VStack py={8}><Icon as={FaComment} boxSize={12} color="gray.600" /><Text color="gray.500">No comments yet</Text></VStack>) : (<VStack spacing={3} align="stretch">{blastComments.map((comment, idx) => (<Box key={idx} p={3} bg="gray.800" borderRadius="lg"><HStack justify="space-between" mb={2}><HStack><Avatar size="xs" name={comment.userId} /><Text fontWeight="bold" color="white" fontSize="sm">{comment.userId?.substring(0, 15)}...</Text></HStack><Text fontSize="xs" color="gray.500">{formatDate(comment.timestamp)}</Text></HStack><Text color="gray.300" fontSize="sm">{comment.message}</Text></Box>))}</VStack>)}</ModalBody>
          <ModalFooter><Button colorScheme="blue" onClick={onBlastModalClose}>Close</Button></ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isBlastDetailsModalOpen} onClose={onBlastDetailsModalClose} size="xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
        <ModalContent bg="gray.900" border="1px solid rgba(0,100,255,0.3)" borderRadius="2xl" maxH="85vh">
          <ModalHeader color="white" borderBottom="1px solid rgba(0,100,255,0.3)"><HStack><Icon as={FaFire} color="orange.400" /><Box><Text fontSize="lg" fontWeight="bold">Blast Details</Text><Text fontSize="xs" color="gray.400">{selectedBlast?.message?.substring(0, 50)}</Text></Box></HStack></ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}><VStack align="start" spacing={6}><Card bg="rgba(0,100,255,0.1)" w="100%" p={4}><HStack spacing={4}><Avatar size="lg" name={selectedBlast?.creatorName} src={selectedBlast?.creatorProfilePic} /><Box><Text color="white" fontSize="lg" fontWeight="bold">{selectedBlast?.creatorName}</Text><Text color="gray.400">Created by: {selectedBlast?.createdBy}</Text><Text fontSize="sm" color="gray.500">{formatDate(selectedBlast?.timestamp)}</Text></Box></HStack></Card><Box w="100%"><Text color="blue.400" fontWeight="bold" mb={2}>Message:</Text><Text color="white" fontSize="lg">{selectedBlast?.message}</Text><HStack mt={3}><Badge colorScheme={selectedBlast?.status === "active" ? "green" : "gray"}>{selectedBlast?.status}</Badge>{selectedBlast?.isAIBlast && <Badge colorScheme="purple">AI Generated</Badge>}<Badge colorScheme="blue">{selectedBlast?.actualCommentCount || 0} Comments</Badge></HStack></Box><Box w="100%"><Text color="purple.400" fontWeight="bold" mb={2}>Creator&apos;s AI Summary:</Text>{blastCreator ? (<Card bg="rgba(255,255,255,0.05)" p={4} w="100%">{renderFullAISummary(blastCreator?.aiSummary)}</Card>) : (<Text color="gray.500">No AI summary available for this user</Text>)}</Box></VStack></ModalBody>
          <ModalFooter><Button colorScheme="blue" onClick={onBlastDetailsModalClose}>Close</Button></ModalFooter>
        </ModalContent>
      </Modal>

      {/* SHARE USER CHATROOMS MODAL */}
      <Modal isOpen={isShareChatroomsModalOpen} onClose={onShareChatroomsModalClose} size="lg" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
        <ModalContent bg="gray.900" border="1px solid rgba(0,100,255,0.3)" borderRadius="2xl" maxH="85vh">
          <ModalHeader color="white" borderBottom="1px solid rgba(0,100,255,0.3)">
            <HStack>
              <Icon as={FaComments} color="purple.400" />
              <Box>
                <Text fontSize="lg" fontWeight="bold">Chat Rooms</Text>
                <Text fontSize="xs" color="gray.400">{selectedShareBlast?.creatorName}&apos;s conversations</Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            {isLoadingShareChatRooms ? (
              <Flex justify="center" py={8}><Spinner color="purple.500" /><Text ml={3} color="gray.400">Loading chat rooms...</Text></Flex>
            ) : shareUserChatRooms.length === 0 ? (
              <VStack py={8}>
                <Icon as={FaComments} boxSize={12} color="gray.600" />
                <Text color="gray.500">No chat rooms found for this user</Text>
              </VStack>
            ) : (
              <VStack spacing={3} align="stretch">
                {shareUserChatRooms.map((room) => (
                  <Box
                    key={room.id}
                    p={4}
                    bg="rgba(255,255,255,0.04)"
                    border="1px solid rgba(100,100,255,0.2)"
                    borderRadius="lg"
                    cursor="pointer"
                    _hover={{ bg: "rgba(100,100,255,0.1)", borderColor: "purple.500" }}
                    onClick={() => openShareChatMessages(room)}
                  >
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text color="white" fontWeight="bold" fontSize="sm" noOfLines={1}>
                          Room: {room.id?.substring(0, 30)}...
                        </Text>
                        <HStack spacing={3}>
                          <Badge colorScheme="blue" fontSize="xs">{room.participants?.length || 0} participants</Badge>
                          <Badge colorScheme="green" fontSize="xs">{room.messageCount || 0} messages</Badge>
                        </HStack>
                        <Text fontSize="xs" color="gray.500">Last active: {formatDate(room.lastActivity)}</Text>
                      </VStack>
                      <Icon as={FaChevronRight} color="purple.400" />
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter><Button colorScheme="purple" onClick={onShareChatroomsModalClose}>Close</Button></ModalFooter>
        </ModalContent>
      </Modal>

      {/* SHARE CHAT MESSAGES MODAL */}
      <Modal isOpen={isShareChatMessagesModalOpen} onClose={onShareChatMessagesModalClose} size="xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(5px)" />
        <ModalContent bg="gray.900" border="1px solid rgba(0,100,255,0.3)" borderRadius="2xl" maxH="85vh">
          <ModalHeader color="white" borderBottom="1px solid rgba(0,100,255,0.3)">
            <HStack>
              <Icon as={FaComment} color="blue.400" />
              <Box>
                <Text fontSize="lg" fontWeight="bold">Chat Messages</Text>
                <Text fontSize="xs" color="gray.400" noOfLines={1}>Room: {selectedShareChatRoom?.id?.substring(0, 40)}</Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            {isLoadingShareChatMessages ? (
              <Flex justify="center" py={8}><Spinner color="blue.500" /><Text ml={3} color="gray.400">Loading messages...</Text></Flex>
            ) : shareChatMessages.length === 0 ? (
              <VStack py={8}>
                <Icon as={FaComment} boxSize={12} color="gray.600" />
                <Text color="gray.500">No messages in this chat room</Text>
              </VStack>
            ) : (
              <VStack spacing={3} align="stretch">
                {shareChatMessages.map((msg, idx) => {
                  const senderName = userMap[msg.senderId]?.username || msg.senderId?.substring(0, 15) || "Unknown";
                  const senderPic = userMap[msg.senderId]?.profilePicURL || "";
                  return (
                    <Box key={msg.id || idx} p={3} bg="rgba(255,255,255,0.04)" borderRadius="lg">
                      <HStack justify="space-between" mb={2}>
                        <HStack>
                          <Avatar size="xs" name={senderName} src={senderPic} />
                          <Text fontWeight="bold" color="blue.300" fontSize="sm">{senderName}</Text>
                        </HStack>
                        <Text fontSize="xs" color="gray.500">{formatDate(msg.timestamp)}</Text>
                      </HStack>
                      <Text color="gray.200" fontSize="sm" ml={8}>{msg.text || msg.message || ""}</Text>
                    </Box>
                  );
                })}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" color="gray.400" mr={3} onClick={onShareChatMessagesModalClose}>Close</Button>
            <Button colorScheme="purple" onClick={() => { onShareChatMessagesModalClose(); }}>Back to Rooms</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default DashboardPage;