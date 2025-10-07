import { Box, Flex, Tooltip, keyframes } from "@chakra-ui/react";
import { useLocation, Link } from "react-router-dom";
import { useNotificationCount } from "../../hooks/useNotificationCount";

// Enhanced animations
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

const subtleBounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
`;

const Notifications = () => {
  const commonIconSize = 25;
  const { pathname } = useLocation();
  const isActive = pathname === "/notification";
  const { unreadCount, hasNewUpdates, updateLastChecked } = useNotificationCount();

  const handleClick = () => {
    // Mark as checked when user clicks the notification icon
    updateLastChecked();
  };

  return (
    <Tooltip
      hasArrow
      placement="right"
      ml={1}
      openDelay={500}
      display={{ base: "block", md: "none" }}
      label={`${unreadCount} unread notifications${hasNewUpdates ? ' • New updates!' : ''}`}
      bg="gray.800"
      color="white"
      borderRadius="md"
      fontSize="sm"
    >
      <Flex
        as={Link}
        to="/notification"
        alignItems="center"
        gap={{ base: 1, md: 4 }}
        bg={{
          base: isActive ? "rgba(75, 158, 255, 0.3)" : "transparent",
          md: isActive ? "whiteAlpha.200" : "transparent",
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
        {/* Main Icon Container */}
        <Box 
          position="relative" 
          display="inline-block"
          animation={hasNewUpdates ? `${subtleBounce} 2s infinite` : "none"}
        >
          <img
            src="/noti.png"
            alt="Notifications"
            style={{
              width: commonIconSize,
              height: "auto",
              animation: hasNewUpdates ? `${pulseGlow} 2s infinite` : "none",
              transition: "all 0.3s ease",
            }}
          />
          
          {/* Unread Count Badge */}
          {unreadCount > 0 && (
            <Box
              position="absolute"
              top="-6px"
              right="-6px"
              bg={hasNewUpdates ? "#FF416C" : "red.500"}
              color="white"
              borderRadius="full"
              minW={{ base: "18px", md: "20px" }}
              h={{ base: "18px", md: "20px" }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize={{ base: "xs", md: "sm" }}
              fontWeight="bold"
              boxShadow={`0 0 8px ${hasNewUpdates ? 'rgba(255, 65, 108, 0.8)' : 'rgba(255, 0, 0, 0.6)'}`}
              border="2px solid"
              borderColor="white"
              animation={hasNewUpdates ? `${pulseGlow} 1.5s infinite` : "none"}
              zIndex={2}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Box>
          )}

          {/* New Updates Pulse Ring */}
          {hasNewUpdates && unreadCount === 0 && (
            <Box
              position="absolute"
              top="-8px"
              right="-8px"
              w="12px"
              h="12px"
              bg="#FF416C"
              borderRadius="full"
              boxShadow="0 0 10px rgba(255, 65, 108, 0.8)"
              animation={`${pulseGlow} 2s infinite`}
              zIndex={1}
            />
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
          position="relative"
        >
          Notify
          {/* Underline effect for new updates */}
          {hasNewUpdates && (
            <Box
              position="absolute"
              bottom="-2px"
              left="0"
              right="0"
              height="1px"
              bg="linear-gradient(90deg, transparent, #FF416C, transparent)"
              animation={`${flicker} 2s infinite`}
            />
          )}
        </Box>
      </Flex>
    </Tooltip>
  );
};

export default Notifications;