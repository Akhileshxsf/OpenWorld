import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../../firebase/firebase"; // Adjust path if needed
import { Box, Text, Image, Flex, Button, Spinner, VStack, HStack } from "@chakra-ui/react";

const FeedPosts = () => {
  const [posts, setPosts] = useState([]); // State for posts
  const [users, setUsers] = useState({}); // State for user profiles
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  useEffect(() => {
    const fetchPostsAndUsers = async () => {
      try {
        // Fetching all documents from 'posts' collection
        const postsSnapshot = await getDocs(collection(firestore, "posts"));

        if (postsSnapshot.empty) {
          setError("No posts available.");
          return;
        }

        const fetchedPosts = postsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        setPosts(fetchedPosts); // Store posts

        // Get unique user IDs from posts to fetch their profiles
        const userIds = Array.from(new Set(fetchedPosts.map((post) => post.createdBy)));

        // Fetch users by their IDs from 'users' collection
        const userQuery = query(
          collection(firestore, "users"),
          where("uid", "in", userIds)
        );
        const usersSnapshot = await getDocs(userQuery);

        if (usersSnapshot.empty) {
          setError("No users found for the posts.");
          return;
        }

        // Create a map of user data by user ID
        const usersData = usersSnapshot.docs.reduce((acc, doc) => {
          acc[doc.id] = doc.data();
          return acc;
        }, {});

        setUsers(usersData); // Store users
      } catch (error) {
        setError("Failed to load posts");
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    fetchPostsAndUsers(); // Fetch posts and users on mount
  }, []);

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
      {posts.length === 0 ? (
        <Text>No posts available.</Text>
      ) : (
        posts.map((post) => {
          const userProfile = users[post.createdBy] || {}; // Get user profile for each post
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
              {/* Profile Section */}
              <HStack spacing={4} mb={4}>
                {userProfile.profilePicURL && (
                  <Image
                    src={userProfile.profilePicURL}
                    alt={`${userProfile.username} profile`}
                    borderRadius="full"
                    boxSize="60px"
                    objectFit="cover"
                  />
                )}
                <VStack align="start">
                  {userProfile.username && (
                    <Text fontWeight="bold" color="white">{userProfile.username}</Text>
                  )}
                  {userProfile.profession && (
                    <Text fontSize="sm" color="gray.400">
                      {userProfile.profession}
                    </Text>
                  )}
                </VStack>
              </HStack>

              {/* Post Content */}
              {post.caption && (
                <Text color="white" fontSize="xl" fontWeight="bold" mb={4}>
                  {post.caption}
                </Text>
              )}

              {/* Post Image */}
              {post.imageURL && (
                <Image
                  src={post.imageURL}
                  alt="Post image"
                  borderRadius="md"
                  mb={4}
                  maxH="400px"
                  objectFit="cover"
                  width="100%"
                />
              )}

              {/* Likes and Comments */}
              <HStack justify="space-between" align="center">
                <Text color="teal.300" fontWeight="bold">
                  {post.likes ? `${post.likes} Likes` : "No likes yet"}
                </Text>

                <Button colorScheme="teal" size="sm" onClick={() => alert("Buying time for this post.")}>
                  Buy Time
                </Button>
              </HStack>

              {/* Comments Section */}
              {post.comments && post.comments.length > 0 ? (
                <VStack align="start" mt={4}>
                  {post.comments.map((comment, index) => (
                    <Text key={index} fontSize="sm" color="gray.400">
                      {comment}
                    </Text>
                  ))}
                </VStack>
              ) : (
                <Text mt={3} color="gray.400">
                  No comments yet.
                </Text>
              )}
            </Flex>
          );
        })
      )}
    </Box>
  );
};

export default FeedPosts;
