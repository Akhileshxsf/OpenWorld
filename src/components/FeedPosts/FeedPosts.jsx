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
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Avatar,
  Tooltip,
  InputGroup,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { createClient, createMicrophoneAndCameraTracks } from "agora-rtc-sdk-ng";
import { AiOutlineLike, AiFillLike, AiOutlineComment, AiOutlineSend } from "react-icons/ai";
import { motion } from "framer-motion";

const FeedPosts = () => {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [localTracks, setLocalTracks] = useState({ videoTrack: null, audioTrack: null });
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [client, setClient] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState("");

  const toast = useToast();
  const navigate = useNavigate();

  const APP_ID = "220bae3c751d4e38be8d015cd72fa387"; // Replace with your Agora App ID
  const TOKEN = null; // Replace with a token if needed

  const currentUser = auth.currentUser;
  const currentUserId = currentUser ? currentUser.uid : null;

  // Fetch posts and user data from Firestore
  useEffect(() => {
    const fetchPostsAndUsers = async () => {
      try {
        const postsSnapshot = await getDocs(collection(firestore, "posts"));
        if (postsSnapshot.empty) {
          setError("No posts available.");
          return;
        }

        const fetchedPosts = postsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        const usersSnapshot = await getDocs(collection(firestore, "users"));
        const usersData = usersSnapshot.docs.reduce((acc, doc) => {
          acc[doc.id] = doc.data();
          return acc;
        }, {});

        setPosts(fetchedPosts.filter((post) => post.caption || post.imageURL));
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setError("Failed to load posts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostsAndUsers();
  }, []);

  const navigateToProfile = (username) => {
    navigate(`/${username}`);
  };

  // Handle like functionality
  const handleLike = async (postId) => {
    if (!currentUserId) return;

    try {
      const postRef = doc(firestore, "posts", postId);
      const postDoc = await getDoc(postRef);
      const postData = postDoc.data();

      const likedBy = postData.likedBy || [];
      const isLiked = likedBy.includes(currentUserId);

      if (isLiked) {
        // Unlike the post
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: arrayRemove(currentUserId),
        });
      } else {
        // Like the post
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

  const openCommentsModal = (post) => {
    setSelectedPost(post);
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

      const postRef = doc(firestore, "posts", selectedPost.id);
      await updateDoc(postRef, {
        comments: arrayUnion(commentData),
      });

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === selectedPost.id
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

  // Agora initialization and call management
  const initializeAgora = async (channel) => {
    try {
      if (!channel) {
        toast({
          title: "Please enter a channel name.",
          status: "warning",
          duration: 2000,
        });
        return;
      }

      const agoraClient = createClient({ mode: "rtc", codec: "vp8" });
      const [microphoneTrack, cameraTrack] = await createMicrophoneAndCameraTracks();

      setClient(agoraClient);
      setLocalTracks({ audioTrack: microphoneTrack, videoTrack: cameraTrack });

      await agoraClient.join(APP_ID, channel, TOKEN, null);
      await agoraClient.publish([microphoneTrack, cameraTrack]);

      // Play local video in the top container
      cameraTrack.play("local-video");

      agoraClient.on("user-published", async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);

        if (mediaType === "video") {
          const playerContainer = document.createElement("div");
          playerContainer.id = `remote-video-${user.uid}`;
          playerContainer.style.width = "100%";
          playerContainer.style.height = "300px";
          playerContainer.style.background = "black";
          document.getElementById("remote-users").append(playerContainer);

          if (user.videoTrack) {
            user.videoTrack.play(`remote-video-${user.uid}`);
          }
        }

        if (mediaType === "audio") {
          user.audioTrack.play();
        }

        setRemoteUsers((prev) => [...prev, user]);
      });

      agoraClient.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "video") {
          const playerContainer = document.getElementById(`remote-video-${user.uid}`);
          if (playerContainer) {
            playerContainer.remove();
          }
        }
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      setIsInCall(true);
      toast({
        title: `Joined channel Go to top post : ${channel}`,
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error initializing Agora:", error);
      toast({
        title: "Failed to join the call.",
        status: "error",
        duration: 2000,
      });
    }
  };

  const toggleAudio = () => {
    if (localTracks.audioTrack) {
      isAudioEnabled ? localTracks.audioTrack.setEnabled(false) : localTracks.audioTrack.setEnabled(true);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localTracks.videoTrack) {
      isVideoEnabled ? localTracks.videoTrack.setEnabled(false) : localTracks.videoTrack.setEnabled(true);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const shareScreen = async () => {
    try {
      const screenTrack = await AgoraRTC.createScreenVideoTrack();
      await client.publish(screenTrack);
      screenTrack.play("local-video");
    } catch (error) {
      console.error("Error sharing screen:", error);
    }
  };

  const endCall = async () => {
    try {
      Object.values(localTracks).forEach((track) => track.stop() && track.close());
      if (client) {
        await client.leave();
      }
      setClient(null);
      setLocalTracks({ videoTrack: null, audioTrack: null });
      setRemoteUsers([]);
      setIsInCall(false);
      toast({
        title: "Call ended.",
        status: "info",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error ending call:", error);
    }
  };

  const handleBuyTime = (channel) => {
    setChannelName(channel);
    initializeAgora(channel);
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" color="red.500">
        <Text>{error}</Text>
      </Box>
    );
  }

  return (
    <Box maxW="800px" mx="auto" mt={6} p={4}>
      {/* Top container for local video */}
      {isInCall && (
        <Box id="local-video-container" position="absolute" top="10px" left="10px" zIndex="10" width="200px" height="150px">
          <Box id="local-video" style={{ width: "100%", height: "100%", backgroundColor: "black" }}></Box>
        </Box>
      )}

      {posts.length === 0 ? (
        <Text>No posts available.</Text>
      ) : (
        posts.map((post) => {
          const userProfile = users[post.createdBy] || { username: "Unknown User", profession: "N/A" };
          const isLiked = post.likedBy?.includes(currentUserId);

          return (
            <Flex
              key={post.id}
              direction="column"
              bg="gray.800"
              p={6}
              borderRadius={10}
              mb={6}
              shadow="lg"
              border="1px solid #333"
            >
              <HStack spacing={4} mb={4}>
                {userProfile.profilePicURL && (
                  <Avatar
                    src={userProfile.profilePicURL}
                    alt={`${userProfile.username} profile`}
                    size="md"
                    cursor="pointer"
                    onClick={() => navigateToProfile(userProfile.username)}
                  />
                )}
                <VStack align="start">
                  <Text fontWeight="bold" color="white">
                    {userProfile.username}
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    {userProfile.profession}
                  </Text>
                </VStack>
              </HStack>

              {post.caption && (
                <Text color="white" fontSize="xl" fontWeight="bold" mb={4}>
                  {post.caption}
                </Text>
              )}

              {post.imageURL ? (
                <Image
                  src={post.imageURL}
                  alt="Post image"
                  borderRadius="md"
                  mb={4}
                  maxH="400px"
                  objectFit="cover"
                  width="100%"
                />
              ) : (
                <Text color="gray.300" fontSize="lg">
                  No image available.
                </Text>
              )}

              <HStack justify="space-between" align="center">
                <Button
                  onClick={() => handleLike(post.id)}
                  colorScheme="teal"
                  variant="ghost"
                  leftIcon={isLiked ? <AiFillLike /> : <AiOutlineLike />}
                >
                  {post.likes ? `${post.likes} Likes` : "Like"}
                </Button>

                <Button colorScheme="blue" onClick={() => openCommentsModal(post)} leftIcon={<AiOutlineComment />}>
                  Comments
                </Button>
              </HStack>

              {/* Display users who liked the post */}
              {post.likedBy?.length > 0 && (
                <Box mt={2}>
                  <Text fontSize="sm" color="gray.400">
                    Liked by:
                  </Text>
                  <HStack spacing={2} mt={1}>
                    {post.likedBy.map((uid) => (
                      <Tooltip key={uid} label={users[uid]?.username || "Unknown User"}>
                        <Avatar
                          src={users[uid]?.profilePicURL}
                          size="xs"
                          cursor="pointer"
                          onClick={() => navigateToProfile(users[uid]?.username)}
                        />
                      </Tooltip>
                    ))}
                  </HStack>
                </Box>
              )}

              {/* Comments Modal */}
              {selectedPost && (
                <Modal isOpen={!!selectedPost} onClose={() => setSelectedPost(null)} size="md" isCentered>
                  <ModalOverlay />
                  <ModalContent bg="gray.800" color="white">
                    <ModalHeader>Comments</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody maxH="60vh" overflowY="auto">
                      <VStack spacing={3} align="stretch">
                        {selectedPost.comments?.length ? (
                          selectedPost.comments.map((comment, index) => (
                            <Box key={index} bg="gray.700" p={3} borderRadius={5}>
                              <HStack align="center" spacing={3}>
                                <Avatar
                                  src={comment.profilePicURL}
                                  alt={`${comment.username} profile`}
                                  size="sm"
                                  cursor="pointer"
                                  onClick={() => navigateToProfile(comment.username)}
                                />
                                <VStack align="start" spacing={1}>
                                  <Text fontWeight="bold" color="white">
                                    {comment.username}
                                  </Text>
                                  <Text fontSize="sm" color="gray.400">
                                    {comment.profession}
                                  </Text>
                                </VStack>
                              </HStack>
                              <Text color="white" mt={2}>
                                {comment.text}
                              </Text>
                            </Box>
                          ))
                        ) : (
                          <Text>No comments yet.</Text>
                        )}
                      </VStack>
                    </ModalBody>
                    <ModalFooter>
                      <InputGroup>
                        <Input
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          bg="gray.700"
                          color="white"
                          border="none"
                          _focus={{ border: "none" }}
                        />
                        <InputRightElement>
                          <IconButton
                            aria-label="Send comment"
                            icon={<AiOutlineSend />}
                            colorScheme="green"
                            onClick={addComment}
                          />
                        </InputRightElement>
                      </InputGroup>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
              )}

              <HStack mt={4} justify="space-between">
                <Input
                  placeholder="Enter Channel Name"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  maxW="200px"
                />
                {!isInCall ? (
                  <Button colorScheme="yellow" size="sm" onClick={() => handleBuyTime(channelName)}>
                    Buy Time
                  </Button>
                ) : (
                  <Button colorScheme="red" size="sm" onClick={endCall}>
                    End Call
                  </Button>
                )}
              </HStack>

              {isInCall && (
                <Flex mt={4} direction="column" gap={4}>
                  <Box id="remote-users" width="100%" mt={4}></Box>
                  <HStack mt={4}>
                    <Button onClick={toggleAudio} colorScheme={isAudioEnabled ? "blue" : "gray"}>
                      {isAudioEnabled ? "Mute Audio" : "Unmute Audio"}
                    </Button>
                    <Button onClick={toggleVideo} colorScheme={isVideoEnabled ? "blue" : "gray"}>
                      {isVideoEnabled ? "Turn Off Video" : "Turn On Video"}
                    </Button>
                    <Button onClick={shareScreen} colorScheme="yellow">
                      Share Screen
                    </Button>
                  </HStack>
                </Flex>
              )}
            </Flex>
          );
        })
      )}
    </Box>
  );
};

export default FeedPosts;