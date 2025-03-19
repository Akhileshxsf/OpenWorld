import { Avatar, AvatarGroup, Flex, VStack, Text, Button, useDisclosure, Spinner } from "@chakra-ui/react";
import useUserProfileStore from "../../store/userProfileStore";
import useAuthStore from "../../store/authStore";
import EditProfile from "./EditProfile";
import BuyTimeModal from "./BuyTimeModal";
import { useNavigate } from 'react-router-dom';

const ProfileHeader = () => {
  const { userProfile } = useUserProfileStore();
  const authUser = useAuthStore((state) => state.user);
  const visitingOwnProfileAndAuth = authUser && authUser.username === userProfile?.username;
  const visitingAnotherProfileAndAuth = authUser && authUser.username !== userProfile?.username;
  const editProfileDisclosure = useDisclosure();
  const buyTimeDisclosure = useDisclosure();
  const navigate = useNavigate();

  const handleBuyTime = () => {
    buyTimeDisclosure.onOpen();
  };

  const handleMessage = () => {
    if (!userProfile) {
      console.error("User profile is loading...");
      return;
    }

    const targetUserId = userProfile.userId || "defaultUserId"; // Fallback userId
    navigate(`/chat/${targetUserId}`);
  };

  // If userProfile is not loaded, show a loading spinner
  if (!userProfile) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Flex gap={{ base: 4, sm: 10 }} py={10} direction={{ base: "column", sm: "row" }}>
      <AvatarGroup
        size={{ base: "xl", md: "2xl" }}
        justifySelf={"center"}
        alignSelf={"flex-start"}
        mx={"auto"}
      >
        <Avatar src={userProfile.profilePicURL} alt="User Avatar" />
      </AvatarGroup>

      <VStack alignItems={"start"} gap={2} mx={"auto"} flex={1}>
        <Flex
          gap={4}
          direction={{ base: "column", sm: "row" }}
          justifyContent={{ base: "center", sm: "flex-start" }}
          alignItems={"center"}
          w={"full"}
        >
          <Text fontSize={{ base: "sm", md: "lg" }}>{userProfile.username}</Text>

          {visitingOwnProfileAndAuth && (
            <Flex gap={4} alignItems={"center"} justifyContent={"center"}>
              <Button
                bg={"black"}
                color={"white"}
                _hover={{ bg: "navy" }}
                size={{ base: "xs", md: "sm" }}
                onClick={editProfileDisclosure.onOpen}
              >
                Edit Profile
              </Button>
            </Flex>
          )}

          {visitingAnotherProfileAndAuth && (
            <Flex gap={4} alignItems={"center"} justifyContent={"center"}>
              <Button
                bg={"black"}
                color={"gold"}
                _hover={{ bg: "navy" }}
                size={{ base: "xs", md: "sm" }}
                onClick={handleBuyTime}
              >
                BuyTime
              </Button>
              <Button
                bg={"blue.500"}
                color={"white"}
                _hover={{ bg: "blue.600" }}
                size={{ base: "xs", md: "sm" }}
                onClick={handleMessage}
              >
                Message
              </Button>
            </Flex>
          )}
        </Flex>

        <Flex alignItems={"center"} gap={{ base: 2, sm: 4 }}>
          <Text fontSize={{ base: "xs", md: "sm" }}>
            <Text as="span" fontWeight={"bold"} mr={1}>
              {userProfile.posts ? userProfile.posts.length : 0}
            </Text>
            Posts
          </Text>
          <Text fontSize={{ base: "xs", md: "sm" }}>
            <Text as="span" fontWeight={"bold"} mr={1}>
              {userProfile.SoldInstances.length}
            </Text>
            SoldInstances
          </Text>
          <Text fontSize={{ base: "xs", md: "sm" }}>
            <Text as="span" fontWeight={"bold"} mr={1}>
              {userProfile.Rating.length}
            </Text>
            Rating
          </Text>
        </Flex>

        <Flex alignItems={"center"} gap={4}>
          <Text fontSize={"sm"} fontWeight={"bold"}>
            {userProfile.profession}
          </Text>
        </Flex>

        <Text fontSize={"sm"}>{userProfile.bio}</Text>
      </VStack>

      {editProfileDisclosure.isOpen && (
        <EditProfile isOpen={editProfileDisclosure.isOpen} onClose={editProfileDisclosure.onClose} />
      )}
      {buyTimeDisclosure.isOpen && (
        <BuyTimeModal isOpen={buyTimeDisclosure.isOpen} onClose={buyTimeDisclosure.onClose} />
      )}
    </Flex>
  );
};

export default ProfileHeader;