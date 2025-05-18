import { Container, Flex, Link, Skeleton, SkeletonCircle, Text, VStack } from "@chakra-ui/react";
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
      <Flex flexDir="column" textAlign="center" mx="auto" py={10}>
        <Text fontSize="2xl" color="red.500">
          Error: {error}
        </Text>
        <Link as={RouterLink} to="/" color="blue.500" w="max-content" mx="auto">
          Go home
        </Link>
      </Flex>
    );
  }

  // Handle user not found
  const userNotFound = !isLoading && !userProfile;
  if (userNotFound) return <UserNotFound username={username} />;

  return (
    <Container maxW="container.lg" py={5}>
      <Flex py={10} px={4} pl={{ base: 4, md: 10 }} w="full" mx="auto" flexDirection="column">
        {!isLoading && userProfile && <ProfileHeader userProfile={userProfile} />}
        {isLoading && <ProfileHeaderSkeleton />}
      </Flex>
      <Flex
        px={{ base: 2, sm: 4 }}
        maxW="full"
        mx="auto"
        borderTop="1px solid"
        borderColor="whiteAlpha.300"
        direction="column"
      >
        <ProfileTabs />
        <ProfilePosts />
      </Flex>
    </Container>
  );
};

export default ProfilePage;

// Skeleton loader for profile header
const ProfileHeaderSkeleton = () => {
  return (
    <Flex
      gap={{ base: 4, sm: 10 }}
      py={10}
      direction={{ base: "column", sm: "row" }}
      justifyContent="center"
      alignItems="center"
      aria-label="Loading profile"
    >
      <SkeletonCircle size="24" aria-label="Loading avatar" />
      <VStack alignItems={{ base: "center", sm: "flex-start" }} gap={2} mx="auto" flex={1}>
        <Skeleton height="12px" width="150px" />
        <Skeleton height="12px" width="100px" />
      </VStack>
    </Flex>
  );
};

// User not found component
const UserNotFound = ({ username }) => {
  return (
    <Flex flexDir="column" textAlign="center" mx="auto" py={10}>
      <Text fontSize="2xl">User "{username}" Not Found</Text>
      <Link as={RouterLink} to="/" color="blue.500" w="max-content" mx="auto" aria-label="Return to homepage">
        Go home
      </Link>
    </Flex>
  );
};