import { useRef, useState, Fragment } from "react";
import { Link as RouterLink } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Box, Heading, Text, Flex, VStack, Button, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, SimpleGrid, Card, CardBody, CardHeader, List, ListItem, ListIcon, Link, Image, Container } from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';

const Hero = () => {
  const heroRef = useRef(null);

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
          gap={16} 
          direction={{ base: 'column', lg: 'row' }}
          py={16}
        >
          <VStack 
            maxW="2xl" 
            align={{ base: 'center', lg: 'flex-start' }} 
            textAlign={{ base: 'center', lg: 'left' }} 
            spacing={6}
            flex={1}
          >
            <Flex align="center" gap={6} direction={{ base: 'row', md: 'row' }}>
              <Image 
                src="/logohero.jpeg" 
                alt="Logo" 
                w={{ base: 24, md: 32 }} 
                h={{ base: 24, md: 32 }} 
                 
                
              />
              <Heading 
                as="h1" 
                size={{ base: '2xl', md: '4xl' }} 
                fontWeight="extrabold" 
                lineHeight="tight" 
                bgGradient="linear(to-r, #0f172a, #1e3a8a, #4338ca)" 
                bgClip="text"
                textAlign={{ base: 'center', md: 'left' }}
              >
                OpenWorld
                <br />
                <Text as="span" display="inline-block" mt={2}>
                  TradeTime
                </Text>
              </Heading>
            </Flex>
            <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.700" fontWeight="medium" mt={4}>
              We are always surrounded by the same 4 people everyday. Current social media also connects us with the same set of people we already know, and connecting with someone out of our network is really hard and sucks.
            </Text>
            <Text fontSize={{ base: 'md', md: 'lg' }} color="gray.600" mt={2}>
              We are solving it in a new way that has never been done before.
            </Text>
            <Flex 
              direction={{ base: 'column', sm: 'row' }} 
              gap={4} 
              mt={8} 
              justify={{ base: 'center', lg: 'flex-start' }}
              w="full"
            >
              <Button 
                as={RouterLink} 
                to="/auth" 
                bgGradient="linear(to-r, blue.600, cyan.500)" 
                color="white" 
                px={8} 
                py={4}
                size="lg"
                borderRadius="xl" 
                fontWeight="semibold" 
                shadow="lg" 
                _hover={{ shadow: 'xl', transform: 'scale(1.05)' }}
                transition="all 0.3s"
              >
                Get Started
              </Button>
            </Flex>
          </VStack>
          <Flex 
            mt={{ base: 12, lg: 0 }} 
            h={{ base: '300px', md: '480px', lg: '520px' }} 
            flex={1} 
            justify="center" 
            align="center"
            maxW={{ base: '100%', lg: '50%' }}
          >
            <Box 
              as="video" 
              src="/video.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline 
              h="100%"
              w="auto" 
              maxW="100%"
              borderRadius="2xl" 
              border="1px solid" 
              borderColor="gray.200"
              shadow="2xl" 
              objectFit="cover"
            >
              <source src="/video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </Box>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
};

const modes = [
  {
    title: "AI Friend",
    description: "Everyone will have their AI friend which chats with them and understands them. Whenever you ask it to connect with someone, it chats with other AI friends in the network and finds who might help you and sends them notification introducing you. First it sends to 5 people, then 10, and so on until one accepts.",
    gradient: "linear(to-br, blue.500, indigo.500, purple.600)",
  },
  {
    title: "Notifications",
    description: "You will receive notifications from AI where it introduces you to people whom you can help. You can judge them by seeing their profile, and there is an accept button. When you click on the accept button, the other person also gets a notification that you are willing to help. He will also see your profile and judge you, and if he also clicks the accept button, you will be directed to a common messages room.",
    gradient: "linear(to-br, teal.500, emerald.500, lime.500)",
  },
  {
    title: "Messages",
    description: "After getting connected, you will be in a temporary message room where at the end of the chat you will get a reputation score from the other user. The more people you help, the greater you can earn, and you can find tools to trade time.",
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
              In OpenWorld, We Connect You to the Right People at the Right Time
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
              We are solving this by introducing AI friends that chat with you and understand you. We are building a new ecosystem where you get paid when you help others, and your reputation grows as you contribute.
            </Text>
          </motion.div>
        </VStack>
        <motion.div 
          initial={{ opacity: 0 }} 
          whileInView={{ opacity: 1 }} 
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <SimpleGrid 
            columns={{ base: 1, md: 3 }} 
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
                    <Heading as="h3" size="xl" fontWeight="semibold" mb={3}>
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

const pricingTiers = [
  {
    title: "Blue Level",
    commission: "15%",
    buttonText: "Start Trading",
    description: "Entry level time trader. Build trust and start your journey.",
    features: [
      "Access to marketplace",
      "Basic reputation score",
      "Trade verification",
      "Secure escrow transactions",
    ],
    color: "blue"
  },
  {
    title: "Green Level",
    commission: "10%",
    buttonText: "Trade Smarter",
    description: "For consistent and reputed time traders.",
    features: [
      "Everything in Blue",
      "Priority listing in marketplace",
      "Faster trade approvals",
      "Community recognition badge",
    ],
    color: "green"
  },
  {
    title: "Purple Level",
    commission: "5%",
    buttonText: "Grow Reputation",
    description: "Trusted traders with proven track record.",
    features: [
      "Everything in Green",
      "Lower commission fees",
      "Exclusive time-trading tools",
      "Visibility boost in feed",
    ],
    color: "purple"
  },
  {
    title: "Red Level",
    commission: "2%",
    buttonText: "Elite Trader",
    description: "Top reputation holders. Premium community.",
    features: [
      "Everything in Purple",
      "Elite trader badge",
      "Advanced analytics tools",
      "Early access to new features",
    ],
    color: "red"
  },
];

const Pricing = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? pricingTiers.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === pricingTiers.length - 1 ? 0 : prev + 1));
  };

  const tier = pricingTiers[activeIndex];

  return (
    <Box 
      as="section" 
      position="relative" 
      minH="100vh"
      display="flex"
      alignItems="center"
      bgGradient="radial(ellipse 200% 100% at bottom left, #0A1F91, #1E3FB4, #4B6FFF)" 
      py={20}
      overflow="hidden"
    >
      <Container maxW="6xl">
        <VStack textAlign="center" spacing={6} mb={12}>
          <Heading 
            as="h2" 
            size={{ base: '2xl', md: '3xl', lg: '4xl' }} 
            fontWeight="bold" 
            color="white"
          >
            Time Trader Levels
          </Heading>
          <Text 
            fontSize={{ base: 'lg', md: 'xl' }} 
            color="blue.100" 
            opacity={0.9} 
            maxW="3xl" 
            mx="auto"
          >
            Reputation-based levels. Grow as you trade. We just charge a small commission.
          </Text>
        </VStack>
        
        {/* Desktop Grid */}
        <SimpleGrid 
          columns={{ base: 1, lg: 2, xl: 4 }} 
          spacing={8} 
          display={{ base: 'none', lg: 'grid' }}
        >
          {pricingTiers.map((tier, index) => (
            <Card 
              key={tier.title}
              bg="whiteAlpha.100"
              backdropFilter="blur(10px)"
              color="white"
              rounded="2xl"
              p={8}
              shadow="2xl"
              border="1px solid"
              borderColor="whiteAlpha.200"
              textAlign="center"
              position="relative"
              overflow="hidden"
              _hover={{
                transform: 'translateY(-8px)',
                transition: 'all 0.3s ease'
              }}
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                h="4px"
                bgGradient={`linear(to-r, ${tier.color}.400, ${tier.color}.600)`}
              />
              <Heading as="h3" size="xl" fontWeight="semibold" mb={3}>
                {tier.title}
              </Heading>
              <Text fontSize="sm" color="blue.100" opacity={0.9} mb={6}>
                {tier.description}
              </Text>
              <Flex fontSize="4xl" fontWeight="bold" mb={6} align="baseline" justify="center">
                {tier.commission}
                <Text ml={2} fontSize="lg" fontWeight="medium" color="blue.200">
                  commission
                </Text>
              </Flex>
              <Button 
                as={RouterLink} 
                to="/auth" 
                w="full" 
                py={4}
                fontSize="lg"
                bgGradient={`linear(to-r, ${tier.color}.500, ${tier.color}.700)`}
                color="white"
                fontWeight="semibold"
                borderRadius="lg"
                _hover={{ 
                  bgGradient: `linear(to-r, ${tier.color}.600, ${tier.color}.800)`,
                  transform: 'scale(1.02)'
                }}
                mb={6}
              >
                {tier.buttonText}
              </Button>
              <List spacing={3} fontSize="sm" color="blue.100">
                {tier.features.map((feature, i) => (
                  <ListItem key={i} display="flex" alignItems="center" gap={3}>
                    <ListIcon as={CheckIcon} color={`${tier.color}.300`} />
                    {feature}
                  </ListItem>
                ))}
              </List>
            </Card>
          ))}
        </SimpleGrid>

        {/* Mobile Carousel */}
        <Flex 
          justify="center" 
          align="center" 
          gap={{ base: 4, md: 8 }} 
          display={{ base: 'flex', lg: 'none' }}
        >
          <Button 
            onClick={handlePrev} 
            bg="whiteAlpha.200"
            _hover={{ bg: 'whiteAlpha.300' }}
            color="white" 
            p={3}
            borderRadius="full" 
            backdropFilter="blur(4px)"
            size="lg"
          >
            <ChevronLeft size={24} />
          </Button>
          
          <Card 
            bg="whiteAlpha.100"
            backdropFilter="blur(10px)"
            color="white"
            rounded="2xl"
            p={8}
            shadow="2xl"
            w="full"
            maxW="md"
            border="1px solid"
            borderColor="whiteAlpha.200"
            textAlign="center"
          >
            <Heading as="h3" size="xl" fontWeight="semibold" mb={3}>
              {tier.title}
            </Heading>
            <Text fontSize="sm" color="blue.100" opacity={0.9} mb={3}>
              {tier.description}
            </Text>
            <Flex fontSize="3xl" fontWeight="bold" mb={4} align="baseline" justify="center">
              {tier.commission}
              <Text ml={2} fontSize="md" fontWeight="medium" color="blue.200">
                commission
              </Text>
            </Flex>
            <Button 
              as={RouterLink} 
              to="/auth" 
              w="full" 
              py={4}
              fontSize="lg"
              bgGradient={`linear(to-r, ${tier.color}.500, ${tier.color}.700)`}
              color="white"
              fontWeight="semibold"
              borderRadius="lg"
              _hover={{ 
                bgGradient: `linear(to-r, ${tier.color}.600, ${tier.color}.800)`,
                transform: 'scale(1.02)'
              }}
              mb={6}
            >
              {tier.buttonText}
            </Button>
            <List spacing={2} fontSize="sm" color="blue.100">
              {tier.features.map((feature, i) => (
                <ListItem key={i} display="flex" alignItems="center" gap={3}>
                  <ListIcon as={CheckIcon} color={`${tier.color}.300`} />
                  {feature}
                </ListItem>
              ))}
            </List>
          </Card>
          
          <Button 
            onClick={handleNext} 
            bg="whiteAlpha.200"
            _hover={{ bg: 'whiteAlpha.300' }}
            color="white" 
            p={3}
            borderRadius="full" 
            backdropFilter="blur(4px)"
            size="lg"
          >
            <ChevronRight size={24} />
          </Button>
        </Flex>
      </Container>
    </Box>
  );
};

const faqs = [
  {
    question: "What is OpenWorld TradeTime?",
    answer: "It's India's first social network for Trading Time where you can Connect with people beyond your network through of AI friends",
  },
  {
    question: "How does OpenWorld make money?",
    answer: "OpenWorld doesn't charge you a monthly fee or subscription. Instead, it takes a small cut (called a commission) only when you successfully complete a trade. This keeps things fair and lets everyone use the platform without upfront costs.",
  },
  {
    question: "What are Time Trader Levels?",
    answer: "These are like levels in a game that show how trustworthy and active you are on the platform. You start at Blue (beginner) and can level up to Green, Purple, and Red by helping others and building a good reputation. Higher levels give you perks like lower fees, better visibility, and special tools to make trading easier.",
  },
  {
    question: "Is OpenWorld free to use?",
    answer: "Yes, joining and using OpenWorld is completely free. You can sign up, browse, connect with people using AI friends, and start trading time without paying anything upfront. The only cost is a small commission if your trade goes through successfully.",
  },
  {
    question: "Who can join OpenWorld?",
    answer: "Anyone can join! Whether you're a student looking to learn new skills, a freelancer offering your expertise, a startup needing help, or even a company or agency— if you have time or skills to share, you're welcome. It's for everyday people who want to help and get help in return.",
  },
  {
    question: "Is OpenWorld decentralized?",
    answer: "Yes, it's built to be decentralized. This means it's not run by one central authority. Instead, it relies on users, their reputations, and AI to connect people fairly. Your success depends on how much you contribute and the trust you build, not on ads or money.",
  },
  {
    question: "How can I earn by helping others for free?",
    answer: "You can earn real money just by helping people on the platform! If you help more than 50 people (for free or through trades), OpenWorld will pay you a decent amount as a reward. And if you keep the streak going by continuing to help consistently, your earnings will compound—meaning they grow over time, so you earn even more the longer you maintain it.",
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
            Everything you need to know about trading time in OpenWorld.
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
    text: "OpenWorld made it simple for me to exchange my design skills for coding help. No money, just time well spent!",
    imageSrc: "/avatar-1.jpeg",
    name: "Jamie Rivera",
    username: "@jamietrades",
  },
  {
    text: "The reputation system in OpenWorld motivates me to trade smarter and grow my Red-level status.",
    imageSrc: "/avatar-2.jpeg",
    name: "Josh Smith",
    username: "@jjsmith",
  },
  {
    text: "I've met incredible people and exchanged time in ways that felt more valuable than money.",
    imageSrc: "/avatar-3.jpeg",
    name: "Morgan Lee",
    username: "@morganlee",
  },
  {
    text: "Trading time in a decentralized way felt fresh and fair -- OpenWorld is changing how I think about work.",
    imageSrc: "/avatar-4.jpeg",
    name: "Casey Jordan",
    username: "@caseyj",
  },
  {
    text: "OpenWorld is more than a marketplace, it's a community of people exchanging skills with trust.",
    imageSrc: "/avatar-5.jpeg",
    name: "Taylor Kim",
    username: "@taylorkimm",
  },
  {
    text: "Instead of chasing clients, I just trade my hours here and get what I need back. It feels natural.",
    imageSrc: "/avatar-6.jpeg",
    name: "Riley Smith",
    username: "@rileysmith",
  },
  {
    text: "The levels -- Blue, Green, Purple, Red -- make it exciting to grow your reputation while trading.",
    imageSrc: "/avatar-7.jpeg",
    name: "Jordan Patel",
    username: "@jpatel",
  },
  {
    text: "I exchanged tutoring hours for music lessons. OpenWorld made the swap seamless and transparent.",
    imageSrc: "/avatar-8.jpeg",
    name: "Sam Dawson",
    username: "@dawson",
  },
  {
    text: "Finally, a place where time is truly currency. OpenWorld feels like the future of collaboration.",
    imageSrc: "/avatar-9.jpeg",
    name: "Casey Harper",
    username: "@caseyharper",
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
      {[...new Array(2)].fill(0).map((_, index) => (
        <Fragment key={index}>
          {props.testimonials.map(({ text, imageSrc, name, username }, i) => (
            <Card
              key={`${index}-${i}`}
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
                "{text}"
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
            OpenWorld is not just about trading time — it's about building trust,
            reputation, and a community where collaboration feels natural.
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
            Start Trading Your Time on OpenWorld
          </Heading>
          <Text 
            color="gray.700" 
            fontSize={{ base: 'lg', md: 'xl' }} 
            maxW="2xl" 
            mx="auto"
            lineHeight="1.6"
          >
            Join a decentralized marketplace where your skills, time, and reputation define your growth. Trade freely, build trust, and climb levels from Blue to Red in OpenWorld.
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
              onClick={scrollToTop} 
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
              Learn More →
            </Button>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
};

const Footer = () => {
  return (
    <Box as="footer" bg="black.900" color="gray.300" py={16}>
      <Container maxW="6xl">
        <VStack spacing={8} textAlign="center">
          <Heading 
              as="h2" 
              size={{ base: '2xl', md: '3xl' }} 
              fontWeight="bold" 
              bgGradient="linear(to-r, #0f172a, #1e3a8a, #4338ca)" 
              bgClip="text"
            >
              OpenWorld TradeTime
            </Heading>
            <Text 
              fontSize={{ base: 'md', lg: 'lg' }} 
              color="white.600" 
              maxW="2xl" 
              mx="auto"
              lineHeight="1.7"
            >
              India’s first social network for <strong>trading time</strong> — connect beyond your circle, grow your reputation, and discover new opportunities with the help of <strong>AI-powered friends</strong>.
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
              Communities
            </Link>
            <Link href="#" _hover={{ color: 'white', textDecoration: 'underline' }}>
              Time Levels
            </Link>
            <Link href="#" _hover={{ color: 'white', textDecoration: 'underline' }}>
              Marketplace
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
          <Text fontSize="sm" color="gray.500" pt={4} borderTop="1px solid" borderColor="gray.700" w="full" maxW="md" mx="auto">
            &copy; {new Date().getFullYear()} OpenWorld (Harinath Mechtech Innovations Pvt. Ltd.). All rights reserved.
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};

const LandingPage = () => {
  return (
    <Box w="100%" minH="100vh">
      <Hero />
      <FeaturesSection />
      <Pricing />
      <FAQ />
      <Testimonials />
      <CallToAction />
      <Footer />
    </Box>
  );
};

export default LandingPage;