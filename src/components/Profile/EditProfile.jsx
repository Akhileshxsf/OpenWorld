import {
  Avatar,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
} from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";
import useAuthStore from "../../store/authStore";
import usePreviewImg from "../../hooks/usePreviewImg";
import useEditProfile from "../../hooks/useEditProfile";
import useShowToast from "../../hooks/useShowToast";

const EditProfile = ({ isOpen, onClose }) => {
  const [inputs, setInputs] = useState({
    profession: "",
    username: "",
    bio: "",
  });
  const authUser = useAuthStore((state) => state.user);
  const fileRef = useRef(null);
  const { handleImageChange, selectedFile, setSelectedFile } = usePreviewImg();
  const { isUpdating, editProfile } = useEditProfile();
  const showToast = useShowToast();

  useEffect(() => {
    if (authUser) {
      setInputs({
        profession: authUser.profession || "",
        username: authUser.username || "",
        bio: authUser.bio || "",
      });
    }
  }, [authUser, isOpen]);

  const handleEditProfile = async () => {
    try {
      await editProfile(inputs, selectedFile);
      setSelectedFile(null);
      onClose();
    } catch (error) {
      showToast("Error", error.message, "error");
    }
  };

  const handleClose = () => {
    setInputs({
      profession: "",
      username: "",
      bio: "",
    });
    setSelectedFile(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent bg={"black"} boxShadow={"xl"} border={"1px solid gray"} mx={3}>
        <ModalHeader />
        <ModalCloseButton />
        <ModalBody>
          <Flex bg={"black"}>
            <Stack spacing={4} w={"full"} maxW={"md"} bg={"black"} p={6} my={0}>
              <Heading lineHeight={1.1} fontSize={{ base: "2xl", sm: "3xl" }}>
                Edit Profile
              </Heading>
              <FormControl>
                <Stack direction={["column", "row"]} spacing={6}>
                  <Center>
                    <Avatar
                      size="xl"
                      src={selectedFile || authUser.profilePicURL}
                      border={"2px solid white "}
                    />
                  </Center>
                  <Center w="full">
                    <Button w="full" onClick={() => fileRef.current.click()}>
                      Edit Profile Picture
                    </Button>
                  </Center>
                  <Input type="file" hidden ref={fileRef} onChange={handleImageChange} />
                </Stack>
              </FormControl>

              <FormControl>
                <FormLabel fontSize={"sm"}>Profession</FormLabel>
                <Input
                  placeholder={"Profession"}
                  size={"sm"}
                  type={"text"}
                  value={inputs.profession}
                  onChange={(e) => setInputs({ ...inputs, profession: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize={"sm"}>Username</FormLabel>
                <Input
                  placeholder={"Username"}
                  size={"sm"}
                  type={"text"}
                  value={inputs.username}
                  onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize={"sm"}>About  (Add Links:-portfolio website/company website/googleform (if hiring))</FormLabel>
                <Input
                  placeholder={"Just say what you do and add links "}
                  size={"sm"}
                  type={"text"}
                  value={inputs.bio}
                  onChange={(e) => setInputs({ ...inputs, bio: e.target.value })}
                />
              </FormControl>

              <Stack spacing={6} direction={["column", "row"]}>
                <Button
                  bg={"red.400"}
                  color={"white"}
                  w="full"
                  size="sm"
                  _hover={{ bg: "red.500" }}
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  bg={"blue.400"}
                  color={"white"}
                  size="sm"
                  w="full"
                  _hover={{ bg: "blue.500" }}
                  onClick={handleEditProfile}
                  isLoading={isUpdating}
                >
                  Submit
                </Button>
              </Stack>
            </Stack>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default EditProfile;