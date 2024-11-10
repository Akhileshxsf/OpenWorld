import { Avatar,Button, Flex, VStack,Box ,Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Stack, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import useBuyTimeModal from "../../hooks/useBuyTimeModal";
const SuggestedTimeSeller = ({ user }) => {
  const [isBuyTime, setIsBuyTime] = useState(false);
  const { isOpen, onOpen, onClose, isConnecting, handleBuyTimeClick } = useBuyTimeModal();
  const [selectedOption, setSelectedOption] = useState(null);
  const [price, setPrice] = useState(0);
  useEffect(() => {
    console.log("User in SuggestedTimeSeller:", user);
    
    let timer;

    // Check if isBuyTime is true
    if (isBuyTime) {
      // Simulate a delay of 2 seconds (adjust as needed)
      timer = setTimeout(() => {
        // After the delay, set isBuyTime back to false
        setIsBuyTime(false);
        setSelectedOption(null);
        setPrice(0);
      }, 2000);
    }

    // Cleanup the timer on component unmount or when isBuyTime changes
    return () => clearTimeout(timer);
  }, [isBuyTime], [user]);

  const handleOptionClick = (option) => {
    // Set the price based on the selected option
    if (option === "audioCall") {
      setPrice(5);
    } else if (option === "videoCall") {
      setPrice(10);
    } else {
      setPrice(0);
    }
  };


  return (
  <Flex justifyContent={"space-between"} alignItems={"center"} w={"full"}>
     <Flex alignItems={"center"} gap={2}>
     <VStack spacing={2} alignItems={"flex-start"}>
     <Avatar src={user?.profilePicURL || ""} size={"md"} />
<Box fontSize={12} fontWeight={"bold"}>
   {user?.profession || "No Profession"}
</Box>
<Box fontSize={11} color={"gray.500"}>
   {user?.soldInstances?.length || 0} soldInstances
</Box>
<Box fontSize={10} fontWeight={"bold"}>
   {user?.Rating?.length || 0} Rating
</Box>

         </VStack>
     </Flex>

     <Button
        fontSize={13}
        bg={"transparent"}
        p={0}
        h={"max-content"}
        fontWeight={"medium"}
        color={"blue.400"}
        cursor={"pointer"}
        _hover={{color:"gold"}}
        onClick={handleBuyTimeClick}
     >
           {isBuyTime ? "Connecting.." : "BuyTime"}
     </Button>
     {/* Render the modal based on isOpen state */}
     <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Buy Time Modal</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/* Your modal content goes here */}
            {isConnecting ? (
              <p>Connecting...</p>
            ) : (
              <>
                <Stack spacing={4}>
                  <Button
                    onClick={() => {
                      setSelectedOption("audioCall");
                      handleOptionClick("audioCall");
                    }}
                    colorScheme={selectedOption === "audioCall" ? "blue" : ""}
                  >
                    Audio Call - Rs5
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedOption("videoCall");
                      handleOptionClick("videoCall");
                    }}
                    colorScheme={selectedOption === "videoCall" ? "blue" : ""}
                  >
                    Video Call - RS10
                  </Button>
                  
                </Stack>
                {selectedOption && (
                  <Text mt={4}>
                    Confirming {selectedOption} for Rs{price}.
                  </Text>
                )}
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
            {selectedOption && (
              <Button colorScheme="green" onClick={() => handleOptionClick(selectedOption)}>
                Confirm
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default SuggestedTimeSeller;