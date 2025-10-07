import { useRef, useState, useCallback, memo, useEffect } from "react";
import {
  Box,
  Flex,
  Tooltip,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
  useDisclosure,
  Image,
  CloseButton,
  keyframes,
  Progress,
  Text,
  Spinner,
} from "@chakra-ui/react";
import { BsFillImageFill, BsFillCameraVideoFill } from "react-icons/bs";
import usePreviewMedia from "../../hooks/usePreviewMedia";
import useShowToast from "../../hooks/useShowToast";
import useAuthStore from "../../store/authStore";
import usePostStore from "../../store/postStore";
import useUserProfileStore from "../../store/userProfileStore";
import { useLocation, useNavigate } from "react-router-dom";
import { addDoc, arrayUnion, collection, doc, updateDoc, setDoc } from "firebase/firestore";
import { firestore, storage, auth } from "../../firebase/firebase";
import { getDownloadURL, ref, uploadString } from "firebase/storage";

// Pulse animation
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const CreatePost = memo(() => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const commonIconSize = 25;
  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const { handleMediaChange, selectedFile, setSelectedFile, fileType } = usePreviewMedia();
  const showToast = useShowToast();
  const { isLoading, handleCreatePost } = useCreatePost(setUploadProgress);
  const authUser = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  // Sync with Firebase auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("CreatePost: authUser loaded:", user);
        setIsAuthLoading(false);
      } else {
        console.log("CreatePost: No authUser, redirecting to /auth");
        setIsAuthLoading(false);
        navigate("/auth", { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Close modal if user logs out while it's open
  useEffect(() => {
    if (!authUser && isOpen) {
      onClose();
    }
  }, [authUser, isOpen, onClose]);

  const handlePostCreation = useCallback(async () => {
    if (!authUser) {
      showToast("Error", "Please sign in to create a post", "error");
      navigate("/auth", { replace: true });
      return;
    }
    try {
      const tagsArray = tags.split(",").map((tag) => tag.trim()).filter(Boolean);
      await handleCreatePost(selectedFile, caption, fileType, tagsArray, authUser.uid);
      onClose();
      setCaption("");
      setTags("");
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error("Error during post creation:", error.message);
      showToast("Error", error.message, "error");
    }
  }, [selectedFile, caption, fileType, tags, handleCreatePost, onClose, setSelectedFile, authUser, showToast, navigate]);

  if (isAuthLoading) {
    return (
      <Flex justify="center" align="center" height="100vh" bg="black">
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  return (
    <>
      <Tooltip
        hasArrow
        label="Trade Time"
        placement="right"
        ml={1}
        openDelay={500}
        display={{ base: "block", md: "none" }}
      >
        <Flex
          alignItems="center"
          gap={2}
          bgGradient="linear(to-r, teal.500, purple.500)"
          borderRadius={10}
          p={2}
          w={{ base: 10, md: "auto" }}
          minW={{ md: "140px" }}
          justifyContent={{ base: "center", md: "flex-start" }}
          onClick={onOpen}
          cursor="pointer"
          boxShadow="0 0 15px rgba(0, 255, 255, 0.6)"
          animation={`${pulse} 2s infinite ease-in-out`}
          _hover={{
            bgGradient: "linear(to-r, teal.600, purple.600)",
            transform: "scale(1.15)",
            boxShadow: "0 0 25px rgba(0, 255, 255, 0.8)",
          }}
          transition="all 0.3s ease"
          flexWrap="nowrap"
        >
          <Image
            src="/sell.png"
            alt="Sell Time"
            style={{ width: commonIconSize, height: "auto" }}
            filter="brightness(1.5) drop-shadow(0 0 5px rgba(255, 255, 255, 0.7))"
          />
          <Box
            display={{ base: "none", md: "block" }}
            color="white"
            fontWeight="bold"
            whiteSpace="nowrap"
          >
            Trade Time
          </Box>
        </Flex>
      </Tooltip>

      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent bg="black" border="1px solid gray" borderRadius="lg">
          <ModalHeader color="white">Trade Time</ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody pb={6}>
            <Textarea
              placeholder="Just convince someone to give you money (showcase what value you can provide)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              bg="gray.800"
              color="white"
              border="none"
              resize="vertical"
              maxLength={500}
            />
            <Input
              mt={4}
              placeholder="Target Audience (e.g.,students in hyderabad,schools,farmers etc)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              bg="gray.800"
              color="white"
              border="none"
            />
            <Input
              type="file"
              hidden
              ref={imageRef}
              onChange={(e) => handleMediaChange(e, "image")}
              accept="image/*"
            />
            <Input
              type="file"
              hidden
              ref={videoRef}
              onChange={(e) => handleMediaChange(e, "video")}
              accept="video/*"
            />
            <Flex mt={4} gap={4}>
              <BsFillImageFill
                onClick={() => imageRef.current.click()}
                style={{ cursor: "pointer" }}
                size={20}
                color="white"
              />
              <BsFillCameraVideoFill
                onClick={() => videoRef.current.click()}
                style={{ cursor: "pointer" }}
                size={20}
                color="white"
              />
            </Flex>

            {selectedFile && (
              <Flex
                mt={5}
                w="full"
                position="relative"
                justifyContent="center"
                borderRadius="md"
                overflow="hidden"
              >
                {fileType === "image" ? (
                  <Image
                    src={selectedFile}
                    alt="Selected image"
                    maxH="400px"
                    objectFit="contain"
                  />
                ) : (
                  <video
                    controls
                    style={{ width: "100%", maxHeight: "400px" }}
                    preload="metadata"
                  >
                    <source src={selectedFile} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
                <CloseButton
                  position="absolute"
                  top={2}
                  right={2}
                  bg="blackAlpha.600"
                  color="white"
                  onClick={() => setSelectedFile(null)}
                />
              </Flex>
            )}

            {isLoading && (
              <Box mt={4}>
                <Progress
                  value={uploadProgress}
                  size="sm"
                  colorScheme="teal"
                  hasStripe
                  isAnimated
                />
                <Text fontSize="sm" color="gray.400" mt={1}>
                  Uploading: {Math.round(uploadProgress)}%
                </Text>
              </Box>
            )}

            <Button
              mt={4}
              variant="outline"
              colorScheme="teal"
              onClick={() => console.log("Start Marketing Clicked")}
            >
              Start Marketing
            </Button>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="teal"
              mr={3}
              onClick={handlePostCreation}
              isLoading={isLoading}
              isDisabled={!selectedFile || isLoading || !authUser}
              loadingText="Posting..."
            >
              Post
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
});

function useCreatePost(setUploadProgress) {
  const showToast = useShowToast();
  const [isLoading, setIsLoading] = useState(false);
  const createPost = usePostStore((state) => state.CreatePost);
  const addPost = useUserProfileStore((state) => state.addPost);
  const { pathname } = useLocation();

  const handleCreatePost = useCallback(
    async (selectedFile, caption, fileType, tags, uid) => {
      if (!selectedFile) {
        showToast("Error", "Please select a file", "error");
        return;
      }
      if (!uid) {
        showToast("Error", "User not authenticated", "error");
        return;
      }
      setIsLoading(true);

      // Ensure user document exists
      const userDocRef = doc(firestore, "users", uid);
      try {
        await setDoc(
          userDocRef,
          { posts: [], createdAt: Date.now() },
          { merge: true }
        );
      } catch (error) {
        console.error("Error ensuring user document:", error.message);
      }

      const newPost = {
        caption: caption || "",
        tags: tags || [],
        likes: [],
        comments: [],
        createdAt: Date.now(),
        createdBy: uid,
      };

      try {
        const postDocRef = await addDoc(collection(firestore, "posts"), newPost);
        const fileRef = ref(storage, `posts/${postDocRef.id}`);

        await uploadString(fileRef, selectedFile, "data_url", {
          progress: (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
        });

        const downloadURL = await getDownloadURL(fileRef);

        await updateDoc(postDocRef, {
          [fileType === "image" ? "imageURL" : "videoURL"]: downloadURL,
        });

        await updateDoc(userDocRef, { posts: arrayUnion(postDocRef.id) });

        const postWithId = {
          ...newPost,
          id: postDocRef.id,
          [fileType === "image" ? "imageURL" : "videoURL"]: downloadURL,
        };

        try {
          createPost(postWithId);
          addPost(postWithId);
        } catch (storeError) {
          console.error("Error updating stores:", storeError.message);
        }

        showToast("Success", "Post created successfully", "success");
      } catch (error) {
        console.error("Error during post creation:", error.message);
        showToast("Error", error.message, "error");
      } finally {
        setIsLoading(false);
        setUploadProgress(0);
      }
    },
    [createPost, addPost, showToast, setUploadProgress]
  );

  return { isLoading, handleCreatePost };
}

export default CreatePost;
export { useCreatePost };