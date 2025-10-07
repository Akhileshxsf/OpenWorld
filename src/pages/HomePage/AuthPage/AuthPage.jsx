import { Container, Flex, VStack, Box, Text, Grid, GridItem, Image } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import AuthForm from "../../../components/AuthForm/AuthForm";

// Motion variants for animations
const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.2 },
  },
};

const heroVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
};

const MotionBox = motion(Box);
const MotionText = motion(Text);

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Static background setup
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawBackground();
    };

    const drawBackground = () => {
      // Solid dark black base
      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle white radial gradient
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 1.5
      );
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.05)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <Flex
      minH={"100vh"}
      w={"100vw"}
      position={"relative"}
      justifyContent={"center"}
      alignItems={"center"}
      overflow={"hidden"}
      fontFamily={"'Poppins', sans-serif"}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
        }}
      />
      <Grid
        templateAreas={{
          base: `"hero" "form"`,
          md: `"hero form"`,
        }}
        templateRows={{ base: "auto 1fr", md: "1fr" }}
        templateColumns={{ base: "1fr", md: "1fr 1fr" }}
        gap={{ base: 0, md: 0 }}
        w={"full"}
        h={"full"}
        maxW={"container.xl"}
      >
        {/* Hero Section */}
        <GridItem area={"hero"} display={"flex"} justifyContent={"center"} alignItems={"center"} p={{ base: 8, md: 16 }}>
          <MotionBox
            initial="hidden"
            animate="visible"
            variants={heroVariants}
            textAlign={{ base: "center", md: "left" }}
            maxW={"md"}
          >
            <VStack spacing={{ base: 4, md: 6 }} align={{ base: "center", md: "start" }}>
              <MotionText
                color={"#FFFFFF"}
                fontSize={{ base: "2xl", md: "4xl" }}
                fontWeight={"bold"}
                lineHeight={1.2}
                variants={containerVariants}
              >
                India's First Social Network for Trading Time
              </MotionText>
              <MotionText
                color={"#CCCCCC"}
                fontSize={{ base: "md", md: "lg" }}
                fontWeight={"medium"}
                lineHeight={1.5}
                variants={containerVariants}
              >
                Connect with people beyond your network through AI friends. Discover meaningful exchanges and build lasting connections.
              </MotionText>
            </VStack>
          </MotionBox>
        </GridItem>

        {/* Auth Form Section */}
        <GridItem area={"form"} display={"flex"} justifyContent={"center"} alignItems={"center"} p={{ base: 4, md: 8 }}>
          <MotionBox
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            bg={"black"}
            borderRadius={"xl"}
            boxShadow={"0 0 15px rgba(255, 255, 255, 0.15)"}
            p={{ base: 6, md: 8 }}
            w={"full"}
            maxW={"sm"}
            minH={{ base: "auto", md: "60vh" }}
          >
            <VStack spacing={6} align={"stretch"} w={"full"}>
              <Image
                src="/openworld2022.jpeg"
                h={20}
                mx="auto"
                alt="OpenWorld"
                borderRadius={"md"}
              />
              <AuthForm isLogin={isLogin} onIsLoginChange={setIsLogin} />
            </VStack>
          </MotionBox>
        </GridItem>
      </Grid>
    </Flex>
  );
};

export default AuthPage;