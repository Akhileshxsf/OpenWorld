import { Box, Link, Tooltip, keyframes } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

// Flicker animation for mobile text
const flicker = keyframes`
  0%, 100% { text-shadow: 0 0 5px rgba(75, 158, 255, 0.8); }
  50% { text-shadow: 0 0 10px rgba(75, 158, 255, 1); }
`;

const Home = () => {
  const commonIconSize = { base: 30, md: 25 };
  const { pathname } = useLocation();
  const isActive = pathname === '/';

  return (
    <Tooltip
      hasArrow
      placement="right"
      ml={1}
      openDelay={500}
      display={{ base: "block", md: "none" }}
    >
      <Link
        display="flex"
        to="/"
        as={RouterLink}
        alignItems="center"
        gap={{ base: 1, md: 4 }}
        bg={{ base: isActive ? "rgba(75, 158, 255, 0.3)" : "transparent", md: "transparent" }}
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
        <img
          src="/Homme.png"
          alt="Home"
          style={{
            width: commonIconSize,
            height: 'auto',
            filter: {
              base: `drop-shadow(0 0 5px rgba(75, 158, 255, ${isActive ? 0.8 : 0.5})) brightness(1.5)`,
              md: 'none',
            },
          }}
        />
        <Box
          display={{ base: "block", md: "block" }}
          color="#87CEEB"
          fontWeight="bold"
          fontSize={{ base: "xs", md: "md" }}
          fontStyle="italic"
          animation={{ base: `${flicker} 1.5s infinite`, md: 'none' }}
        >
          Home
        </Box>
      </Link>
    </Tooltip>
  );
};

export default Home;