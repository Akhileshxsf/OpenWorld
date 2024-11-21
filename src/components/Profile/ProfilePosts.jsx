import { useState, useEffect } from "react";
import { firestore, auth } from "../../firebase/firebase"; // Import firestore and auth correctly
import { collection, query, orderBy, getDocs, where, addDoc, doc, getDoc } from "firebase/firestore";
import { Box, Grid, VStack, Skeleton, Image, Flex, IconButton, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Textarea, Button, Input } from "@chakra-ui/react";
import { FaPlus } from "react-icons/fa";
import { useToast } from "@chakra-ui/react";
import { useParams } from "react-router-dom"; // Import useParams for accessing the username from URL
import ProfilePost from "./ProfilePost"; // Import the ProfilePost component

const ProfilePosts = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPost, setNewPost] = useState({ caption: "", img: null });
  const [userData, setUserData] = useState({ username: "", profilePic: "" });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  const user = auth.currentUser;
  const { username } = useParams(); // Get the username from the URL parameter

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
      setIsLoading(true); // Start loading

      try {
        // Fetch user profile data based on user.uid
        const userDocRef = doc(firestore, "users", user.uid); // Fetch user document by uid
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
          setUserData(userDocSnapshot.data()); // Set user profile data
        } else {
          console.log("No such user document!");
        }

        // Query posts for the logged-in user based on username in URL
        const q = query(
          collection(firestore, "userPosts"),
          where("username", "==", username), // Fetch posts by username in URL
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const fetchedPosts = querySnapshot.docs.map((doc) => doc.data());
        console.log("Fetched posts:", fetchedPosts); // Debugging log
        setPosts(fetchedPosts); // Set posts in state
      } catch (error) {
        console.error("Error fetching data:", error); // Log errors
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    fetchPosts();
  }, [toast, user?.uid, username]); // Re-run when user or username changes

  const handleAddPost = async () => {
    if (!newPost.caption || !newPost.img) {
      toast({
        title: "Error",
        description: "Please provide a caption and image for the post.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to post.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Add new post to Firestore
      const postRef = collection(firestore, "userPosts");
      await addDoc(postRef, {
        caption: newPost.caption,
        img: newPost.img,
        userId: user.uid, // Store the userId (uid) for reference
        username: userData.username || "Default Username", // Use fetched username or default
        profilePic: userData.profilePic || "/defaultProfilePic.png", // Use fetched profilePic or default
        createdAt: new Date(),
      });

      toast({
        title: "Post added",
        description: "Your post has been successfully added.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Add the new post to the current posts state to immediately reflect in UI
      setPosts((prevPosts) => [
        { caption: newPost.caption, img: newPost.img, username: userData.username, createdAt: new Date() },
        ...prevPosts,
      ]);

      // Clear form and close modal
      setNewPost({ caption: "", img: null });
      onClose();

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add the post. Please try again later.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false); // Ensure loading is set to false
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setNewPost((prevState) => ({ ...prevState, img: imageURL }));
    }
  };

  return (
    <>
      <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={6}>
        {isLoading ? (
          <>
            {[0, 1, 2, 3, 4, 5].map((_, idx) => (
              <VStack key={idx} alignItems={"flex-start"} gap={4}>
                <Skeleton w={"full"} height="300px" />
              </VStack>
            ))}
          </>
        ) : (
          <>
            {/* Display existing posts for the logged-in user, filtered by username */}
            {posts.length > 0 ? (
              posts.map((post, idx) => (
                <ProfilePost
                  key={idx}
                  img={post.img}
                  caption={post.caption}
                  username={post.username}
                  createdAt={post.createdAt}
                />
              ))
            ) : (
              <Box>No posts available</Box>
            )}

            {/* "+" Button for adding new post */}
            {user?.uid && ( // Only show the add post button if it's the logged-in user's profile
              <Flex
                alignItems="center"
                justifyContent="center"
                bg="gray.700"
                color="white"
                cursor="pointer"
                border="1px solid whiteAlpha.300"
                aspectRatio={1 / 1}
                onClick={onOpen}
              >
                <IconButton
                  icon={<FaPlus />}
                  aria-label="Add Post"
                  size="lg"
                  bg="transparent"
                  color="white"
                  _hover={{ bg: "gray.600" }}
                />
              </Flex>
            )}
          </>
        )}
      </Grid>

      {/* Modal for adding new post */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Post</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex flexDir="column" gap={4}>
              <Textarea
                placeholder="Write a caption..."
                value={newPost.caption}
                onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
              />
              <Input type="file" accept="image/*" onChange={handleFileChange} />
              {newPost.img && (
                <Box mt={4}>
                  <Image src={newPost.img} alt="New Post Preview" boxSize="200px" objectFit="cover" />
                </Box>
              )}
              <Button
                colorScheme="blue"
                onClick={handleAddPost}
                isDisabled={!newPost.img || !newPost.caption}
                mt={4}
              >
                Upload Post
              </Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfilePosts;
