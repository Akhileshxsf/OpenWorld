import { useRef } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Heading,
  Text,
  Flex,
  VStack,
  HStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  SimpleGrid,
  Link,
  Image,
  Divider,
} from "@chakra-ui/react";
import {
  Briefcase,
  Building2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import StudentExperienceShowcase from "./StudentExperienceShowcase";
import LandingHeader from "./LandingHeader";
import AudienceSection from "./AudienceSection";
import {
  fadeUp,
  staggerContainer,
  statIcons,
  WhatsAppButton,
  PrimaryButton,
  GhostLink,
  SocialIconLink,
  Section,
  SectionHeader,
  LandingContainer,
  IncubatorTrustLine,
  HeroEyebrow,
  landingLayout,
  colors,
  ScrollStagger,
  ScrollReveal,
  scrollViewport,
} from "./landingUi";

const WHATSAPP_HREF = import.meta.env.VITE_WHATSAPP_NUMBER
  ? `https://wa.me/${String(import.meta.env.VITE_WHATSAPP_NUMBER).replace(/\D/g, "")}?text=${encodeURIComponent("Hi Mira")}`
  : null;

const COMPANY_CONTACT_MAIL = "mailto:noreply@openworldx.com?subject=OpenWorldX%20%E2%80%94%20Hiring%20%2F%20Campus%20partnership";

const COMPANY_LEGAL_NAME = "HARINATH MECHTECH INNOVATIONS PRIVATE LIMITED";

const MIRA_VIDEO_FILE = "Mira Video updated.mp4";
const MIRA_VIDEO_SRC = `/${encodeURIComponent(MIRA_VIDEO_FILE).replace(/%2F/g, "/")}`;

const IIT_COUNT = 23;
const NIT_COUNT = 31;
const TNP_CELL_COUNT = IIT_COUNT + NIT_COUNT;

const stats = [
  { value: String(TNP_CELL_COUNT), label: "T&P cells partnered", shortLabel: "T&P partners" },
  { value: String(IIT_COUNT), label: "IIT campuses", shortLabel: "IITs" },
  { value: String(NIT_COUNT), label: "NIT campuses", shortLabel: "NITs" },
  { value: "WhatsApp", label: "Mira for students", shortLabel: "Mira" },
];

const Hero = () => {
  const videoRef = useRef(null);

  const handleVideoLoad = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <Box
      as="section"
      bg={colors.surface}
      borderBottom="1px solid"
      borderColor={colors.border}
      minH={{ base: "auto", lg: "calc(100svh - 4rem)" }}
      display="flex"
      alignItems="center"
    >
      <LandingContainer py={{ base: 12, md: 16, lg: 18 }} w="full">
        <Flex align="center" justify="space-between" gap={{ base: 12, lg: 16 }} direction={{ base: "column", lg: "row" }}>
          <Box
            as={motion.div}
            flex={1}
            w="full"
            maxW={{ lg: "34rem" }}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <VStack align={{ base: "center", lg: "flex-start" }} textAlign={{ base: "center", lg: "left" }} spacing={{ base: 6, md: 8 }}>
              <motion.div variants={fadeUp}>
                <HeroEyebrow>IIT &amp; NIT talent platform</HeroEyebrow>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Heading
                  as="h1"
                  fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                  fontWeight="semibold"
                  letterSpacing="-0.03em"
                  lineHeight="1.1"
                  color={colors.text}
                >
                  India&apos;s largest curated pool of{" "}
                  <Text as="span" color={colors.brand}>
                    IIT &amp; NIT talent
                  </Text>
                </Heading>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Text fontSize={{ base: "lg", md: "xl" }} color={colors.textSecondary} lineHeight="1.75" maxW="34rem">
                  Students build rich profiles by chatting with <strong>Mira</strong> on WhatsApp. We verify skills and
                  experience, partner with <strong>{TNP_CELL_COUNT}</strong> campus T&amp;P ecosystems, and connect the
                  right people to internships and jobs.
                </Text>
              </motion.div>

              <motion.div variants={fadeUp}>
                <IncubatorTrustLine textAlign={{ base: "center", lg: "left" }} />
              </motion.div>

              <motion.div variants={fadeUp} style={{ width: "100%" }}>
                <VStack spacing={4} pt={4} w="full" align={{ base: "center", lg: "flex-start" }}>
                  <Flex direction={{ base: "column", sm: "row" }} gap={3} w={{ base: "full", sm: "auto" }}>
                    {WHATSAPP_HREF && (
                      <WhatsAppButton href={WHATSAPP_HREF} w={{ base: "full", sm: "auto" }}>
                        Chat with Mira
                      </WhatsAppButton>
                    )}
                    <PrimaryButton asRouter to="/hire" variant="outline" w={{ base: "full", sm: "auto" }}>
                      Hire talent
                    </PrimaryButton>
                  </Flex>
                  <GhostLink asRouter to="/auth">
                    Sign in to OpenWorld
                  </GhostLink>
                </VStack>
              </motion.div>
            </VStack>
          </Box>

          <Box
            as={motion.div}
            flex={1}
            w="full"
            maxW={{ lg: "520px" }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <Box borderRadius="2xl" overflow="hidden" border="1px solid" borderColor={colors.border} shadow="xl" bg={colors.surfaceDark}>
              <Box
                as="video"
                ref={videoRef}
                src={MIRA_VIDEO_SRC}
                autoPlay
                loop
                muted
                playsInline
                controls
                onLoadedData={handleVideoLoad}
                w="100%"
                objectFit="cover"
                sx={{ aspectRatio: "16/9", display: "block" }}
              >
                <source src={MIRA_VIDEO_SRC} type="video/mp4" />
              </Box>
            </Box>
          </Box>
        </Flex>
      </LandingContainer>
    </Box>
  );
};

const StatsStrip = () => (
  <Section bg={landingLayout.pageBg} compact>
    <LandingContainer>
      <ScrollStagger>
        <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={{ base: 4, md: 6 }}>
          {stats.map(({ value, label, shortLabel }, i) => {
            const StatIcon = statIcons[i] || Building2;
            return (
              <motion.div key={label} variants={fadeUp}>
                <VStack
                  spacing={2}
                  py={{ base: 6, md: 8 }}
                  px={4}
                  borderRadius="xl"
                  bg={colors.surface}
                  border="1px solid"
                  borderColor={colors.border}
                  align="center"
                  textAlign="center"
                >
                  <StatIcon size={20} strokeWidth={1.75} color={colors.textMuted} />
                  <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="semibold" color={colors.text} letterSpacing="-0.02em">
                    {value}
                  </Text>
                  <Text fontSize="sm" color={colors.textMuted} lineHeight="1.4">
                    <Box as="span" display={{ base: "inline", md: "none" }}>
                      {shortLabel}
                    </Box>
                    <Box as="span" display={{ base: "none", md: "inline" }}>
                      {label}
                    </Box>
                  </Text>
                </VStack>
              </motion.div>
            );
          })}
        </SimpleGrid>
      </ScrollStagger>
    </LandingContainer>
  </Section>
);

const PartnersSection = () => (
  <Section id="partners" bg={colors.surface}>
    <LandingContainer>
      <ScrollReveal>
        <Box borderRadius="2xl" bg={colors.surfaceDark} color={colors.textOnDark} px={{ base: 8, md: 12, lg: 14 }} py={{ base: 12, md: 16 }}>
          <Flex direction={{ base: "column", lg: "row" }} gap={{ base: 10, lg: 16 }} align="flex-start">
            <VStack align={{ base: "center", lg: "flex-start" }} textAlign={{ base: "center", lg: "left" }} spacing={5} flex={1}>
              <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.12em" textTransform="uppercase" color={colors.brandOnDark}>
                Campus partnerships
              </Text>
              <Heading as="h2" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="semibold" lineHeight="1.2" letterSpacing="-0.02em" color={colors.textOnDark}>
                T&amp;P cells at every IIT and NIT
              </Heading>
              <Text fontSize={{ base: "md", md: "lg" }} color={colors.textOnDarkSecondary} lineHeight="1.75" maxW="lg">
                Trusted outreach across {TNP_CELL_COUNT} campuses — {IIT_COUNT} IITs and {NIT_COUNT} NITs — aligned to
                placement calendars and batch context.
              </Text>
              <Box pt={2}>
                <PrimaryButton href={COMPANY_CONTACT_MAIL} variant="light">
                  Talk to partnerships
                </PrimaryButton>
              </Box>
            </VStack>
            <SimpleGrid columns={2} spacing={4} flex={1} w="full" maxW="md">
              {[
                { n: IIT_COUNT, l: "IIT T&P ecosystems" },
                { n: NIT_COUNT, l: "NIT T&P ecosystems" },
              ].map(({ n, l }, i) => (
                <motion.div
                  key={l}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={scrollViewport}
                  transition={{ delay: i * 0.1, duration: 0.45 }}
                >
                  <Box p={6} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.200" bg="whiteAlpha.50" h="full">
                    <Text fontSize="3xl" fontWeight="semibold" letterSpacing="-0.02em">
                      {n}
                    </Text>
                    <Text fontSize="sm" color={colors.textOnDarkMuted} mt={2}>
                      {l}
                    </Text>
                  </Box>
                </motion.div>
              ))}
            </SimpleGrid>
          </Flex>
        </Box>
      </ScrollReveal>
    </LandingContainer>
  </Section>
);

const MiraFeaturesSection = () => {
  const features = [
    {
      title: "WhatsApp-first",
      body: "Natural chat on the channel students already use — no heavy forms on day one.",
      icon: MessageCircle,
    },
    {
      title: "Conversational profile",
      body: "Structured data plus a readable story recruiters and T&P teams can scan in seconds.",
      icon: Sparkles,
    },
    {
      title: "Verified signal",
      body: "Skills and projects captured in conversation, aligned with campus and role context.",
      icon: ShieldCheck,
    },
    {
      title: "Smart matching",
      body: "When a role fits, Mira notifies the right students on WhatsApp — with consent.",
      icon: Target,
    },
  ];

  return (
    <Section bg={landingLayout.pageBg}>
      <LandingContainer>
        <SectionHeader
          eyebrow="Product"
          title="Mira on WhatsApp"
          lead="An AI agent for IIT and NIT students. Profiles stay current because they are built through conversation."
        />
        <ScrollStagger>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6}>
            {features.map(({ title, body, icon: FeatureIcon }) => (
              <motion.div key={title} variants={fadeUp}>
                <Box
                  h="full"
                  p={8}
                  borderRadius="xl"
                  bg={colors.surface}
                  border="1px solid"
                  borderColor={colors.border}
                  transition="border-color 0.2s, box-shadow 0.2s"
                  _hover={{ borderColor: colors.brandBorder, shadow: "md" }}
                >
                  <Flex w={10} h={10} borderRadius="lg" bg={colors.brandSubtle} color={colors.brand} align="center" justify="center" mb={5}>
                    <FeatureIcon size={20} strokeWidth={1.75} />
                  </Flex>
                  <Heading as="h3" size="sm" fontWeight="semibold" color={colors.text} mb={2}>
                    {title}
                  </Heading>
                  <Text color={colors.textSecondary} fontSize="sm" lineHeight="1.7">
                    {body}
                  </Text>
                </Box>
              </motion.div>
            ))}
          </SimpleGrid>
        </ScrollStagger>
      </LandingContainer>
    </Section>
  );
};

const howItWorksSteps = [
  {
    step: "01",
    title: "Chat with Mira",
    body: "On WhatsApp, share college, skills, projects, and the roles you want.",
    icon: MessageCircle,
  },
  {
    step: "02",
    title: "Build & verify",
    body: "Mira structures your profile and strengthens verification with campus context where available.",
    icon: ShieldCheck,
  },
  {
    step: "03",
    title: "Get matched",
    body: "Roles flow through OpenWorldX and T&P channels. Mira notifies you when something fits.",
    icon: Briefcase,
  },
];

const HowItWorksSection = () => (
  <Section id="how-it-works" bg={landingLayout.pageBg}>
    <LandingContainer>
      <SectionHeader eyebrow="Process" title="How it works" lead="Simple for students. Clear for hiring teams." />
      <ScrollStagger>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {howItWorksSteps.map(({ step, title, body, icon: StepIcon }) => (
            <motion.div key={step} variants={fadeUp}>
              <Box p={8} h="full" borderRadius="xl" bg={colors.surface} border="1px solid" borderColor={colors.border}>
                <HStack justify="space-between" mb={6}>
                  <Text fontSize="xs" fontWeight="semibold" color={colors.brand} letterSpacing="0.1em">
                    STEP {step}
                  </Text>
                  <StepIcon size={18} color={colors.textMuted} strokeWidth={1.75} />
                </HStack>
                <Heading as="h3" size="md" fontWeight="semibold" mb={3} color={colors.text}>
                  {title}
                </Heading>
                <Text color={colors.textSecondary} fontSize="sm" lineHeight="1.75">
                  {body}
                </Text>
              </Box>
            </motion.div>
          ))}
        </SimpleGrid>
      </ScrollStagger>
    </LandingContainer>
  </Section>
);

const faqs = [
  {
    question: "What is OpenWorldX?",
    answer:
      "An AI-powered talent platform for IIT and NIT campuses. Students build job-ready profiles with Mira on WhatsApp; companies and T&P teams use those profiles to hire and place talent.",
  },
  {
    question: "Which T&P cells do you partner with?",
    answer: `Training & Placement cells across all ${IIT_COUNT} IITs and ${NIT_COUNT} NITs — ${TNP_CELL_COUNT} campus ecosystems — plus hiring partners on OpenWorldX.`,
  },
  {
    question: "Who is Mira?",
    answer:
      "Your AI career companion on WhatsApp. She learns your skills, projects, and goals over time and keeps your profile updated through conversation.",
  },
  {
    question: "How do students get opportunities?",
    answer:
      "Roles are shared on OpenWorldX and through your college T&P cell when applicable. When a job fits, Mira can notify you on WhatsApp with your consent.",
  },
  {
    question: "How can companies or T&P offices work with us?",
    answer:
      "Email us to post roles, run campus campaigns, or pilot a partnership. We help you reach the right batches with structured profiles.",
  },
  {
    question: "Is it free for students?",
    answer: "Yes. Chatting with Mira and building your profile is free for students.",
  },
];

const FAQ = () => (
  <Section id="faq" bg={colors.surface}>
    <LandingContainer maxW="3xl">
      <SectionHeader eyebrow="FAQ" title="Common questions" lead="For students, companies, and campus partners." mb={{ base: 8, md: 10 }} />
      <ScrollStagger>
        <Accordion allowToggle>
          {faqs.map((faq, index) => (
            <motion.div key={index} variants={fadeUp}>
          <AccordionItem
            border="none"
            borderBottom="1px solid"
            borderColor={colors.border}
            py={2}
            _last={{ borderBottom: "none" }}
          >
            <AccordionButton py={5} px={0} _hover={{ bg: "transparent" }}>
              <Box flex="1" textAlign="left" fontWeight="medium" color={colors.text} fontSize={{ base: "md", md: "lg" }}>
                {faq.question}
              </Box>
              <AccordionIcon color={colors.textMuted} />
            </AccordionButton>
            <AccordionPanel px={0} pb={5} color={colors.textSecondary} lineHeight="1.75" fontSize="md">
              {faq.answer}
            </AccordionPanel>
          </AccordionItem>
            </motion.div>
        ))}
        </Accordion>
      </ScrollStagger>
    </LandingContainer>
  </Section>
);

const CallToAction = () => (
  <Section bg={landingLayout.pageBg}>
    <LandingContainer maxW="5xl">
      <VStack spacing={10} w="full">
        <SectionHeader
          eyebrow="Get started"
          title="Pick your path"
          lead="Students and hiring teams use the same platform — different entry points."
          mb={0}
        />
        <ScrollStagger>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
          <motion.div variants={fadeUp}>
            <VStack
              align="stretch"
              spacing={6}
              p={{ base: 8, md: 10 }}
              borderRadius="2xl"
              bg={colors.surface}
              border="1px solid"
              borderColor={colors.border}
              textAlign="left"
              h="full"
            >
              <Box>
                <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.12em" textTransform="uppercase" color={colors.whatsapp}>
                  Students
                </Text>
                <Heading as="h3" size="md" mt={2} fontWeight="semibold" color={colors.text}>
                  Meet Mira on WhatsApp
                </Heading>
                <Text color={colors.textSecondary} mt={3} fontSize="sm" lineHeight="1.75">
                  Start a conversation and build your profile in minutes.
                </Text>
              </Box>
              {WHATSAPP_HREF && <WhatsAppButton href={WHATSAPP_HREF}>Chat with Mira</WhatsAppButton>}
            </VStack>
          </motion.div>
          <motion.div variants={fadeUp}>
            <VStack
              align="stretch"
              spacing={6}
              p={{ base: 8, md: 10 }}
              borderRadius="2xl"
              bg={colors.surfaceDark}
              color={colors.textOnDark}
              textAlign="left"
              h="full"
            >
              <Box>
                <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.12em" textTransform="uppercase" color={colors.brandOnDark}>
                  Companies &amp; T&amp;P
                </Text>
                <Heading as="h3" size="md" mt={2} fontWeight="semibold" color={colors.textOnDark}>
                  Hire or partner
                </Heading>
                <Text color={colors.textOnDarkSecondary} mt={3} fontSize="sm" lineHeight="1.75">
                  Post roles and access matched IIT + NIT talent.
                </Text>
              </Box>
              <PrimaryButton asRouter to="/hire" variant="light">
                Find matched talent
              </PrimaryButton>
            </VStack>
          </motion.div>
        </SimpleGrid>
        </ScrollStagger>
      </VStack>
    </LandingContainer>
  </Section>
);

const Footer = () => (
  <Box as="footer" bg={colors.surfaceDark} color={colors.textOnDarkMuted} py={{ base: 14, md: 18 }}>
    <LandingContainer>
      <VStack spacing={10} align="stretch">
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" gap={10} align={{ base: "center", md: "flex-start" }}>
          <VStack align={{ base: "center", md: "flex-start" }} spacing={3} maxW="sm" textAlign={{ base: "center", md: "left" }}>
            <Heading as="p" size="lg" color={colors.textOnDark} fontWeight="semibold">
              OpenWorldX
            </Heading>
            <Text fontSize="sm" lineHeight="1.75" color={colors.textOnDarkSecondary}>
              IIT + NIT talent platform — conversational profiles, campus T&amp;P partnerships, hiring for teams that
              need signal, not noise.
            </Text>
            <IncubatorTrustLine size="sm" textAlign={{ base: "center", md: "left" }} />
          </VStack>
          <Flex flexWrap="wrap" justify={{ base: "center", md: "flex-end" }} gap={{ base: 4, md: 8 }} fontSize="sm">
            {[
              ["#students", "Students"],
              ["#companies", "Companies"],
              ["#audience", "Who it's for"],
              ["#partners", "T&P network"],
              ["#how-it-works", "How it works"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <Link key={href} href={href} color={colors.textOnDarkMuted} _hover={{ color: colors.textOnDark }}>
                {label}
              </Link>
            ))}
            <Link href={COMPANY_CONTACT_MAIL} color={colors.textOnDarkMuted} _hover={{ color: colors.textOnDark }}>
              Contact
            </Link>
          </Flex>
        </Flex>
        <Divider borderColor="whiteAlpha.200" />
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="center" gap={6}>
          <HStack spacing={3}>
            <SocialIconLink href="https://www.linkedin.com/company/harinath-mechtech-innovations-private-limited/" label="LinkedIn">
              <Image src="/social-linkedin.svg" alt="" w={5} h={5} filter="invert(1)" opacity={0.7} />
            </SocialIconLink>
            <SocialIconLink href="https://www.youtube.com/@Openworldtradetime" label="YouTube">
              <Image src="/social-youtube.svg" alt="" w={5} h={5} filter="invert(1)" opacity={0.7} />
            </SocialIconLink>
            <SocialIconLink href="https://www.instagram.com/akhileshh.7" label="Instagram">
              <Image src="/social-insta.svg" alt="" w={5} h={5} filter="invert(1)" opacity={0.7} />
            </SocialIconLink>
          </HStack>
          <Text fontSize="xs" color={colors.textOnDarkMuted} textAlign="center">
            © {new Date().getFullYear()} {COMPANY_LEGAL_NAME}
          </Text>
        </Flex>
      </VStack>
    </LandingContainer>
  </Box>
);

const LandingPage = () => (
  <Box w="100%" minH="100vh" bg={landingLayout.pageBg} overflowX="hidden">
    <LandingHeader />
    <Hero />
    <StatsStrip />
    <StudentExperienceShowcase />
    <PartnersSection />
    <MiraFeaturesSection />
    <AudienceSection whatsappHref={WHATSAPP_HREF} mailHref={COMPANY_CONTACT_MAIL} />
    <HowItWorksSection />
    <FAQ />
    <CallToAction />
    <Footer />
  </Box>
);

export default LandingPage;
