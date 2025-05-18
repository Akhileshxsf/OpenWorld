import { Box, Flex, Spinner } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import Navbar from '../../components/Navbar/Navbar';

const PageLayout = ({ children }) => {
  const { pathname } = useLocation();
  const [user, loading] = useAuthState(auth);
  const canRenderSidebar = pathname !== "/auth" && user;
  const canRenderNavbar = !user && !loading && pathname !== "/auth";

  const checkingUserIsAuth = !user && loading;
  if (checkingUserIsAuth) return <PageLayoutSpinner />;

  return (
    <Flex flexDir={{ base: "column", md: "row" }} minH="100vh">
      {/* Sidebar */}
      {canRenderSidebar ? (
        <Box
          w={{ base: "100%", md: "150px" }} // Reduced from 200px to 150px on md and above
          position={{ base: "fixed", md: "sticky" }} // Fixed on mobile, sticky on desktop
          bottom={{ base: 0, md: "auto" }} // Bottom on mobile
          top={{ base: "auto", md: 0 }} // Top on desktop
          left={0}
          right={0}
          zIndex={1000} // Ensure sidebar stays above content
        >
          <Sidebar />
        </Box>
      ) : null}

      {/* Navbar */}
      {canRenderNavbar ? <Navbar /> : null}

      {/* Main content */}
      <Box
        flex={1}
        w={{ base: "100%", md: "calc(100% - 150px)" }} // Adjusted from 200px to 150px
        ml={{ base: 0, md: "0px" }} // Reduced offset from 200px to 150px
        pb={{ base: "60px", md: 0 }} // Padding-bottom on mobile to clear sidebar
        display="flex" // Enable flex properties for children alignment
        justifyContent={{ base: "center", md: "flex-start" }} // Center on mobile, left on desktop
        alignItems={{ base: "center", md: "flex-start" }} // Center on mobile, top-left on desktop
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