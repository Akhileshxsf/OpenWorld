import { Box, Link, Tooltip, keyframes, Badge } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { BiMessageRounded } from 'react-icons/bi';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { firestore, auth } from '../../firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

// Animations (same as above)
const flicker = keyframes`
  0%, 100% { 
    text-shadow: 0 0 5px rgba(75, 158, 255, 0.8); 
    opacity: 1;
  }
  50% { 
    text-shadow: 0 0 15px rgba(75, 158, 255, 1), 0 0 20px rgba(75, 158, 255, 0.8);
    opacity: 0.9;
  }
`;

const pulseGlow = keyframes`
  0%, 100% { 
    filter: drop-shadow(0 0 5px rgba(255, 65, 108, 0.8));
    transform: scale(1);
  }
  50% { 
    filter: drop-shadow(0 0 15px rgba(255, 65, 108, 1)) drop-shadow(0 0 25px rgba(255, 65, 108, 0.6));
    transform: scale(1.05);
  }
`;

// Simplified hook for message counts
const useMessageCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const [authUser] = useAuthState(auth);

  useEffect(() => {
    if (!authUser) {
      setUnreadCount(0);
      setHasNewUpdates(false);
      return;
    }

    // Listen for any connected chats
    const offersRef = collection(firestore, "offers");
    const connectionsQuery = query(
      offersRef,
      where("type", "==", "connection_request"),
      where("status", "==", "connected"),
      where("toUserId", "==", authUser.uid)
    );

    const unsubscribe = onSnapshot(connectionsQuery, (snapshot) => {
      // Simply show that there are active chats
      const activeChatsCount = snapshot.size;
      setUnreadCount(activeChatsCount);
      
      // For simplicity, consider any active chats as "new updates"
      // You can enhance this with actual message tracking later
      setHasNewUpdates(activeChatsCount > 0);
    });

    return () => unsubscribe();
  }, [authUser]);

  const updateLastChecked = () => {
    setHasNewUpdates(false);
  };

  return {
    unreadCount,
    hasNewUpdates,
    updateLastChecked
  };
};

const Messages = () => {
  const commonIconSize = 25; // Changed to match other components
  const { pathname } = useLocation();
  const isActive = pathname === '/messages';
  const { unreadCount, hasNewUpdates, updateLastChecked } = useMessageCount();

  const handleClick = () => {
    updateLastChecked();
  };

  return (
    <Tooltip
      hasArrow
      placement="right"
      ml={1}
      openDelay={500}
      display={{ base: "block", md: "none" }}
      label={`${unreadCount} active conversations${hasNewUpdates ? ' • New messages!' : ''}`}
      bg="gray.800"
      color="white"
      borderRadius="md"
      fontSize="sm"
    >
      <Link
        display="flex"
        to="/messages"
        as={RouterLink}
        alignItems="center"
        gap={{ base: 1, md: 4 }}
        bg={{ 
          base: isActive ? "rgba(75, 158, 255, 0.3)" : "transparent", 
          md: isActive ? "whiteAlpha.200" : "transparent" 
        }}
        borderRadius={{ base: 10, md: 6 }}
        p={{ base: 2, md: 2 }}
        w={{ base: "auto", md: "full" }}
        justifyContent={{ base: "center", md: "flex-start" }}
        flexDir={{ base: "column", md: "row" }}
        _hover={{
          bg: {
            base: "rgba(75, 158, 255, 0.4)",
            md: "whiteAlpha.300"
          },
          boxShadow: {
            base: "0 0 12px rgba(75, 158, 255, 0.6)",
            md: "0 0 8px rgba(75, 158, 255, 0.4)"
          },
          transform: "scale(1.02)",
        }}
        transition="all 0.3s ease-in-out"
        position="relative"
        overflow="visible"
        onClick={handleClick}
      >
        {/* Icon Container */}
        <Box position="relative" display="inline-block">
          <BiMessageRounded
            style={{
              width: commonIconSize,
              height: commonIconSize,
              filter: hasNewUpdates ? `drop-shadow(0 0 5px rgba(255, 65, 108, 0.8))` : 'none',
              animation: hasNewUpdates ? `${pulseGlow} 2s infinite` : 'none',
            }}
          />
          
          {/* Active Chats Badge */}
          {unreadCount > 0 && (
            <Box
              position="absolute"
              top="-6px"
              right="-6px"
              bg={hasNewUpdates ? "#FF416C" : "blue.500"}
              color="white"
              borderRadius="full"
              minW={{ base: "18px", md: "20px" }}
              h={{ base: "18px", md: "20px" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize={{ base: "xs", md: "sm" }}
              fontWeight="bold"
              boxShadow={`0 0 8px ${hasNewUpdates ? 'rgba(255, 65, 108, 0.8)' : 'rgba(59, 130, 246, 0.6)'}`}
              border="2px solid"
              borderColor="white"
              zIndex={2}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Box>
          )}
        </Box>

        {/* Label */}
        <Box
          display={{ base: "block", md: "block" }}
          color="#87CEEB"
          fontWeight="bold"
          fontSize={{ base: "xs", md: "md" }}
          fontStyle="italic"
          animation={hasNewUpdates ? `${flicker} 2s infinite` : "none"}
        >
          Messages
        </Box>
      </Link>
    </Tooltip>
  );
};

export default Messages;