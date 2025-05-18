import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, increment, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { firestore, auth } from "../../firebase/firebase";
import {
  Box,
  Text,
  Image,
  Flex,
  Button,
  Spinner,
  VStack,
  HStack,
  Input,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  InputGroup,
  InputRightElement,
  IconButton,
  Avatar,
  Tooltip,
  Icon,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { AiOutlineLike, AiFillLike, AiOutlineComment, AiOutlineSend } from "react-icons/ai";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";
import ReactPlayer from "react-player";

// Motion components
const MotionBox = motion(Box);
const MotionButton = motion(Button);
const MotionText = motion(Text);

const FeedPosts = ({ posts: initialPosts }) => {
  const [posts, setPosts] = useState(initialPosts || []);
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPostIndex, setSelectedPostIndex] = useState(null);
  const [newComment, setNewComment] = useState("");

  const toast = useToast();
  const navigate = useNavigate();

  const currentUser = auth.currentUser;
  const currentUserId = currentUser ? currentUser.uid : null;

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(firestore, "users"));
        const usersData = usersSnapshot.docs.reduce((acc, doc) => {
          acc[doc.id] = doc.data();
          return acc;
        }, {});
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Update posts when prop changes
  useEffect(() => {
    setPosts(initialPosts || []);
  }, [initialPosts]);

  const navigateToProfile = (username) => {
    navigate(`/${username}`);
  };

  const handleLike = async (postId) => {
    if (!currentUserId) return;

    try {
      const postRef = doc(firestore, "posts", postId);
      const postDoc = await getDoc(postRef);
      const postData = postDoc.data();

      const likedBy = postData.likedBy || [];
      const isLiked = likedBy.includes(currentUserId);

      if (isLiked) {
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: arrayRemove(currentUserId),
        });
      } else {
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: arrayUnion(currentUserId),
        });
      }

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: isLiked ? post.likes - 1 : post.likes + 1,
                likedBy: isLiked
                  ? likedBy.filter((uid) => uid !== currentUserId)
                  : [...likedBy, currentUserId],
              }
            : post
        )
      );
    } catch (error) {
      console.error("Error liking post:", error);
      toast({
        title: "Error liking the post",
        status: "error",
        duration: 2000,
      });
    }
  };

  const openReelsModal = (index) => {
    setSelectedPostIndex(index);
  };

  const closeReelsModal = () => {
    setSelectedPostIndex(null);
  };

  const navigatePost = (direction) => {
    if (direction === "next" && selectedPostIndex < posts.length - 1) {
      setSelectedPostIndex(selectedPostIndex + 1);
    } else if (direction === "prev" && selectedPostIndex > 0) {
      setSelectedPostIndex(selectedPostIndex - 1);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !currentUserId) return;

    try {
      const userDoc = await getDoc(doc(firestore, "users", currentUserId));
      const userData = userDoc.data();

      const commentData = {
        text: newComment,
        uid: currentUserId,
        username: userData.username,
        profilePicURL: userData.profilePicURL,
        profession: userData.profession,
        timestamp: new Date().toISOString(),
      };

      const postRef = doc(firestore, "posts", posts[selectedPostIndex].id);
      await updateDoc(postRef, {
        comments: arrayUnion(commentData),
      });

      setPosts((prevPosts) =>
        prevPosts.map((post, index) =>
          index === selectedPostIndex
            ? { ...post, comments: [...(post.comments || []), commentData] }
            : post
        )
      );
      setNewComment("");

      toast({
        title: "Comment added!",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Failed to add comment",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleBuyTime = () => {
    toast({
      title: "Comment and Trade Time",
      status: "warning",
      duration: 2000,
    });
  };

  // Animation variants
  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 1.2,
        ease: "easeInOut",
        repeat: Infinity,
      },
    },
  };

  const captionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="100vh" bg="#000000">
        <Spinner size="xl" color="#1E90FF" thickness="4px" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" color="#FF4D4D" p={6} bg="#000000">
        <Text fontSize="2xl" fontWeight="bold">{error}</Text>
      </Box>
    );
  }

  return (
    <Box maxW="800px" mx="auto" mt={6} p={{ base: 4, md: 6 }} bg="#000000" minH="100vh">
      {posts.length === 0 ? (
        <Text color="#87CEEB" textAlign="center" fontSize="lg" fontWeight="medium">
          No posts available.
        </Text>
      ) : (
        posts.map((post, index) => {
          const userProfile = users[post.createdBy] || { username: "Unknown User", profession: "N/A" };
          const isLiked = post.likedBy?.includes(currentUserId);

          return (
            <MotionBox
              key={post.id}
              bg="#1A1A1A"
              p={6}
              borderRadius="xl"
              mb={8}
              shadow="lg"
              border="1px solid"
              borderColor="#1E90FF"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              _hover={{
                borderColor: "#87CEEB",
                boxShadow: "0 0 20px rgba(30, 144, 255, 0.5)",
                transform: "translateY(-5px)",
              }}
              cursor="pointer"
              onClick={() => openReelsModal(index)}
            >
              <HStack spacing={4} mb={4}>
                <Avatar
                  src={userProfile.profilePicURL}
                  alt={`${userProfile.username} profile`}
                  size="md"
                  cursor="pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToProfile(userProfile.username);
                  }}
                  border="2px solid"
                  borderColor="#1E90FF"
                  _hover={{ borderColor: "#87CEEB" }}
                  transition="all 0.3s"
                />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold" color="white" fontSize="lg">
                    {userProfile.username}
                  </Text>
                  <Text fontSize="sm" color="#87CEEB">
                    {userProfile.profession}
                  </Text>
                </VStack>
              </HStack>

              {post.caption && (
                <Text color="white" fontSize="xl" fontWeight="semibold" mb={4}>
                  {post.caption}
                </Text>
              )}

              {post.imageURL ? (
                <Image
                  src={post.imageURL}
                  alt="Post image"
                  borderRadius="lg"
                  mb={4}
                  maxH="400px"
                  objectFit="cover"
                  width="100%"
                  boxShadow="0 0 15px rgba(30, 144, 255, 0.3)"
                  transition="all 0.3s"
                  _hover={{ filter: "brightness(1.1)" }}
                />
              ) : post.videoURL ? (
                <Box mb={4} borderRadius="lg" overflow="hidden" boxShadow="0 0 15px rgba(30, 144, 255, 0.3)">
                  <ReactPlayer
                    url={post.videoURL}
                    controls
                    width="100%"
                    height="400px"
                    style={{ borderRadius: "lg" }}
                  />
                </Box>
              ) : (
                <Text color="#87CEEB" fontSize="lg" mb={4}>
                  No media available.
                </Text>
              )}

              <HStack justify="space-between" align="center" mb={4}>
                <MotionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(post.id);
                  }}
                  variant="ghost"
                  color="#1E90FF"
                  leftIcon={isLiked ? <AiFillLike /> : <AiOutlineLike />}
                  _hover={{ bg: "#1E90FF", color: "white" }}
                  size="sm"
                  whileHover={{ scale: 1.1 }}
                >
                  {post.likes ? `${post.likes} Likes` : "Like"}
                </MotionButton>

                <MotionButton
                  variant="ghost"
                  color="#1E90FF"
                  leftIcon={<AiOutlineComment />}
                  onClick={(e) => {
                    e.stopPropagation();
                    openReelsModal(index);
                  }}
                  _hover={{ bg: "#1E90FF", color: "white" }}
                  size="sm"
                  whileHover={{ scale: 1.1 }}
                >
                  Comments
                </MotionButton>
              </HStack>

              {post.likedBy?.length > 0 && (
                <Box mt={2} mb={4}>
                  <Text fontSize="sm" color="#87CEEB">
                    Liked by:
                  </Text>
                  <HStack spacing={2} mt={1}>
                    {post.likedBy.map((uid) => (
                      <Tooltip key={uid} label={users[uid]?.username || "Unknown User"} bg="#1E90FF" color="white">
                        <Avatar
                          src={users[uid]?.profilePicURL}
                          size="xs"
                          cursor="pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToProfile(users[uid]?.username);
                          }}
                          border="1px solid"
                          borderColor="#1E90FF"
                          _hover={{ borderColor: "#87CEEB" }}
                        />
                      </Tooltip>
                    ))}
                  </HStack>
                </Box>
              )}

              <HStack mt={4} justify="flex-end" align="center">
                <MotionButton
                  size="sm"
                  onClick={() => handleBuyTime()}
                  bg="#1E90FF"
                  color="white"
                  boxShadow="0 0 15px rgba(30, 144, 255, 0.5)"
                  _hover={{ bg: "#87CEEB", boxShadow: "0 0 20px rgba(135, 206, 235, 0.7)" }}
                  _active={{ bg: "#1E90FF" }}
                  borderRadius="full"
                  variants={pulseVariants}
                  animate="pulse"
                >
                  Buy Time
                </MotionButton>
              </HStack>
            </MotionBox>
          );
        })
      )}

      {selectedPostIndex !== null && (
        <Modal
          isOpen={selectedPostIndex !== null}
          onClose={closeReelsModal}
          size="full"
          motionPreset="none"
        >
          <ModalOverlay bg="#000000" />
          <ModalContent bg="#000000" m={0} boxShadow="none">
            <ModalCloseButton
              color="white"
              zIndex="1000"
              size="lg"
              bg="#1E90FF"
              borderRadius="full"
              _hover={{ bg: "#87CEEB" }}
            />
            <ModalBody p={0} display="flex" alignItems="center" justifyContent="center" overflow="hidden">
              <Flex direction="column" align="center" w="100%" maxW="900px" position="relative">
                {/* Navigation Arrows */}
                {selectedPostIndex > 0 && (
                  <MotionBox
                    position="absolute"
                    left={{ base: "15px", md: "30px" }}
                    top="50%"
                    transform="translateY(-50%)"
                    zIndex="10"
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                    cursor="pointer"
                    onClick={() => navigatePost("prev")}
                    bg="#1E90FF"
                    borderRadius="full"
                    p={3}
                    boxShadow="0 0 15px rgba(30, 144, 255, 0.5)"
                  >
                    <Icon as={FaArrowLeft} boxSize={6} color="white" />
                  </MotionBox>
                )}
                {selectedPostIndex < posts.length - 1 && (
                  <MotionBox
                    position="absolute"
                    right={{ base: "15px", md: "30px" }}
                    top="50%"
                    transform="translateY(-50%)"
                    zIndex="10"
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                    cursor="pointer"
                    onClick={() => navigatePost("next")}
                    bg="#1E90FF"
                    borderRadius="full"
                    p={3}
                    boxShadow="0 0 15px rgba(30, 144, 255, 0.5)"
                  >
                    <Icon as={FaArrowRight} boxSize={6} color="white" />
                  </MotionBox>
                )}

                {/* Post Content */}
                <MotionBox
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  w="100%"
                  position="relative"
                  overflow="hidden"
                  borderRadius="2xl"
                  boxShadow="0 0 30px rgba(30, 144, 255, 0.3)"
                  whileHover={{ scale: 1.02, rotateX: 2, rotateY: 2 }}
                >
                  {/* Neon Blue Overlay */}
                  <MotionBox
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bg="radial-gradient(circle, rgba(30,144,255,0.15) 0%, rgba(0,0,0,0) 70%)"
                    zIndex={1}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  />

                  {posts[selectedPostIndex].imageURL ? (
                    <Image
                      src={posts[selectedPostIndex].imageURL}
                      alt="Post image"
                      maxH="85vh"
                      w="100%"
                      objectFit="contain"
                      borderRadius="2xl"
                      zIndex={2}
                      position="relative"
                    />
                  ) : posts[selectedPostIndex].videoURL ? (
                    <Box borderRadius="2xl" overflow="hidden" zIndex={2} position="relative">
                      <ReactPlayer
                        url={posts[selectedPostIndex].videoURL}
                        controls
                        width="100%"
                        height="85vh"
                        style={{ maxHeight: "85vh", borderRadius: "2xl" }}
                      />
                    </Box>
                  ) : (
                    <Text color="white" fontSize="2xl" textAlign="center" zIndex={2} position="relative">
                      No media available.
                    </Text>
                  )}
                </MotionBox>

                {/* User Info and Caption */}
                <MotionBox
                  w="100%"
                  p={6}
                  bg="rgba(26, 26, 26, 0.9)"
                  borderTop="1px solid"
                  borderColor="#1E90FF"
                  initial="hidden"
                  animate="visible"
                  variants={captionVariants}
                  mt={4}
                  borderRadius="xl"
                >
                  <HStack spacing={4} mb={4}>
                    <Avatar
                      src={users[posts[selectedPostIndex].createdBy]?.profilePicURL}
                      size="lg"
                      cursor="pointer"
                      onClick={() => navigateToProfile(users[posts[selectedPostIndex].createdBy]?.username)}
                      border="3px solid"
                      borderColor="#1E90FF"
                      _hover={{ borderColor: "#87CEEB" }}
                    />
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold" color="white" fontSize="xl">
                        {users[posts[selectedPostIndex].createdBy]?.username || "Unknown User"}
                      </Text>
                      <Text fontSize="md" color="#87CEEB">
                        {users[posts[selectedPostIndex].createdBy]?.profession || "N/A"}
                      </Text>
                    </VStack>
                  </HStack>
                  {posts[selectedPostIndex].caption && (
                    <MotionText
                      color="white"
                      fontSize="lg"
                      mb={4}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                    >
                      {posts[selectedPostIndex].caption}
                    </MotionText>
                  )}

                  {/* Comments Section */}
                  <VStack align="stretch" mt={4} maxH="25vh" overflowY="auto" spacing={3}>
                    {posts[selectedPostIndex].comments?.length ? (
                      posts[selectedPostIndex].comments.map((comment, idx) => (
                        <MotionBox
                          key={idx}
                          bg="#2A2A2A"
                          p={3}
                          borderRadius="lg"
                          border="1px solid"
                          borderColor="#1E90FF"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1, duration: 0.5 }}
                        >
                          <HStack align="center" spacing={3}>
                            <Avatar
                              src={comment.profilePicURL}
                              alt={`${comment.username} profile`}
                              size="sm"
                              cursor="pointer"
                              onClick={() => navigateToProfile(comment.username)}
                              border="2px solid"
                              borderColor="#1E90FF"
                            />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold" color="white" fontSize="md">
                                {comment.username}
                              </Text>
                              <Text fontSize="xs" color="#87CEEB">
                                {comment.profession}
                              </Text>
                            </VStack>
                          </HStack>
                          <Text color="white" fontSize="md" mt={2}>
                            {comment.text}
                          </Text>
                        </MotionBox>
                      ))
                    ) : (
                      <Text color="#87CEEB" fontSize="md">
                        No comments yet.
                      </Text>
                    )}
                  </VStack>

                  {/* Comment Input */}
                  <InputGroup mt={4}>
                    <Input
                      id="comment-input"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      bg="#2A2A2A"
                      color="white"
                      border="1px solid"
                      borderColor="#1E90FF"
                      borderRadius="full"
                      _focus={{ borderColor: "#87CEEB", boxShadow: "0 0 10px rgba(30, 144, 255, 0.5)" }}
                    />
                    <InputRightElement>
                      <MotionButton
                        aria-label="Send comment"
                        bg="#1E90FF"
                        color="white"
                        borderRadius="full"
                        size="sm"
                        onClick={addComment}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <AiOutlineSend size={20} />
                      </MotionButton>
                    </InputRightElement>
                  </InputGroup>
                </MotionBox>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default FeedPosts;