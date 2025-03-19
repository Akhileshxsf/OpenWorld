import { useState, useEffect } from "react";
import {
  firestore,
  storage,
  auth,
} from "../../firebase/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  where,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import {
  Box,
  Grid,
  VStack,
  Skeleton,
  Image,
  Flex,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Textarea,
  Button,
  Input,
  useToast,
  Text,
  Avatar,
  Progress,
  Spinner,
} from "@chakra-ui/react";
import { FaPlus } from "react-icons/fa";
import { useParams } from "react-router-dom";

const ProfilePosts = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPost, setNewPost] = useState({ caption: "", img: null });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [userData, setUserData] = useState({ username: "", profilePic: "" });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const user = auth.currentUser;
  const { username } = useParams();

  useEffect(() => {
    if (!user) {
      toast({
        title: "Error",
        description: "User is not logged in.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
          setUserData(userDocSnapshot.data());
        } else {
          console.error("No user document found!");
          toast({
            title: "Error",
            description: "User not found.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        const q = query(
          collection(firestore, "userPosts"),
          where("username", "==", username),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const fetchedPosts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(fetchedPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);
        toast({
          title: "Error",
          description: "Failed to load posts. Please try again later.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [username, user, toast]);

  const handleAddPost = async () => {
    if (!newPost.caption || !newPost.img) {
      toast({
        title: "Error",
        description: "Please provide a caption and an image.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(newPost.img.type)) {
      toast({
        title: "Error",
        description: "Only JPEG, PNG, and GIF images are allowed.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (newPost.img.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Error",
        description: "Image size must be less than 5MB.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);
    try {
      const imageName = `${Date.now()}_${newPost.img.name}`;
      const storageRef = ref(storage, `posts/${imageName}`);
      const uploadTask = uploadBytesResumable(storageRef, newPost.img);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Image upload error:", error);
          toast({
            title: "Error",
            description: "Failed to upload image. Please try again.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          const postRef = collection(firestore, "userPosts");
          await addDoc(postRef, {
            caption: newPost.caption,
            img: downloadURL,
            userId: user.uid,
            username: userData.username,
            profilePic: userData.profilePic || "/defaultProfilePic.png",
            createdAt: new Date(),
          });

          toast({
            title: "Post Added",
            description: "Your post has been successfully added.",
            status: "success",
            duration: 3000,
            isClosable: true,
          });

          setPosts((prevPosts) => [
            {
              caption: newPost.caption,
              img: downloadURL,
              username: userData.username,
              createdAt: new Date(),
            },
            ...prevPosts,
          ]);
          setNewPost({ caption: "", img: null });
          setUploadProgress(0);
          setIsUploading(false);
          onClose();
        }
      );
    } catch (error) {
      console.error("Error adding post:", error);
      toast({
        title: "Error",
        description: "Failed to add post. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setNewPost((prev) => ({ ...prev, img: e.target.files[0] }));
    }
  };

  return (
    <>
      <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
        {isLoading ? (
          [0, 1, 2, 3, 4, 5].map((_, idx) => (
            <VStack key={idx} alignItems="flex-start" gap={4}>
              <Skeleton w="full" height="300px" />
            </VStack>
          ))
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <Box
              key={post.id}
              bg="white"
              boxShadow="md"
              borderRadius="lg"
              overflow="hidden"
              _hover={{ transform: "scale(1.02)", transition: "transform 0.3s" }}
            >
              <Image
                src={post.img}
                alt="Post Image"
                w="full"
                h="300px"
                objectFit="cover"
              />
              <Box p={4}>
                <Text fontSize="sm" color="#000000">
                  {post.caption}
                </Text>
              </Box>
            </Box>
          ))
        ) : (
          <Text>No posts available.</Text>
        )}
      </Grid>

      {user?.uid && (
        <Flex
          position="fixed"
          bottom="40px"
          right="40px"
          alignItems="center"
          justifyContent="center"
          bg="blue.600"
          color="white"
          cursor="pointer"
          borderRadius="full"
          boxSize="50px"
          onClick={onOpen}
          _hover={{ bg: "blue.500" }}
        >
          <IconButton
            icon={<FaPlus />}
            aria-label="Add Post"
            size="lg"
            bg="transparent"
            color="white"
            _hover={{ bg: "transparent" }}
          />
        </Flex>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent borderRadius="lg">
          <ModalHeader>Add New Post</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Textarea
                placeholder="Write a caption..."
                value={newPost.caption}
                onChange={(e) =>
                  setNewPost((prev) => ({ ...prev, caption: e.target.value }))
                }
              />
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                borderColor="gray.300"
              />
              {newPost.img && (
                <Box mt={4}>
                  <Image
                    src={URL.createObjectURL(newPost.img)}
                    alt="New Post Preview"
                    boxSize="200px"
                    objectFit="cover"
                    borderRadius="md"
                  />
                </Box>
              )}
              {isUploading && (
                <Progress value={uploadProgress} size="sm" colorScheme="blue" />
              )}
              <Button
                colorScheme="blue"
                onClick={handleAddPost}
                isDisabled={!newPost.caption || !newPost.img || isUploading}
                mt={4}
                width="full"
              >
                {isUploading ? <Spinner size="sm" /> : "Add Post"}
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfilePosts;