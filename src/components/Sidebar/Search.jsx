import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tooltip,
  Text,
  Avatar,
  VStack,
  useDisclosure,
  keyframes,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useFetchAllUsers from "../../hooks/useFetchAllUsers";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../../firebase/firebase";
import useShowToast from "../../hooks/useShowToast";

// Flicker animation for mobile text
const flicker = keyframes`
  0%, 100% { text-shadow: 0 0 5px rgba(75, 158, 255, 0.8); }
  50% { text-shadow: 0 0 10px rgba(75, 158, 255, 1); }
`;

const Search = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { filteredUsers, searchUsers, isLoading } = useFetchAllUsers();
  const showToast = useShowToast();
  const { pathname } = useLocation();
  const isActive = pathname === '/search'; // Adjust based on your route

  const getUserProfile = async (uid) => {
    try {
      const userQuery = query(collection(firestore, "users"), where("uid", "==", uid));
      const querySnapshot = await getDocs(userQuery);
      
      if (querySnapshot.empty) {
        showToast("Error", "User not found", "error");
        return null;
      }
      
      return querySnapshot.docs[0].data();
    } catch (error) {
      showToast("Error", error.message, "error");
      return null;
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const searchValue = searchRef.current.value.trim();
    setSearchQuery(searchValue);
    searchUsers(searchValue);
  };

  const navigateToProfile = async (uid) => {
    const userProfile = await getUserProfile(uid);
    if (userProfile) navigate(`/${userProfile.username}`);
  };

  return (
    <>
      <Tooltip
        hasArrow
        label="Search OpenWorld"
        placement="right"
        ml={1}
        openDelay={500}
        display={{ base: "block", md: "none" }}
      >
        <Flex
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
          onClick={onOpen}
        >
          <img
            src="/search.png"
            alt="search"
            style={{
              width: 25,
              height: "auto",
              filter: {
                base: `drop-shadow(0 0 5px rgba(75, 158, 255, ${isActive ? 0.8 : 0.5})) brightness(1.5)`,
                md: "none",
              },
            }}
          />
          <Box
            display={{ base: "block", md: "block" }}
            color="#87CEEB"
            fontWeight="bold"
            fontSize={{ base: "xs", md: "md" }}
            fontStyle="italic"
            animation={{ base: `${flicker} 1.5s infinite`, md: "none" }}
          >
            Search
          </Box>
        </Flex>
      </Tooltip>

      <Modal isOpen={isOpen} onClose={onClose} motionPreset="slideInLeft" size="lg">
        <ModalOverlay />
        <ModalContent bg="black" border="1px solid gray">
          <ModalHeader>Search Users</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSearch}>
              <FormControl>
                <FormLabel>Find TimeTraders</FormLabel>
                <Input placeholder="Search by name or profession" ref={searchRef} />
              </FormControl>
              <Flex w="full" justifyContent="flex-end">
                <Button type="submit" ml="auto" size="sm" my={4} isLoading={isLoading}>
                  Search
                </Button>
              </Flex>
            </form>

            {filteredUsers.length > 0 && (
              <VStack mt={4} align="stretch">
                <Text fontWeight="bold">Results:</Text>
                {filteredUsers.map((user) => (
                  <Flex
                    key={user.uid}
                    align="center"
                    gap={4}
                    p={2}
                    borderRadius={6}
                    bg="gray.700"
                    cursor="pointer"
                    _hover={{ bg: "gray.600" }}
                    onClick={() => navigateToProfile(user.uid)}
                  >
                    <Avatar
                      size="md"
                      src={user.profilePicURL || "/default-avatar.png"}
                      name={user.username}
                    />
                    <Box>
                      <Text fontWeight="bold">{user.username}</Text>
                      <Text fontSize="sm" color="gray.400">
                        {user.profession}
                      </Text>
                    </Box>
                  </Flex>
                ))}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default Search;