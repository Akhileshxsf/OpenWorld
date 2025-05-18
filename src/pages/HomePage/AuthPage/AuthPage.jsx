import { Container, Flex, VStack, Box, Image, Text, Heading } from "@chakra-ui/react";
import { motion } from "framer-motion";
import AuthForm from "../../../components/AuthForm/AuthForm";

// Motion variants for animations
const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const logoVariants = {
  hover: { scale: 1.1, rotate: 5, transition: { duration: 0.3 } },
};

const MotionBox = motion(Box);
const MotionImage = motion(Image);

const AuthPage = () => {
  return (
    <Flex
      minH={"100vh"} // Full viewport height
      w={"100vw"} // Full viewport width
      bg={"black"}
      justifyContent={"center"}
      alignItems={"center"}
      px={{ base: 4, md: 8 }}
      overflow={"hidden"} // Prevent scrolling issues
    >
      <Container
        maxW={"container.md"}
        w={"full"} // Ensure container takes full width within limits
        h={"full"} // Ensure container takes full height within limits
        padding={0}
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
      >
        <MotionBox
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          bg={"black"} // Strictly black inside
          borderRadius={"2xl"}
          boxShadow={"0 0 20px rgba(255, 255, 255, 0.1)"}
          p={{ base: 6, md: 10 }}
          w={"full"} // Full width within container
          maxW={"md"} // Limit max width for readability
          h={"auto"} // Height adjusts to content
          minH={{ base: "auto", md: "80vh" }} // Minimum height for larger screens
        >
          <Flex
            direction={"column"}
            justifyContent={"space-between"} // Distribute content evenly
            alignItems={"center"}
            gap={{ base: 8, md: 12 }} // Responsive gap
            h={"full"} // Ensure Flex takes full height of MotionBox
          >
            {/* Header */}
            <VStack spacing={2}>
              <Heading
                as="h1"
                size={{ base: "lg", md: "xl" }} // Responsive heading size
                color={"white"}
                fontWeight={"extrabold"}
                letterSpacing={"tight"}
                textTransform={"uppercase"}
              >
                Welcome 
              </Heading>
              <Text color={"gray.400"} fontSize={{ base: "sm", md: "md" }}>
                Sign in to our universe
              </Text>
            </VStack>

            {/* Auth Form */}
            <VStack
              spacing={6}
              align={"stretch"}
              w={"full"}
              maxW={"sm"} // Slightly narrower form for better fit
              flex={1} // Allow form section to grow
            >
              <AuthForm />
              <MotionBox
                textAlign={"center"}
                color={"white"}
                fontWeight={"bold"}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                Get the app now!
              </MotionBox>
              <Flex gap={{ base: 4, md: 6 }} justifyContent={"center"}>
                <MotionImage
                  src="/playstore.png"
                  h={{ base: "10", md: "12" }} // Responsive logo size
                  alt="Playstore logo"
                  filter={"grayscale(100%) brightness(90%)"}
                  variants={logoVariants}
                  whileHover="hover"
                />
                <MotionImage
                  src="/microsoft.png"
                  h={{ base: "10", md: "12" }} // Responsive logo size
                  alt="Microsoft logo"
                  filter={"grayscale(100%) brightness(90%)"}
                  variants={logoVariants}
                  whileHover="hover"
                />
              </Flex>
            </VStack>

            {/* Footer Accent */}
            <Box
              w={{ base: "70%", md: "50%" }} // Responsive width
              h={"2px"}
              bgGradient={"linear(to-r, gray.700, white, gray.700)"}
              borderRadius={"full"}
            />
          </Flex>
        </MotionBox>
      </Container>
    </Flex>
  );
};

export default AuthPage;