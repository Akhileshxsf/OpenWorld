import { Container, Flex, Box, Input, Button, IconButton, useToast } from "@chakra-ui/react";
import { SearchIcon, ChatIcon } from "@chakra-ui/icons";
import FeedPosts from "../../components/FeedPosts/FeedPosts";
import SuggestedTimeSellers from "../../components/SuggestedTimeSellers/SuggestedTimeSellers";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  const handleSearch = () => {
    toast({
      title: "Developing...",
      description: "Click on Messages to Trade Time.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Container maxW={"container.lg"}>
      {/* Search Bar and Messages Button */}
      <Flex my={4} alignItems="center" gap={3}>
        <IconButton
          icon={<ChatIcon />}
          colorScheme="blue"
          aria-label="Messages"
          onClick={() => navigate("/chat/defaultUserId")}
        />
        <Flex flex={1}>
          <Input
            placeholder="Search for the person whose time you need (or message and ask)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} ml={2} colorScheme="blue">
            <SearchIcon />
          </Button>
        </Flex>
      </Flex>

      {/* Main Layout */}
      <Flex gap={10}>
        <Box flex={2} py={10}>
          <FeedPosts />
        </Box>
        <Box
          flex={3}
          mr={20}
          display={{ base: "none", lg: "block" }}
          maxW={"300px"}
        >
          <SuggestedTimeSellers />
        </Box>
      </Flex>
    </Container>
  );
};

export default HomePage;
