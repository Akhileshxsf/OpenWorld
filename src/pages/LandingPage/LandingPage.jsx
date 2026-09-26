import { useRef, useState, Fragment } from "react";
import { Link as RouterLink } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Box, Heading, Text, Flex, VStack, Button, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, SimpleGrid, Card, CardBody, CardHeader, List, ListItem, ListIcon, Link, Image, Container } from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';

const COMPANY_LEGAL_NAME = "HARINATH MECHTECH INNOVATIONS PRIVATE LIMITED";

const Header = () => {
  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={20}
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.200"
      shadow="sm"
    >
      <Container maxW="container.xl" px={{ base: 4, md: 16 }} py={{ base: 3, md: 3.5 }}>
        <Flex
          align="center"
          justify="space-between"
          gap={4}
          direction={{ base: "column", md: "row" }}
        >
          <Flex align="center" gap={3}>
            <Image src="/logohero.jpeg" alt="OpenWorldX" w={9} h={9} objectFit="contain" />
            <Text fontWeight="bold" color="gray.900" fontSize={{ base: "md", md: "lg" }}>
              OpenWorldX
            </Text>
          </Flex>
          <Text
            as="p"
            fontSize={{ base: "10px", sm: "xs", md: "sm" }}
            fontWeight="bold"
            letterSpacing="0.02em"
            color="gray.800"
            textAlign={{ base: "center", md: "right" }}
            textTransform="none"
            lineHeight="1.4"
          >
            {COMPANY_LEGAL_NAME}
          </Text>
        </Flex>
      </Container>
    </Box>
  );
};

const Hero = () => {
  const heroRef = useRef(null);
  const videoRef = useRef(null);

  // Attempt to play video with sound
  const handleVideoLoad = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.log("Auto-play with sound prevented by browser:", e));
    }
  };

  return (
    <Box 
      as="section" 
      ref={heroRef} 
      minH="100vh" 
      display="flex" 
      alignItems="center"
      bgGradient="linear(to-br, blue.50, white, blue.100)" 
      overflowX="clip"
    >
      <Container maxW="container.xl" px={{ base: 6, md: 16 }}>
        <Flex 
          align="center" 
          justify="space-between" 
          gap={12} 
          direction={{ base: 'column', lg: 'row' }}
          py={12}
        >
          <VStack 
            maxW="2xl" 
            align={{ base: 'center', lg: 'flex-start' }} 
            textAlign={{ base: 'center', lg: 'left' }} 
            spacing={5}
            flex={1}
          >
            <Flex align="center" gap={4} direction={{ base: 'row', md: 'row' }}>
              <Image 
                src="/logohero.jpeg" 
                alt="Logo" 
                w={{ base: 20, md: 28 }} 
                h={{ base: 20, md: 28 }} 
                objectFit="contain"
                bg="transparent"
              />
              <Box>
                <Heading 
                  as="h1" 
                  fontSize={{ base: '3xl', md: '5xl' }} 
                  fontWeight="extrabold" 
                  lineHeight="1.2" 
                  bgGradient="linear(to-r, #0f172a, #1e3a8a, #4338ca)" 
                  bgClip="text"
                >
                  OpenWorldX
                </Heading>
                <Text 
                  fontSize={{ base: 'xl', md: '2xl' }} 
                  fontWeight="semibold" 
                  color="gray.600"
                  mt={1}
                >
                  The AI Network
                </Text>
              </Box>
            </Flex>
            <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.700" fontWeight="medium" lineHeight="1.6" mt={4}>
              We are always surrounded by the same 4 people everyday. Current social media also connects us with the same set of people we already know, and connecting with someone out of our network is really hard.
            </Text>
            <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.600">
              We are solving it in a new way that has never been done before.
            </Text>
            <Flex 
              direction={{ base: 'column', sm: 'row' }} 
              gap={4} 
              mt={6} 
              justify={{ base: 'center', lg: 'flex-start' }}
              w="full"
            >
              <Button 
                as={RouterLink} 
                to="/auth" 
                bgGradient="linear(to-r, blue.600, blue.500)" 
                color="white" 
                px={8} 
                py={6}
                size="lg"
                fontSize="md"
                borderRadius="full" 
                fontWeight="bold" 
                shadow="lg" 
                _hover={{ shadow: 'xl', transform: 'translateY(-2px)', bgGradient: "linear(to-r, blue.700, blue.600)" }}
                transition="all 0.3s"
              >
                Get Started
              </Button>
              {import.meta.env.VITE_WHATSAPP_NUMBER && (
                <Button
                  as="a"
                  href={`https://wa.me/${String(import.meta.env.VITE_WHATSAPP_NUMBER).replace(/\D/g, "")}?text=${encodeURIComponent("Hi Mira")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  bg="#25D366"
                  color="white"
                  px={8}
                  py={6}
                  size="lg"
                  fontSize="md"
                  borderRadius="full"
                  fontWeight="bold"
                  shadow="lg"
                  _hover={{ shadow: "xl", transform: "translateY(-2px)", bg: "#1EBE57" }}
                  transition="all 0.3s"
                >
                  Chat on WhatsApp
                </Button>
              )}
              <Button 
                as="a"
                href="https://play.google.com/store/apps/details?id=com.openworldx.openworld"
                target="_blank"
                rel="noopener noreferrer"
                bg="white" 
                color="gray.800" 
                px={6} 
                py={6}
                size="lg"
                fontSize="md"
                borderRadius="full" 
                fontWeight="bold" 
                shadow="md"
                border="1px solid"
                borderColor="gray.300"
                _hover={{ shadow: 'lg', transform: 'translateY(-2px)', bg: 'gray.50' }}
                transition="all 0.3s"
              >
                <Image 
                  src="/googlr play.jpeg" 
                  alt="Google Play" 
                  h={8} 
                  objectFit="contain"
                />
              </Button>
            </Flex>
          </VStack>
          <Flex 
            mt={{ base: 10, lg: 0 }} 
            flex={1} 
            justify="center" 
            align="center"
            maxW={{ base: '100%', lg: '45%' }}
          >
            <Box
              position="relative"
              w="100%"
              borderRadius="3xl"
              overflow="hidden"
              boxShadow="2xl"
              border="1px solid"
              borderColor="white"
              bg="black"
            >
              <Box
                as="video"
                ref={videoRef}
                src="/Mira Video updated.mp4"
                autoPlay
                loop
                playsInline
                controls
                onLoadedData={handleVideoLoad}
                w="100%"
                h="auto"
                objectFit="cover"
                sx={{
                  aspectRatio: "16/9",
                }}
              >
                <source src="/Mira Video updated.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </Box>
            </Box>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
};

const modes = [
  {
    title: "AI Friend - Mira",
    description: "Everyone has their own AI friend Mira who chats with them and understands them. Whenever you ask Mira to connect with someone, it chats with other AI friends in the network and finds who might help you, sending them a notification introducing you. First it sends to 5 people, then 10, and so on until one accepts.",
    gradient: "linear(to-br, blue.500, indigo.500, purple.600)",
  },
  {
    title: "Blasts",
    description: "When you have a message or request that needs quick answers, Mira can blast it to relevant people in the network. Your AI analyzes your message and finds the most relevant people who can help, then shares it with them. You get instant responses from multiple people who are interested, making connections faster than ever before.",
    gradient: "linear(to-br, blue.500, indigo.500, purple.600)",
  },
  {
    title: "Notifications",
    description: "You receive notifications from Mira introducing you to people whom you can help. You can judge them by seeing their profile, and there is an accept button. When you click accept, the other person gets a notification that you are willing to help. They will also see your profile and judge you, and if they also accept, you will be directed to a common messages room.",
    gradient: "linear(to-br, teal.500, emerald.500, lime.500)",
  },
  {
    title: "Messages & Reputation",
    description: "After getting connected, you will be in a temporary message room where at the end of the chat you get a reputation score from the other user. The more people you help, the greater your reputation grows, unlocking new opportunities and connections within the network.",
    gradient: "linear(to-br, pink.500, rose.500, red.500)",
  },
];

const FeaturesSection = () => {
  return (
    <Box 
      as="section" 
      position="relative" 
      zIndex={10} 
      minH="100vh"
      display="flex"
      alignItems="center"
      bgGradient="radial(ellipse 120% 100% at top right, #F0F5FF, #FFFFFF)" 
      py={20}
      overflow="hidden"
    >
      <Container maxW="7xl">
        <VStack textAlign="center" mb={16} spacing={6}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
          >
            <Heading 
              as="h2" 
              size={{ base: '2xl', md: '3xl', lg: '3xl' }} 
              fontWeight="bold" 
              bgGradient="linear(to-r, #0f172a, #1e3a8a, #4338ca)" 
              bgClip="text"
              maxW="6xl"
              mx="auto"
            >
              In OpenWorldX, We Connect You to the Right People at the Right Time
            </Heading>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Text 
              fontSize={{ base: 'lg', md: 'xl' }} 
              color="gray.700" 
              maxW="4xl" 
              mx="auto"
              lineHeight="1.6"
            >
              We are solving this by introducing AI friends that chat with you and understand you. We are building a new ecosystem where your reputation grows as you help others.
            </Text>
          </motion.div>
        </VStack>
        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <SimpleGrid 
            columns={{ base: 1, md: 2, lg: 4 }} 
            spacing={8} 
            maxW="7xl" 
            mx="auto"
          >
            {modes.map(({ title, description, gradient }) => (
              <motion.div 
                key={title} 
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card 
                  rounded="2xl" 
                  p={{ base: 6, md: 8 }} 
                  color="white" 
                  bgGradient={gradient} 
                  shadow="xl" 
                  display="flex" 
                  flexDir="column" 
                  justifyContent="space-between"
                  minH="320px"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                >
                  <CardHeader pb={4}>
                    <Heading 
                      as="h3" 
                      size={{ base: "xl", lg: "lg" }} 
                      fontWeight="semibold" 
                      mb={3}
                    >
                      {title}
                    </Heading>
                  </CardHeader>
                  <CardBody pt={0}>
                    <Text fontSize={{ base: 'sm', md: 'md' }} opacity={0.95} lineHeight="1.6">
                      {description}
                    </Text>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </SimpleGrid>
        </motion.div>
      </Container>
    </Box>
  );
};

const faqs = [
  {
    question: "What is OpenWorldX?",
    answer: "OpenWorldX is India's first AI-powered social network where you can connect with people beyond your network through your AI friend Mira.",
  },
  {
    question: "What is Mira?",
    answer: "Mira is your personal AI friend who chats with you, understands you, and helps you connect with relevant people in the network. Mira can also blast your messages to find quick responses from people who can help.",
  },
  {
    question: "What are Blasts?",
    answer: "Blasts are a powerful feature where Mira shares your message with relevant people in the network and brings back instant responses. It's the fastest way to get help or find collaborators for your ideas.",
  },
  {
    question: "What are Reputation Levels?",
    answer: "These are levels (Bronze, Silver, Gold, Platinum) that show how trustworthy and active you are on the platform. You start at Bronze and can level up by helping others and building a good reputation. Higher levels give you perks like better visibility and more connections.",
  },
  {
    question: "Is OpenWorldX free to use?",
    answer: "Yes, joining and using OpenWorldX is completely free. You can sign up, connect with people using Mira, and build your reputation without any upfront costs.",
  },
  {
    question: "Who can join OpenWorldX?",
    answer: "Anyone can join! Whether you are a student looking to learn new skills, a professional seeking collaborations, or someone who wants to expand their network — OpenWorldX is for everyone who wants to connect beyond their immediate circle.",
  },
  {
    question: "How does the reputation system work?",
    answer: "After each conversation, you exchange reputation scores with the other user. The more people you help and the better your interactions, the higher your reputation grows. Higher reputation unlocks new levels and opportunities.",
  },
];

const FAQ = () => {
  return (
    <Box 
      as="section" 
      bg="white" 
      minH="100vh"
      display="flex"
      alignItems="center"
      py={20}
    >
      <Container maxW="6xl">
        <VStack textAlign="center" spacing={6} mb={12}>
          <Heading 
            as="h2" 
            size={{ base: '2xl', md: '3xl', lg: '3xl' }} 
            fontWeight="bold" 
            bgGradient="linear(to-r, #0f172a, #1e3a8a, #4338ca)" 
            bgClip="text"
          >
            Frequently Asked Questions
          </Heading>
          <Text color="gray.600" fontSize={{ base: 'lg', md: 'xl' }} maxW="2xl" mx="auto">
            Everything you need to know about OpenWorldX and Mira.
          </Text>
        </VStack>
        <Accordion allowToggle>
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              border="1px solid" 
              borderColor="gray.200"
              rounded="xl" 
              p={6} 
              bg="white" 
              shadow="base" 
              mb={4}
              _hover={{ shadow: 'md' }}
              transition="all 0.3s"
            >
              <AccordionButton 
                w="full" 
                textAlign="left" 
                justifyContent="space-between" 
                fontWeight="semibold" 
                color="gray.800" 
                fontSize={{ base: 'lg', md: 'xl' }}
                py={4}
                _hover={{ bg: 'transparent' }}
              >
                {faq.question}
                <AccordionIcon color="blue.600" fontSize="2xl" />
              </AccordionButton>
              <AccordionPanel mt={3} color="gray.600" fontSize={{ base: 'md', md: 'lg' }} lineHeight="1.6">
                {faq.answer}
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </Box>
  );
};

const testimonials = [
  {
    text: "OpenWorldX made it simple for me to find people who share my interests. Mira is amazing!",
    imageSrc: "/avatar-1.jpeg",
    name: "Ishita",
    username: "@Ishita",
  },
  {
    text: "The reputation system motivates me to help more people. Can't wait to reach Platinum level!",
    imageSrc: "/avatar-2.jpeg",
    name: "Aditya",
    username: "@Aditya",
  },
  {
    text: "I've met incredible people through Mira. The Blasts feature helped me get instant responses!",
    imageSrc: "/avatar-3.jpeg",
    name: "Kiran",
    username: "@Kiran",
  },
  {
    text: "Finally a social network that helps me connect beyond my circle. OpenWorldX is revolutionary.",
    imageSrc: "/avatar-4.jpeg",
    name: "Kavya",
    username: "@Kavya",
  },
  {
    text: "Mira understands me better than any algorithm. The connections I've made are truly meaningful.",
    imageSrc: "/avatar-5.jpeg",
    name: "Rohan",
    username: "@Rohan",
  },
  {
    text: "Instead of scrolling endlessly, I now connect with people who actually need my help.",
    imageSrc: "/avatar-6.jpeg",
    name: "Aarav",
    username: "@Aarav",
  },
  {
    text: "The reputation levels make it exciting to grow your impact in the community.",
    imageSrc: "/avatar-7.jpeg",
    name: "Vihaan",
    username: "@Vihaan",
  },
  {
    text: "Blasts helped me find collaborators for my project within minutes. This is the future!",
    imageSrc: "/avatar-8.jpeg",
    name: "Diya",
    username: "@Diya",
  },
  {
    text: "Finally, a place where AI actually helps you build meaningful connections.",
    imageSrc: "/avatar-9.jpeg",
    name: "Siddharth",
    username: "@Siddharth",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const TestimonialsColumn = (props) => (
  <Box display={props.display} flex={1}>
    <motion.div
      animate={{ translateY: "-50%" }}
      transition={{
        duration: props.duration || 10,
        repeat: Infinity,
        ease: "linear",
        repeatType: "loop",
      }}
      display="flex"
      flexDir="column"
      gap={6}
      pb={6}
    >
      {[...new Array(2)].fill(0).map((_, arrayIndex) => (
        <Fragment key={arrayIndex}>
          {props.testimonials.map(({ text, imageSrc, name, username }, i) => (
            <Card
              key={`${arrayIndex}-${i}`}
              p={8}
              borderWidth={1}
              borderColor="gray.100"
              borderRadius="3xl"
              shadow="xl"
              maxW="sm"
              w="full"
              bg="white"
              mx="auto"
              _hover={{
                shadow: '2xl',
                transform: 'translateY(-4px)',
                transition: 'all 0.3s ease'
              }}
            >
              <Text color="gray.800" fontSize="lg" lineHeight="1.6">
                &quot;{text}&quot;
              </Text>
              <Flex align="center" gap={4} mt={6}>
                <Image
                  src={imageSrc}
                  alt={name}
                  h={12}
                  w={12}
                  borderRadius="full"
                  objectFit="cover"
                />
                <VStack align="flex-start" spacing={1}>
                  <Text fontWeight="semibold" fontSize="lg" color="gray.900">
                    {name}
                  </Text>
                  <Text color="gray.600" fontSize="md">
                    {username}
                  </Text>
                </VStack>
              </Flex>
            </Card>
          ))}
        </Fragment>
      ))}
    </motion.div>
  </Box>
);

const Testimonials = () => {
  return (
    <Box as="section" bg="gray.50" minH="100vh" display="flex" alignItems="center" py={20}>
      <Container maxW="7xl">
        <VStack spacing={8} textAlign="center" mb={16}>
          <Text
            fontSize="md"
            px={4}
            py={2}
            borderWidth={1}
            borderColor="gray.200"
            borderRadius="full"
            letterSpacing="tight"
            fontWeight="medium"
            bg="white"
            shadow="base"
          >
            Testimonials
          </Text>
          <Heading
            as="h2"
            fontSize={{ base: "3xl", md: "5xl", lg: "6xl" }}
            lineHeight="tight"
            fontWeight="bold"
            letterSpacing="tighter"
            bgGradient="linear(to-b, gray.900, blue.900)"
            bgClip="text"
            maxW="4xl"
            mx="auto"
          >
            What our community says
          </Heading>
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            lineHeight="1.6"
            letterSpacing="tight"
            color="gray.700"
            maxW="2xl"
            mx="auto"
          >
            OpenWorldX is not just about connecting — it's about building trust,
            reputation, and meaningful relationships with the help of AI.
          </Text>
        </VStack>
        
        <Box
          position="relative"
          h="800px"
          overflow="hidden"
          sx={{
            maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)'
          }}
        >
          <Flex
            justify="center"
            gap={8}
            h="full"
            position="absolute"
            top={0}
            left={0}
            right={0}
          >
            <TestimonialsColumn testimonials={firstColumn} duration={20} display="block" />
            <TestimonialsColumn
              testimonials={secondColumn}
              duration={25}
              display={{ base: "none", md: "block" }}
            />
            <TestimonialsColumn
              testimonials={thirdColumn}
              duration={22}
              display={{ base: "none", lg: "block" }}
            />
          </Flex>
        </Box>
      </Container>
    </Box>
  );
};

const CallToAction = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ 
    target: sectionRef, 
    offset: ["start end", "end start"] 
  });
  const translateY = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <Box 
      as="section" 
      ref={sectionRef} 
      minH="80vh"
      display="flex"
      alignItems="center"
      bgGradient="linear(to-b, white, #E6F0FF)" 
      py={24}
      overflowX="clip"
      position="relative"
    >
      <Container maxW="4xl" position="relative">
        <VStack textAlign="center" spacing={8}>
          {/* Background Elements */}
          <motion.div 
            style={{ translateY }} 
            className="absolute top-[-5rem] left-[-5rem] w-80 h-80 bg-blue-100 rounded-full blur-[40px] opacity-60" 
          />
          <motion.div 
            style={{ translateY: useTransform(scrollYProgress, [0, 1], [-100, 100]) }} 
            className="absolute bottom-[-5rem] right-[-5rem] w-80 h-80 bg-purple-100 rounded-full blur-[40px] opacity-60" 
          />
          
          <Heading 
            as="h2" 
            size={{ base: '2xl', md: '3xl', lg: '4xl' }} 
            fontWeight="bold" 
            bgGradient="linear(to-r, #0f172a, #1e3a8a, #4338ca)" 
            bgClip="text"
            maxW="3xl"
          >
            Join OpenWorldX Today
          </Heading>
          <Text 
            color="gray.700" 
            fontSize={{ base: 'lg', md: 'xl' }} 
            maxW="2xl" 
            mx="auto"
            lineHeight="1.6"
          >
            Be part of India&apos;s first AI-powered social network. Let Mira help you connect with the right people, grow your reputation, and expand your network beyond boundaries.
          </Text>
          <Flex 
            gap={6} 
            mt={8} 
            justify="center"
            direction={{ base: 'column', sm: 'row' }}
            w="full"
            maxW="md"
            mx="auto"
          >
            <Button 
              as={RouterLink} 
              to="/auth" 
              px={8} 
              py={4}
              size="lg"
              borderRadius="2xl" 
              bgGradient="linear(to-r, blue.600)" 
              color="white" 
              fontWeight="semibold" 
              shadow="xl" 
              _hover={{ 
                transform: 'scale(1.05)',
                shadow: '2xl'
              }}
              transition="all 0.3s"
              flex={1}
            >
              Get Started
            </Button>
            <Button 
              as="a"
              href="https://play.google.com/store/apps/details?id=com.openworldx.openworld"
              target="_blank"
              rel="noopener noreferrer"
              px={8} 
              py={4}
              size="lg"
              borderRadius="2xl" 
              bg="white" 
              border="2px solid" 
              borderColor="gray.300" 
              color="gray.800" 
              fontWeight="semibold" 
              shadow="base" 
              _hover={{ 
                shadow: 'md',
                bg: "gray.50"
              }}
              transition="all 0.3s"
              flex={1}
            >
              Download App
            </Button>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
};

const Footer = () => {
  return (
    <Box as="footer" bg="black" color="gray.300" py={16}>
      <Container maxW="6xl">
        <VStack spacing={8} textAlign="center">
          <Heading 
              as="h2" 
              size={{ base: '2xl', md: '3xl' }} 
              fontWeight="bold" 
              bgGradient="linear(to-r, #0f172a, #1e3a8a, #4338ca)" 
              bgClip="text"
            >
              OpenWorldX
            </Heading>
            <Text 
              fontSize={{ base: 'md', lg: 'lg' }} 
              color="gray.400" 
              maxW="2xl" 
              mx="auto"
              lineHeight="1.7"
            >
              India&apos;s first AI-powered social network — connect beyond your circle, grow your reputation, and discover new opportunities with the help of <strong>Mira</strong>, your AI friend.
            </Text>
          <Flex 
            flexWrap="wrap" 
            justify="center" 
            gap={6} 
            fontSize={{ base: 'sm', md: 'md' }}
            color="gray.400"
          >
            <Link href="#" _hover={{ color: 'white', textDecoration: 'underline' }}>
              About
            </Link>
            <Link href="#" _hover={{ color: 'white', textDecoration: 'underline' }}>
              How It Works
            </Link>
            <Link href="#" _hover={{ color: 'white', textDecoration: 'underline' }}>
              Mira AI
            </Link>
            <Link href="#" _hover={{ color: 'white', textDecoration: 'underline' }}>
              Reputation Levels
            </Link>
            <Link href="#" _hover={{ color: 'white', textDecoration: 'underline' }}>
              Blasts
            </Link>
            <Link href="#" _hover={{ color: 'white', textDecoration: 'underline' }}>
              Careers
            </Link>
          </Flex>
          <Flex justify="center" gap={6}>
            <Link 
              href="https://www.linkedin.com/company/harinath-mechtech-innovations-private-limited/" 
              target="_blank" 
              rel="noopener noreferrer"
              _hover={{ transform: 'scale(1.1)' }}
              transition="transform 0.2s"
            >
              <Image src="/social-linkedin.svg" alt="LinkedIn" w={6} h={6} filter="invert(1)" _hover={{ opacity: 0.8 }} />
            </Link>
            <Link 
              href="https://www.youtube.com/@Openworldtradetime" 
              target="_blank" 
              rel="noopener noreferrer"
              _hover={{ transform: 'scale(1.1)' }}
              transition="transform 0.2s"
            >
              <Image src="/social-youtube.svg" alt="YouTube" w={6} h={6} filter="invert(1)"  _hover={{ opacity: 0.8 }} />
            </Link>
            <Link 
              href="https://www.instagram.com/akhileshh.7" 
              target="_blank" 
              rel="noopener noreferrer"
              _hover={{ transform: 'scale(1.1)' }}
              transition="transform 0.2s"
            >
              <Image src="/social-insta.svg" alt="Instagram" w={6} h={6} filter="invert(1)"  _hover={{ opacity: 0.8 }} />
            </Link>
          </Flex>
          <Text fontSize="sm" color="gray.500" pt={4} borderTop="1px solid" borderColor="gray.700" w="full" maxW="3xl" mx="auto">
            &copy; {new Date().getFullYear()} {COMPANY_LEGAL_NAME}. All rights reserved.
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};

const LandingPage = () => {
  return (
    <Box w="100%" minH="100vh">
      <Header />
      <Hero />
      <FeaturesSection />
      <FAQ />
      <Testimonials />
      <CallToAction />
      <Footer />
    </Box>
  );
};

export default LandingPage;