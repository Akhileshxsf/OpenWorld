
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flex,
  VStack,
  Text,
  Input,
  Button,
  useToast,
  Image,
} from "@chakra-ui/react";
import { firestore } from "../../firebase/firebase"; // Adjust path if needed
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// Simple UUID generator for all users
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const Offer = () => {
  const [offerData, setOfferData] = useState({
    contact: "",
    description: "",
    name: "",
    offerType: "",
    price: "",
    postId: "",
  });
  const toast = useToast();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOfferData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const { contact, description, name, offerType, price, postId } = offerData;
    if (!contact.trim() || !description.trim() || !name.trim() || !offerType.trim() || !price) {
      toast({
        title: "Invalid Input",
        description: "Please fill all required fields.",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

    try {
      const userId = generateUUID();
      const offerId = `offer_${Date.now()}_${userId}`;
      const offerRef = doc(firestore, "offers", offerId);
      const offerPayload = {
        contact: contact,
        description: description,
        name: name,
        offerType: offerType,
        price: Number(price),
        timestamp: serverTimestamp(),
        userId: userId,
        postId: postId || null,
      };
      console.log("Submitting offer:", offerPayload);
      await setDoc(offerRef, offerPayload);

      toast({
        title: "Offer Submitted",
        description: "Your offer has been posted to the NIT Delhi community!",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      setOfferData({ contact: "", description: "", name: "", offerType: "", price: "", postId: "" });
    } catch (error) {
      console.error("Error submitting offer:", error);
      toast({
        title: "Error",
        description: "Failed to submit offer. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    }
  };

  return (
    <Flex
      direction="column"
      minH="100vh"
      w="100vw"
      bg="#000"
      p={{ base: 4, md: 8 }}
      align="center"
      justify="center"
    >
      {/* Logo */}
      <Image
        src="/openworld2022.jpeg"
        alt="TradeTime Logo"
        position="absolute"
        top={4}
        left={4}
        boxSize={{ base: "60px", md: "70px" }}
        objectFit="contain"
        borderRadius="full"
        zIndex={10}
      />

      {/* Back Button */}
      <Button
        position="absolute"
        top={4}
        right={4}
        bg="rgba(255,255,255,0.1)"
        color="white"
        borderRadius="full"
        px={6}
        _hover={{ bg: "rgba(255,255,255,0.2)" }}
        onClick={() => {
          console.log("Navigating back to /");
          navigate("/");
        }}
      >
        Back to Chat
      </Button>

      {/* Form Container */}
      <VStack
        spacing={4}
        w={{ base: "90%", md: "500px" }}
        bg="rgba(255,255,255,0.03)"
        borderRadius="xl"
        border="1px solid rgba(255,255,255,0.15)"
        p={6}
      >
        <Text
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="bold"
          color="white"
          fontFamily="'Orbitron', sans-serif"
        >
          Create a Trade Offer
        </Text>
        <Input
          placeholder="Contact (e.g., email or phone)"
          name="contact"
          value={offerData.contact}
          onChange={handleInputChange}
          bg="rgba(255,255,255,0.05)"
          border="1px solid rgba(255,255,255,0.2)"
          color="white"
          _focus={{ borderColor: "cyan.300" }}
          _placeholder={{ color: "rgba(255,255,255,0.5)" }}
        />
        <Input
          placeholder="Description (e.g., Brand new Maggi packet)"
          name="description"
          value={offerData.description}
          onChange={handleInputChange}
          bg="rgba(255,255,255,0.05)"
          border="1px solid rgba(255,255,255,0.2)"
          color="white"
          _focus={{ borderColor: "cyan.300" }}
          _placeholder={{ color: "rgba(255,255,255,0.5)" }}
        />
        <Input
          placeholder="Offer name (e.g., Maggi packet)"
          name="name"
          value={offerData.name}
          onChange={handleInputChange}
          bg="rgba(255,255,255,0.05)"
          border="1px solid rgba(255,255,255,0.2)"
          color="white"
          _focus={{ borderColor: "cyan.300" }}
          _placeholder={{ color: "rgba(255,255,255,0.5)" }}
        />
        <Input
          placeholder="Offer type (e.g., Item, Service, Food)"
          name="offerType"
          value={offerData.offerType}
          onChange={handleInputChange}
          bg="rgba(255,255,255,0.05)"
          border="1px solid rgba(255,255,255,0.2)"
          color="white"
          _focus={{ borderColor: "cyan.300" }}
          _placeholder={{ color: "rgba(255,255,255,0.5)" }}
        />
        <Input
          placeholder="Price (e.g., 10)"
          name="price"
          type="number"
          value={offerData.price}
          onChange={handleInputChange}
          bg="rgba(255,255,255,0.05)"
          border="1px solid rgba(255,255,255,0.2)"
          color="white"
          _focus={{ borderColor: "cyan.300" }}
          _placeholder={{ color: "rgba(255,255,255,0.5)" }}
        />
        <Input
          placeholder="Post ID (optional, e.g., 0nJq1QMJ7eIrFf3O5Vmb)"
          name="postId"
          value={offerData.postId}
          onChange={handleInputChange}
          bg="rgba(255,255,255,0.05)"
          border="1px solid rgba(255,255,255,0.2)"
          color="white"
          _focus={{ borderColor: "cyan.300" }}
          _placeholder={{ color: "rgba(255,255,255,0.5)" }}
        />
        <Button
          onClick={handleSubmit}
          bg="linear-gradient(45deg, #00B7D4, #00E4FF)"
          color="white"
          borderRadius="full"
          _hover={{
            bg: "linear-gradient(45deg, #00E4FF, #00B7D4)",
            boxShadow: "0 0 15px rgba(0, 183, 212, 0.6)",
          }}
          w="full"
        >
          Submit Offer
        </Button>
      </VStack>
    </Flex>
  );
};

export default Offer;