import { Flex,Box, Avatar } from "@chakra-ui/react";
import { useState } from "react";
const PostHeader = ({username,avatar}) => {
    // State to track if BuyTime button is clicked
  const [isConnecting, setIsConnecting] = useState(false);

  // Function to handle BuyTime button click
  const handleBuyTimeClick = () => {
    // Set the state to true to indicate connecting
    setIsConnecting(true);

    // Simulate an asynchronous process (e.g., API call) with setTimeout
    setTimeout(() => {
      // Set the state back to false after the process is completed
      setIsConnecting(false);
    }, 2000); // Adjust the time according to your needs
  };
  
  return (
  <Flex justifyContent={"space-between"} alignItems={"center"} w={"full"} my={2}>
   
   <Flex alignItems={"center"} gap={2}>
    <Avatar src={avatar}alt="user profile pic" size={"sm"}/>
    <Flex fontSize={12} fontWeight={"bold"} gap="2">
      {username}
       <Box color={"gray.500"}>.4.0</Box>
    </Flex>
   </Flex>
   <Box
   cursor={"pointer"}
   >
     {/* Render different content based on the state */}
     {isConnecting ? (
          <Box fontSize={12} color="blue.500" fontWeight="bold">
            Connecting...
          </Box>
        ) : (
          <Box
            as="div"
            fontSize={12}
            color="blue.500"
            fontWeight="bold"
            // Handle the BuyTime button click
            onClick={handleBuyTimeClick}
            _hover={{
              color: "gold",
              transition: "color 0.2s ease-in-out",
            }}
          >
            BuyTime
          </Box>
        )}
      </Box>

    </Flex>
  );
};
     


export default PostHeader;