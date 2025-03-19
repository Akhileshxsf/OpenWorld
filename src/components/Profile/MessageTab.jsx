import { useState, useEffect, useRef } from "react";
import {
  Box, Input, Button, VStack, Text, Flex, Spinner, useToast, Avatar
} from "@chakra-ui/react";
import {
  collection, query, orderBy, addDoc, onSnapshot, serverTimestamp, doc, getDoc
} from "firebase/firestore";
import { firestore, auth } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";

const MessageTab = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const messagesEndRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    const messagesRef = collection(firestore, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const messagesData = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
        const message = { id: docSnap.id, ...docSnap.data() };

        // Ensure senderId exists before querying
        if (message.senderId) {
          try {
            const userDocRef = doc(firestore, "users", message.senderId);
            const userSnap = await getDoc(userDocRef);
            
            if (userSnap.exists()) {
              message.senderInfo = userSnap.data();
            } else {
              message.senderInfo = { username: "Unknown", profession: "No Profession", profilePicURL: "" };
            }
          } catch (error) {
            console.error("Error fetching sender info:", error);
            message.senderInfo = { username: "Unknown", profession: "No Profession", profilePicURL: "" };
          }
        }

        return message;
      }));

      setMessages(messagesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch messages.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || !currentUser?.uid) return;

    setSending(true);
    try {
      await addDoc(collection(firestore, "messages"), {
        senderId: currentUser.uid,
        text: message,
        timestamp: serverTimestamp(),
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSending(false);
    }
  };

  const navigateToProfile = (username) => {
    navigate(`/${username}`);
  };

  return (
    <Flex h="100vh" flexDirection="column">
      <Box flex={1} overflowY="auto" p={4}>
        {loading ? (
          <Spinner />
        ) : (
          <VStack align="start" spacing={4}>
            {messages.map((msg) => (
              <Flex 
                key={msg.id} 
                p={3} 
                bg={msg.senderId === currentUser?.uid ? "grey.600" : "black.200"} 
                borderRadius="md" 
                w="full" 
                direction="column"
              >
                <Flex align="center" mb={2} onClick={() => navigateToProfile(msg.senderInfo?.username)} cursor="pointer">
                  <Avatar 
                    size="sm" 
                    src={msg.senderInfo?.profilePicURL || "https://via.placeholder.com/40"} 
                    mr={2} 
                  />
                  <Box>
                    <Text fontWeight="bold" _hover={{ textDecoration: "underline" }}>{msg.senderInfo?.username || "Unknown User"}</Text>
                    <Text fontSize="sm" color="gray.600">{msg.senderInfo?.profession || "No Profession"}</Text>
                  </Box>
                </Flex>
                <Text>{msg.text}</Text>
              </Flex>
            ))}
            <div ref={messagesEndRef} />
          </VStack>
        )}
      </Box>
      <Flex p={4}>
        <Input
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !sending && sendMessage()}
          isDisabled={sending}
        />
        <Button
          colorScheme="blue"
          onClick={sendMessage}
          isLoading={sending}
          isDisabled={sending}
          ml={2}
        >
          Send
        </Button>
      </Flex>
    </Flex>
  );
};

export default MessageTab;
