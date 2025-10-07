import { Box, Flex, Spinner } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import Sidebar from '../../components/Sidebar/Sidebar';
// Remove ChatbotPage import—it's handled in routes

const PageLayout = ({ children }) => {
  const { pathname } = useLocation();
  const [user, loading] = useAuthState(auth);
  
  // Show spinner only during initial auth load
  if (loading) {
    return <PageLayoutSpinner />;
  }

  const canRenderSidebar = pathname !== "/auth" && user;

  return (
    <Flex flexDir={{ base: "column", md: "row" }} minH="100vh">
      {/* Sidebar: Only for auth'd users, not on auth page */}
      {canRenderSidebar ? (
        <Box
          w={{ base: "100%", md: "150px" }}
          position={{ base: "fixed", md: "sticky" }}
          bottom={{ base: 0, md: "auto" }}
          top={{ base: "auto", md: 0 }}
          left={0}
          right={0}
          zIndex={1000}
        >
          <Sidebar />
        </Box>
      ) : null}

      {/* Main content: Always render children (routes handle auth guards) */}
      <Box
        flex={1}
        w={{ base: "100%", md: "calc(100% - 150px)" }}
        ml={{ base: 0, md: "0px" }}
        pb={{ base: "60px", md: 0 }}
        display="flex"
        justifyContent={{ base: "center", md: "flex-start" }}
        alignItems={{ base: "center", md: "flex-start" }}
      >
        {children}
      </Box>
    </Flex>
  );
};

const PageLayoutSpinner = () => {
  return (
    <Flex flexDir="column" h="100vh" alignItems="center" justifyContent="center">
      <Spinner size="xl" />
    </Flex>
  );
};

export default PageLayout;