import { Box, Flex, Link, Tooltip, Button, useDisclosure} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { BiLogOut } from "react-icons/bi";
import useLogout from '../../hooks/useLogout';
import Sidebaritems from './Sidebaritems';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const Sidebar = () => {
  const { handleLogout, isLoggingOut } = useLogout();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Animation variants for mobile sidebar
  const sidebarVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 },
    },
  };

  return (
    <MotionBox
      height={{ base: "auto", md: "100vh" }}
      py={{ base: 2, md: 8 }}
      position={{ base: "fixed", md: "sticky" }}
      bottom={{ base: 0, md: "auto" }}
      top={{ base: "auto", md: 0 }}
      left={0}
      right={0}
      px={{ base: 2, md: 4 }}
      bg={{ base: "blackAlpha.800", md: "transparent" }} // Black with slight transparency for base, transparent for md
      zIndex={10}
      initial={{ base: "hidden", md: false }}
      animate={{ base: "visible", md: false }}
      variants={{ base: sidebarVariants, md: {} }}
    >
      <Flex
        direction={{ base: "row", md: "column" }}
        height={{ base: "auto", md: "100%" }}
        justifyContent={{ base: "space-around", md: "space-between" }}
        alignItems={{ base: "center", md: "flex-start" }}
      >
        {/* Logo (Hidden on Mobile) */}
        <Link to={"/"} as={RouterLink} pl={2} display={{ base: "none", md: "block" }} cursor="pointer">
          <img src="/xopenworld.png" alt="OpenWorld Logo" style={{ width: '120px', height: 'auto' }} />
        </Link>

        {/* Sidebar Items */}
        <Sidebaritems />

        {/* Logout */}
        <Tooltip
          hasArrow
          label={"Logout"}
          placement="right"
          ml={1}
          openDelay={500}
          display={{ base: 'block', md: 'none' }}
        >
          <Flex
            onClick={handleLogout}
            alignItems={"center"}
            gap={4}
            _hover={{ bg: "whiteAlpha.400" }}
            borderRadius={6}
            p={2}
            w={{ base: 10, md: "full" }}
            justifyContent={{ base: "center", md: "flex-start" }}
            display={{ base: "none", md: "flex" }}
          >
            <BiLogOut size={25} />
            <Button
              display={{ base: "none", md: "block" }}
              variant={"ghost"}
              _hover={{ bg: "transparent" }}
              isLoading={isLoggingOut}
            >
              Logout
            </Button>
          </Flex>
        </Tooltip>
      </Flex>

      {/* Modal for Mode Options - Removed since Mode button is removed */}
    </MotionBox>
  );
};

export default Sidebar;