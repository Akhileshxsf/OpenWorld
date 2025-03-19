import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Button,
  Stack,
  Box,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';

const BuyTimeModal = ({ isOpen, onClose }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [service, setService] = useState('');

  const fixedPrice = 100; // Fixed price for any service

  const handlePayment = () => {
    // Add your payment API integration logic here
    console.log('Handling payment for:', selectedOption, 'Service:', service, 'Amount:', fixedPrice);
    // You may want to close the modal after successful payment
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Buy Time</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            {/* Service Selection */}
            <FormControl>
              <FormLabel>Select Service Type</FormLabel>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  colorScheme="teal"
                  onClick={() => setService('Consultation')}
                  isFullWidth
                >
                  Consultation
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={() => setService('Training')}
                  isFullWidth
                >
                  Training
                </Button>
                <Button
                  colorScheme="purple"
                  onClick={() => setService('Mentorship')}
                  isFullWidth
                >
                  Mentorship
                </Button>
                <Button
                  colorScheme="orange"
                  onClick={() => setService('Task Completion')}
                  isFullWidth
                >
                  Task Completion
                </Button>
              </Box>
            </FormControl>

            {/* Call Type Selection */}
            <FormControl>
              <FormLabel>Select Call Type</FormLabel>
              <Box display="flex" gap={2}>
                <Button
                  colorScheme="green"
                  onClick={() => setSelectedOption('audio')}
                  isFullWidth
                >
                  Audio Call
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={() => setSelectedOption('video')}
                  isFullWidth
                >
                  Video Call
                </Button>
                <Button
                  colorScheme="yellow"
                  onClick={() => setSelectedOption('text')}
                  isFullWidth
                >
                  Text Chat
                </Button>
              </Box>
            </FormControl>

            {/* Display Fixed Price */}
            <FormControl>
              <FormLabel>Price</FormLabel>
              <Text fontSize="lg" fontWeight="bold" color="green.500">
                ₹{fixedPrice} (Fixed Price)
              </Text>
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Close
          </Button>
          <Button colorScheme="green" onClick={handlePayment}>
            Submit Payment
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BuyTimeModal;

