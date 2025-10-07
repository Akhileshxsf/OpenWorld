import { Container, Flex, Link, Skeleton, SkeletonCircle, Text, VStack, Box } from "@chakra-ui/react";
import { useParams, Link as RouterLink } from "react-router-dom";
import useGetUserProfileByUsername from "../../hooks/useGetUserProfileByUsername";
import ProfileHeader from "../../components/Profile/ProfileHeader";
import ProfileTabs from "../../components/Profile/ProfileTabs";
import ProfilePosts from "../../components/Profile/ProfilePosts";

const ProfilePage = () => {
  const { username } = useParams();
  const { isLoading, userProfile, error } = useGetUserProfileByUsername(username);

  // Handle error state
  if (error && !isLoading) {
    return (
      <Container maxW="container.lg" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Flex flexDir="column" textAlign="center" mx="auto" py={10}>
          <Text fontSize="2xl" color="red.500" mb={4}>
            Error: {error}
          </Text>
          <Link as={RouterLink} to="/" color="blue.500" w="max-content" mx="auto">
            Go home
          </Link>
        </Flex>
      </Container>
    );
  }

  // Handle user not found
  const userNotFound = !isLoading && !userProfile;
  if (userNotFound) return <UserNotFound username={username} />;

  return (
    <Container maxW="container.lg" minH="100vh" p={0}>
      {/* Profile Header Section */}
      <Box 
        bg="black" 
        borderBottom="1px solid" 
        borderColor="whiteAlpha.300"
        px={{ base: 4, md: 6 }}
        pt={{ base: 4, md: 6 }}
        pb={{ base: 6, md: 8 }}
      >
        <Flex 
          maxW="full" 
          mx="auto" 
          flexDirection="column"
          gap={6}
        >
          {!isLoading && userProfile && (
            <ProfileHeader userProfile={userProfile} />
          )}
          {isLoading && <ProfileHeaderSkeleton />}
        </Flex>
      </Box>

      {/* Profile Content Section */}
      <Box 
        flex={1} 
        bg="black"
        px={{ base: 0, md: 6 }}
        pb={6}
      >
        <Flex
          maxW="full"
          mx="auto"
          direction="column"
        >
          <ProfileTabs />
          <ProfilePosts />
        </Flex>
      </Box>
    </Container>
  );
};

export default ProfilePage;

// Skeleton loader for profile header
const ProfileHeaderSkeleton = () => {
  return (
    <Flex
      gap={{ base: 4, sm: 8 }}
      py={2}
      direction={{ base: "column", sm: "row" }}
      justifyContent={{ base: "center", sm: "flex-start" }}
      alignItems="center"
      aria-label="Loading profile"
    >
      <SkeletonCircle 
        size={{ base: "20", md: "24" }} 
        aria-label="Loading avatar" 
      />
      
      <VStack 
        alignItems={{ base: "center", sm: "flex-start" }} 
        gap={3} 
        flex={1}
        textAlign={{ base: "center", sm: "left" }}
      >
        <VStack spacing={2} alignItems={{ base: "center", sm: "flex-start" }}>
          <Skeleton height="20px" width="200px" />
          <Skeleton height="14px" width="150px" />
        </VStack>
        
        <Flex gap={4} mt={2}>
          <VStack spacing={1} alignItems="center">
            <Skeleton height="16px" width="60px" />
            <Skeleton height="14px" width="40px" />
          </VStack>
          <VStack spacing={1} alignItems="center">
            <Skeleton height="16px" width="60px" />
            <Skeleton height="14px" width="40px" />
          </VStack>
          <VStack spacing={1} alignItems="center">
            <Skeleton height="16px" width="60px" />
            <Skeleton height="14px" width="40px" />
          </VStack>
        </Flex>
        
        <Skeleton height="14px" width="250px" mt={2} />
      </VStack>
    </Flex>
  );
};

// User not found component
const UserNotFound = ({ username }) => {
  return (
    <Container maxW="container.lg" minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <Flex flexDir="column" textAlign="center" mx="auto" py={10}>
        <Text fontSize="2xl" mb={4}>User "{username}" Not Found</Text>
        <Link 
          as={RouterLink} 
          to="/" 
          color="blue.500" 
          w="max-content" 
          mx="auto" 
          aria-label="Return to homepage"
          _hover={{ textDecoration: "none", color: "blue.400" }}
        >
          Go home
        </Link>
      </Flex>
    </Container>
  );
};