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
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useFetchAllUsers from "../../hooks/useFetchAllUsers";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../../firebase/firebase";
import useShowToast from "../../hooks/useShowToast";

const Search = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { filteredUsers, searchUsers, isLoading } = useFetchAllUsers();
  const showToast = useShowToast();

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
      <Tooltip label="Search OpenWorld" placement="right" openDelay={500}>
        <Flex
          alignItems="center"
          gap={4}
          _hover={{ bg: "whiteAlpha.400" }}
          borderRadius={6}
          p={2}
          w={{ base: 10, md: "full" }}
          justifyContent={{ base: "center", md: "flex-start" }}
          onClick={onOpen}
        >
          <img src="/search.png" alt="search" style={{ width: 25 }} />
          <Box display={{ base: "none", md: "block" }}>Search</Box>
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
                    <Avatar size="md" src={user.profilePicURL || "/default-avatar.png"} name={user.username} />
                    <Box>
                      <Text fontWeight="bold">{user.username}</Text>
                      <Text fontSize="sm" color="gray.400">{user.profession}</Text>
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