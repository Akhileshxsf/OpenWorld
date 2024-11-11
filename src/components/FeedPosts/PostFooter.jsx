import { Box, Image, Text, Flex, InputGroup, Input, Button, InputRightElement } from "@chakra-ui/react";
import { useState } from "react";

const PostFooter = ({ username }) => {
  const [comment, setComment] = useState("");
  const handleCommentChange = (e) => setComment(e.target.value);
  
  const handleCommentSubmit = () => {
    if (comment.trim()) {
      console.log("Comment submitted:", comment);
      setComment("");
    }
  };

  return (
    <Box>
      <Flex alignItems="center">
        <Text fontWeight="bold" mr={2}>{username}</Text>
      </Flex>
      <InputGroup mt={4}>
        <Input 
          placeholder="Add a comment..."
          value={comment}
          onChange={handleCommentChange}
        />
        <InputRightElement width="4.5rem">
          <Button
            h="1.75rem"
            size="sm"
            onClick={handleCommentSubmit}
          >
            Comment
          </Button>
        </InputRightElement>
      </InputGroup>
    </Box>
  );
};

export default PostFooter;
