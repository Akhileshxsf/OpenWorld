import React, { useState, useEffect } from "react";
import { Box, Flex, Input, Button, useToast } from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import FeedPosts from "./FeedPosts"; // Import FeedPosts to display posts
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../../firebase/firebase";

const SearchTime = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [allPosts, setAllPosts] = useState([]);
  const [displayPosts, setDisplayPosts] = useState([]);
  const toast = useToast();

  // Fetch all posts on mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsSnapshot = await getDocs(collection(firestore, "posts"));
        const fetchedPosts = postsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setAllPosts(fetchedPosts);
        setDisplayPosts(fetchedPosts); // Initially show all posts
      } catch (error) {
        console.error("Error fetching posts:", error);
        toast({
          title: "Error",
          description: "Failed to load posts",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };
    fetchPosts();
  }, [toast]);

  // Filter and reorder posts based on search query
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setDisplayPosts(allPosts); // Show all posts if query is empty
      return;
    }

    const queryWords = searchQuery.toLowerCase().split(" ");
    const reorderedPosts = [...allPosts].sort((a, b) => {
      const aTags = (a.tags || []).join(" ").toLowerCase();
      const bTags = (b.tags || []).join(" ").toLowerCase();

      // Check if any query word matches tags
      const aMatch = queryWords.some((word) => aTags.includes(word));
      const bMatch = queryWords.some((word) => bTags.includes(word));

      // Prioritize posts with matching tags at the top
      if (aMatch && !bMatch) return -1; // a goes before b
      if (!aMatch && bMatch) return 1; // b goes before a
      return 0; // No change in order if both match or neither match
    });

    setDisplayPosts(reorderedPosts); // Update displayed posts
    toast({
      title: "Search Applied",
      description: `Showing results for "${searchQuery}"`,
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box maxW="800px" mx="auto" mt={6} p={4}>
      <Flex mb={6} alignItems="center" gap={3}>
        <Input
          placeholder="Search by tags (e.g., food, fullstack course)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          bg="gray.700"
          color="white"
          border="none"
          _focus={{ boxShadow: "none" }}
        />
        <Button
          onClick={handleSearch}
          colorScheme="blue"
          leftIcon={<SearchIcon />}
        >
          Search
        </Button>
      </Flex>
      <FeedPosts posts={displayPosts} /> {/* Pass reordered posts */}
    </Box>
  );
};

export default SearchTime;