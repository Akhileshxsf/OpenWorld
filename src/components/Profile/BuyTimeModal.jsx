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
    Input,
  } from '@chakra-ui/react';
  import { useState } from 'react';
  
  const BuyTimeModal = ({ isOpen, onClose,  }) => {
    const [selectedOption, setSelectedOption] = useState(null);
    const [amount, setAmount] = useState('');
  
    const handlePayment = () => {
      // Add your payment API integration logic here
      console.log('Handle payment for:', selectedOption, 'Amount:', amount);
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
              <FormControl>
                <FormLabel>Select Call Type</FormLabel>
                <Button onClick={() => setSelectedOption('audio')}>Audio Call</Button>
                <Button onClick={() => setSelectedOption('video')}>Video Call</Button>
              </FormControl>
              <FormControl>
                <FormLabel>Enter Amount</FormLabel>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
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