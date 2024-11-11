import { Box, Text, Image, Flex } from "@chakra-ui/react";

const FeedPost = ({ img, username, avatar, altText }) => {
  return (
    <Box mb={6}>
      <Flex alignItems="center" gap={4}>
        <Image src={avatar} alt="Avatar" boxSize="40px" borderRadius="full" />
        <Text fontWeight="bold">{username}</Text>
      </Flex>
      <Image src={img} alt={altText} my={4} />
      <Text>{altText}</Text>
    </Box>
  );
};

export default FeedPost;
