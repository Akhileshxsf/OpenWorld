import { Box, Button, Flex, FormControl, FormLabel, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Tooltip, useDisclosure } from "@chakra-ui/react";
import useSearchUserByProfession from "../../hooks/useSearchUserByProfession";
import { useRef } from "react";
import SuggestedTimeSellers from "../SuggestedTimeSellers/SuggestedTimeSeller"

const Search = () => {

    const { isOpen, onOpen, onClose } = useDisclosure();
  const searchRef = useRef(null);
  const { userProfile, isLoading } = useSearchUserByProfession(searchRef.current?.value);
   
    const commonIconSize=25;

    const handleSearchUser = (e) => {
        e.preventDefault();
        // Trigger the search when the form is submitted
        onClose(); // Close the modal
      };

     
return (
<>
<Tooltip
hasArrow
label={"Search TimeSellers"}
placement='right'
ml={1}
openDelay={500}
display={{ base: "block", md: "none" }}
>
<Flex
alignItems={"center"}
gap={4}
_hover={{ bg: "whiteAlpha.400" }}
borderRadius={6}
p={2}
w={{ base: 10, md: "full" }}
justifyContent={{ base: "center", md: "flex-start" }}
onClick={onOpen}
>
 <img src="/search.png" alt="search"  style={{ width: commonIconSize, height: 'auto' }} />
<Box display={{ base: "none", md: "block" }}>Search</Box>
</Flex>
</Tooltip>
      
      <Modal
         isOpen={isOpen} onClose={onClose} motionPreset="slideInLeft" size='Xl'
       >

              <ModalOverlay />
              <ModalContent bg={"black"} border={"1px solid gray"} maxW={"400px"}>
                <ModalHeader>Search TimeSeller</ModalHeader>

                <ModalCloseButton />

                <ModalBody pb={6}>
                    <form onSubmit={handleSearchUser}>
                        <FormControl>

                        <FormLabel>Profession</FormLabel>
                        <Input placeholder="Search TimeSellers" ref={searchRef} />
                      


                        </FormControl>

                        <Flex w={"full"} justifyContent={"flex-end"}>
                           <Button type="submit" ml={"auto"} size={"sm"} my={4} isLoading={isLoading}>
                               search
                           </Button>

                        </Flex>

                    </form>

                    {userProfile && <SuggestedTimeSellers user={userProfile}/>}

                    {userProfile && (
              <Box mt={4}>
                <strong>Username:</strong> {userProfile.username}
                <br />
                <strong>Profession:</strong> {userProfile.profession}
                {/* Add any other user details you want to display */}
              </Box>
            )}     



</ModalBody>

</ModalContent>
</Modal>


</>
	);
 };

 export default Search;