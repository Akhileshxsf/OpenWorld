import {
  Container,
  Flex,
  Box,
  Input,
  Button,
  IconButton,
  useToast,
  VStack,
  Text,
  Tag,
  TagLabel,
} from "@chakra-ui/react";
import { SearchIcon, ChatIcon } from "@chakra-ui/icons";
import FeedPosts from "../../components/FeedPosts/FeedPosts";
import SuggestedTimeSellers from "../../components/SuggestedTimeSellers/SuggestedTimeSellers";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";
import { firestore, auth } from "../../firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

// Motion components
const MotionBox = motion(Box);
const MotionButton = motion(Button);
const MotionIconButton = motion(IconButton);

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [allPosts, setAllPosts] = useState([]);
  const [displayPosts, setDisplayPosts] = useState([]);
  const [authUser, loading] = useAuthState(auth);
  const [selectedTag, setSelectedTag] = useState(null); // New state for selected tag
  const [uniqueTags, setUniqueTags] = useState([]); // New state for unique tags
  const navigate = useNavigate();
  const toast = useToast();

  // Placeholder options
  const placeholders = [
    "Need help to build a startup",
    "Need food",
    "Need help in technical coding round",
    "Need fullstack development course",
    "Need anything from bakoli in 10min",
  ];

  // Cycle through placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prevIndex) => (prevIndex + 1) % placeholders.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  // Fetch posts and extract unique tags
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsSnapshot = await getDocs(collection(firestore, "posts"));
        const fetchedPosts = postsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setAllPosts(fetchedPosts);
        setDisplayPosts(fetchedPosts);

        // Extract unique tags from posts
        const tags = new Set();
        fetchedPosts.forEach((post) => {
          if (post.tags && Array.isArray(post.tags)) {
            post.tags.forEach((tag) => tags.add(tag.toLowerCase()));
          }
        });
        setUniqueTags([...tags]);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };
    if (authUser) fetchPosts();
  }, [authUser]);

  // Search logic
  const handleSearch = () => {
    setSelectedTag(null); // Clear selected tag when searching
    if (!searchQuery.trim()) {
      setDisplayPosts(allPosts);
      toast({
        title: "Type something.",
        description: "Click on Messages to Trade Time.",
        status: "info",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    const queryWords = searchQuery.toLowerCase().split(" ");
    const reorderedPosts = [...allPosts].sort((a, b) => {
      const aTags = (a.tags || []).join(" ").toLowerCase();
      const bTags = (b.tags || []).join(" ").toLowerCase();

      const aMatch = queryWords.some((word) => aTags.includes(word));
      const bMatch = queryWords.some((word) => bTags.includes(word));

      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });

    setDisplayPosts(reorderedPosts);
    toast({
      title: "Search Applied",
      description: `Showing results for "${searchQuery}"`,
      status: "info",
      duration: 2000,
      isClosable: true,
      position: "top",
    });
  };

  // Filter posts by tag
  const handleTagClick = (tag) => {
    setSearchQuery(""); // Clear search query when a tag is clicked
    if (selectedTag === tag) {
      setSelectedTag(null); // Deselect tag to show all posts
      setDisplayPosts(allPosts);
      toast({
        title: "Filter Removed",
        description: "Showing all posts.",
        status: "info",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
    } else {
      setSelectedTag(tag);
      const filteredPosts = allPosts.filter((post) =>
        (post.tags || []).some((postTag) => postTag.toLowerCase() === tag.toLowerCase())
      );
      setDisplayPosts(filteredPosts);
      toast({
        title: "Tag Filter Applied",
        description: `Showing posts with tag "${tag}"`,
        status: "info",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
    }
  };

  // Animation variants
  const searchBarVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.12, 1],
      boxShadow: [
        "0 0 10px rgba(30, 144, 255, 0.4)",
        "0 0 20px rgba(75, 158, 255, 0.6)",
        "0 0 10px rgba(30, 144, 255, 0.4)",
      ],
      transition: {
        duration: 1.4,
        ease: "easeInOut",
        repeat: Infinity,
      },
    },
  };

  if (loading) {
    return <Text color="white" textAlign="center">Loading...</Text>;
  }

  if (!authUser) {
    return <Text color="white" textAlign="center">Please log in to view the homepage.</Text>;
  }

  return (
    <Container maxW="container.lg" py={{ base: 4, md: 8 }} px={{ base: 2, md: 4 }}>
      <MotionBox
        initial="hidden"
        animate="visible"
        variants={searchBarVariants}
        mb={{ base: 6, md: 10 }}
      >
        <Flex alignItems="center" gap={{ base: 2, md: 4 }}>
          <MotionIconButton
            icon={<ChatIcon />}
            aria-label="Messages"
            size={{ base: "md", md: "lg" }}
            borderRadius="full"
            bg="linear-gradient(45deg, #1E90FF, #4B9EFF)"
            color="white"
            boxShadow="0 0 15px rgba(75, 158, 255, 0.6)"
            _hover={{
              bg: "linear-gradient(45deg, #4B9EFF, #87CEEB)",
              boxShadow: "0 0 25px rgba(75, 158, 255, 0.8)",
            }}
            _active={{ bg: "#1E90FF" }}
            transition="all 0.3s"
            variants={pulseVariants}
            animate="pulse"
            onClick={() => navigate("/chat/defaultUserId")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          />
          <Flex
            flex={1}
            bg="rgba(10, 26, 61, 0.85)"
            backdropFilter="blur(10px)"
            borderRadius="full"
            p={1}
            boxShadow="0 0 12px rgba(30, 144, 255, 0.4)"
            _focusWithin={{ boxShadow: "0 0 18px rgba(75, 158, 255, 0.6)" }}
          >
            <Input
              placeholder={placeholders[placeholderIndex]}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              border="none"
              bg="transparent"
              color="white"
              _placeholder={{ color: "#87CEEB", fontStyle: "italic", opacity: 0.7 }}
              _focus={{ boxShadow: "none" }}
              fontSize={{ base: "sm", md: "md" }}
              transition="all 0.5s ease"
              px={4}
              height={{ base: "40px", md: "48px" }}
            />
            <MotionButton
              onClick={handleSearch}
              bg="linear-gradient(45deg, #1E90FF, #4B9EFF)"
              color="white"
              borderRadius="full"
              px={{ base: 4, md: 6 }}
              boxShadow="0 0 10px rgba(30, 144, 255, 0.4)"
              _hover={{
                bg: "linear-gradient(45deg, #4B9EFF, #87CEEB)",
                boxShadow: "0 0 15px rgba(75, 158, 255, 0.6)",
              }}
              _active={{ bg: "#1E90FF" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              height={{ base: "40px", md: "48px" }}
            >
              <SearchIcon />
            </MotionButton>
          </Flex>
        </Flex>

        {/* Topic Tags */}
        <Flex
          wrap="wrap"
          gap={2}
          mt={4}
          justifyContent={{ base: "center", md: "flex-start" }}
        >
          {uniqueTags.map((tag) => (
            <Tag
              key={tag}
              size="lg"
              borderRadius="full"
              variant={selectedTag === tag ? "solid" : "outline"}
              colorScheme={selectedTag === tag ? "blue" : "gray"}
              cursor="pointer"
              _hover={{ bg: "blue.500", color: "white" }}
              onClick={() => handleTagClick(tag)}
            >
              <TagLabel>{tag.charAt(0).toUpperCase() + tag.slice(1)}</TagLabel>
            </Tag>
          ))}
        </Flex>
      </MotionBox>

      <Flex gap={{ base: 6, md: 10 }} direction={{ base: "column", lg: "row" }}>
        <MotionBox
          flex={2}
          py={{ base: 4, md: 10 }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <VStack spacing={4} align="stretch">
            <FeedPosts posts={displayPosts} />
          </VStack>
        </MotionBox>
        <MotionBox
          flex={1}
          maxW={{ lg: "300px" }}
          display={{ base: "none", lg: "block" }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <VStack spacing={4} align="stretch">
            <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="gray.200"></Text>
            <SuggestedTimeSellers />
          </VStack>
        </MotionBox>
      </Flex>
    </Container>
  );
};

export default HomePage;