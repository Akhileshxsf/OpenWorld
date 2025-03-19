import { Box, Flex, Link, Tooltip, Button, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { BiLogOut } from "react-icons/bi";
import useLogout from '../../hooks/useLogout';
import Sidebaritems from './Sidebaritems';

const Sidebar = () => {
   const { handleLogout, isLoggingOut } = useLogout();
   const { isOpen, onOpen, onClose } = useDisclosure(); // Modal functionality

   return (
      <Box
         height={"100vh"}
         py={8}
         position={'sticky'}
         top={0}
         left={0}
         px={{ base: 2, md: 4 }}
      >

         <Flex direction={'column'} height={'100%'} justifyContent={'space-between'}>
            <Flex direction={'column'} gap={5} cursor={'pointer'}>
               <Link to={"/"} as={RouterLink} pl={2} display={{ base: "none", md: "block" }} cursor="pointer">
                  <img src="/Logo5678.jpeg" alt="OpenWorld Logo" style={{ width: '50px', height: 'auto' }} />
               </Link>
               <Link to={"/"} as={RouterLink} p={2} display={{ base: "block", md: "none" }} cursor="pointer"
                  borderRadius={6}
                  _hover={{
                     bg: "whiteAlpha.200"
                  }}
                  w={10}>
                  <img src="/Logo5678.jpeg" alt="OpenWorld Logo" style={{ width: '50px', height: 'auto' }} />
               </Link>

               <Sidebaritems />
            </Flex>

            {/* Add Mode Button */}
            <Flex justify="center" mt={4}>
               <Button
                  onClick={onOpen} // Opens the Modal
                  variant="outline"
                  colorScheme="teal"
                  size="lg"
                  w="full"
                  border="1px solid"
                  borderColor="teal.400"
                  _hover={{
                     bg: "teal.400",
                     color: "white"
                  }}
               >
                  Mode
               </Button>
            </Flex>

            {/* Tooltip for Logout */}
            <Tooltip
               hasArrow
               label={"Logout"}
               placement="right"
               ml={1}
               openDelay={500}
               display={{ base: 'block', md: 'none' }}
            >
               <Flex
                  onClick={handleLogout}
                  alignItems={"center"}
                  gap={4}
                  _hover={{ bg: "whiteAlpha.400" }}
                  borderRadius={6}
                  p={2}
                  w={{ base: 10, md: "full" }}
                  justifyContent={{ base: "center", md: "flex-start" }}
               >
                  <BiLogOut size={25} />
                  <Button display={{ base: "none", md: "block" }}
                     variant={"ghost"}
                     _hover={{ bg: "transparent" }}
                     isLoading={isLoggingOut}
                  >
                     Logout
                  </Button>
               </Flex>
            </Tooltip>

         </Flex>

         {/* Modal for Mode Options */}
         <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent bg="black" color="white">
               <ModalHeader>Select Mode</ModalHeader>
               <ModalCloseButton />
               <ModalBody>
                  {/* Options for Mode */}
                  <Button
                     w="full"
                     mb={3}
                     colorScheme="teal"
                     variant="solid"
                     _hover={{ bg: "teal.600" }}
                  >
                     Buy/Sell Time
                  </Button>
                  <Button
                     w="full"
                     mb={3}
                     colorScheme="teal"
                     variant="solid"
                     _hover={{ bg: "teal.600" }}
                  >
                     Ask/Give Time
                  </Button>
                  <Button
                     w="full"
                     mb={3}
                     colorScheme="teal"
                     variant="solid"
                     _hover={{ bg: "teal.600" }}
                  >
                     Borrow Time
                  </Button>
               </ModalBody>
               <ModalFooter>
                  <Button colorScheme="red" onClick={onClose}>Close</Button>
               </ModalFooter>
            </ModalContent>
         </Modal>
      </Box>
   );
};

export default Sidebar;
