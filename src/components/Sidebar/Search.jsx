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
  useDisclosure,
} from "@chakra-ui/react";
import { useRef } from "react";
import useSearchUserByProfession from "../../hooks/useSearchUserByProfession";
import useFetchAllUsers from "../../hooks/useFetchAllUsers"; // Import the all-users hook
import SuggestedTimeSellers from "../SuggestedTimeSellers/SuggestedTimeSeller";

const Search = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const searchRef = useRef(null);

  // Hook to search user by profession
  const { userProfile, isLoading: isSearching } = useSearchUserByProfession(
    searchRef.current?.value
  );

  // Hook to fetch all users
  const {
    allUsers,
    isLoading: isAllUsersLoading,
    fetchAllUsers,
  } = useFetchAllUsers();

  // Handle form submission for profession-based search
  const handleSearchUser = (e) => {
    e.preventDefault();
    onClose(); // Close the modal
  };

  // Open modal and fetch all users when the "All Users" button is clicked
  const handleFetchAllUsers = () => {
    fetchAllUsers();
    onOpen();
  };

  const commonIconSize = 25;

  return (
    <>
      {/* Tooltip and Icon for opening the Search modal */}
      <Tooltip
        hasArrow
        label={"Search TimeSellers"}
        placement="right"
        ml={1}
        openDelay={500}
        display={{ base: "block", md: "none" }}
      >
        <Flex
          alignItems={"center"}
          gap={4}
          _hover={{ bg: "whiteAlpha.400" }}
          borderRadius={6}
          p={2}
          w={{ base: 10, md: "full" }}
          justifyContent={{ base: "center", md: "flex-start" }}
          onClick={onOpen}
        >
          <img
            src="/search.png"
            alt="search"
            style={{ width: commonIconSize, height: "auto" }}
          />
          <Box display={{ base: "none", md: "block" }}>Search</Box>
        </Flex>
      </Tooltip>

      {/* Button to show all users */}
      <Button onClick={handleFetchAllUsers} isLoading={isAllUsersLoading} mt={4}>
        All Users
      </Button>

      {/* Modal for Search */}
      <Modal isOpen={isOpen} onClose={onClose} motionPreset="slideInLeft" size="Xl">
        <ModalOverlay />
        <ModalContent bg={"black"} border={"1px solid gray"} maxW={"400px"}>
          <ModalHeader>Search TimeSeller</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {/* Profession Search Form */}
            <form onSubmit={handleSearchUser}>
              <FormControl>
                <FormLabel>Profession</FormLabel>
                <Input placeholder="Search TimeSellers" ref={searchRef} />
              </FormControl>
              <Flex w={"full"} justifyContent={"flex-end"}>
                <Button
                  type="submit"
                  ml={"auto"}
                  size={"sm"}
                  my={4}
                  isLoading={isSearching}
                >
                  Search
                </Button>
              </Flex>
            </form>

            {/* Display Profession-based Search Results */}
            {userProfile && <SuggestedTimeSellers user={userProfile} />}
            {userProfile && (
              <Box mt={4}>
                <strong>Username:</strong> {userProfile.username}
                <br />
                <strong>Profession:</strong> {userProfile.profession}
              </Box>
            )}

            {/* Display All Users if Available */}
            {allUsers.length > 0 && (
              <Box mt={4}>
                <strong>All Users:</strong>
                {allUsers.map((user, index) => (
                  <Box
                    key={index}
                    mt={2}
                    p={2}
                    border={"1px solid gray"}
                    borderRadius={4}
                  >
                    <strong>Username:</strong> {user.username}
                    <br />
                    <strong>Profession:</strong> {user.profession}
                  </Box>
                ))}
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default Search;
