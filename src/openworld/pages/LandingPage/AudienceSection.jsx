import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Flex, Heading, Text, VStack, SimpleGrid, HStack } from "@chakra-ui/react";
import { GraduationCap, Building2, Check } from "lucide-react";
import {
  Section,
  SectionHeader,
  LandingContainer,
  landingLayout,
  colors,
  fadeUp,
  staggerContainer,
  ScrollStagger,
  scrollViewport,
  WhatsAppButton,
  PrimaryButton,
  GhostLink,
} from "./landingUi";

const panels = [
  {
    id: "students",
    tab: "Students",
    icon: GraduationCap,
    accent: "blue",
    title: "IIT, NIT & campus talent",
    subtitle: "Build a job-ready profile through conversation — not another PDF upload.",
    bullets: [
      "Chat with Mira on WhatsApp; your profile grows with every message.",
      "Skills, projects, and goals in one narrative recruiters read.",
      "Verified signal employers and T&P teams can trust.",
      "Opportunities from campus partners and hiring on OpenWorldX.",
    ],
    cta: "whatsapp",
    ctaLabel: "Start with Mira",
  },
  {
    id: "companies",
    tab: "Companies & T&P",
    icon: Building2,
    accent: "slate",
    title: "Hire with context",
    subtitle: "Shortlists from rich profiles — not keyword guesses on resumes.",
    bullets: [
      "Post roles aligned to campus placement calendars.",
      "AI-assisted shortlists by skills, batch, and fit.",
      "Partner with T&P offices for trusted outreach.",
      "Spend time interviewing matches, not filtering noise.",
    ],
    cta: "hire",
    ctaLabel: "Find matched talent",
  },
];

const accentStyles = {
  blue: {
    iconBg: colors.brandSubtle,
    iconColor: colors.brand,
    border: colors.brandBorder,
    glow: "rgba(37, 99, 235, 0.07)",
    ring: colors.brandBorder,
  },
  slate: {
    iconBg: colors.surfaceMuted,
    iconColor: colors.textSecondary,
    border: colors.borderStrong,
    glow: "rgba(15, 23, 42, 0.05)",
    ring: colors.border,
  },
};

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const AudiencePanel = ({ panel, whatsappHref, mailHref, isActive }) => {
  const styles = accentStyles[panel.accent];
  const Icon = panel.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: isActive ? 1 : 0.92, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ height: "100%" }}
    >
      <Box
        id={panel.id}
        h="full"
        p={{ base: 8, md: 10, lg: 12 }}
        borderRadius="2xl"
        bg={colors.surface}
        border="1px solid"
        borderColor={isActive ? styles.border : colors.border}
        boxShadow={isActive ? "0 24px 48px -12px rgba(15, 23, 42, 0.12)" : "0 4px 24px -8px rgba(15, 23, 42, 0.06)"}
        position="relative"
        overflow="hidden"
        transition="border-color 0.3s, box-shadow 0.3s"
        _hover={{ borderColor: styles.border }}
      >
        <Box
          position="absolute"
          top={0}
          right={0}
          w="240px"
          h="240px"
          borderRadius="full"
          bg={styles.glow}
          filter="blur(40px)"
          transform="translate(30%, -30%)"
          pointerEvents="none"
        />

        <VStack align="stretch" spacing={8} position="relative">
          <HStack spacing={4} align="flex-start">
            <Flex
              w={14}
              h={14}
              borderRadius="2xl"
              bg={styles.iconBg}
              align="center"
              justify="center"
              flexShrink={0}
              border="1px solid"
              borderColor={styles.ring}
            >
              <Icon size={26} color={styles.iconColor} strokeWidth={1.75} />
            </Flex>
            <Box pt={1}>
              <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.12em" textTransform="uppercase" color={colors.textMuted} mb={1}>
                {panel.tab}
              </Text>
              <Heading as="h3" size="lg" fontWeight="semibold" letterSpacing="-0.02em" color={colors.text}>
                {panel.title}
              </Heading>
            </Box>
          </HStack>

          <Text color={colors.textSecondary} fontSize={{ base: "md", md: "lg" }} lineHeight="1.75" maxW="md">
            {panel.subtitle}
          </Text>

          <motion.div variants={listVariants} initial="hidden" whileInView="visible" viewport={scrollViewport}>
            <VStack align="stretch" spacing={4}>
              {panel.bullets.map((line) => (
                <motion.div key={line} variants={listItemVariants}>
                  <HStack align="flex-start" spacing={3}>
                    <Flex
                      mt={0.5}
                      w={5}
                      h={5}
                      borderRadius="full"
                      bg={styles.iconBg}
                      align="center"
                      justify="center"
                      flexShrink={0}
                    >
                      <Check size={12} color={styles.iconColor} strokeWidth={3} />
                    </Flex>
                    <Text fontSize="sm" color={colors.textSecondary} lineHeight="1.65">
                      {line}
                    </Text>
                  </HStack>
                </motion.div>
              ))}
            </VStack>
          </motion.div>

          <Box pt={2}>
            {panel.cta === "whatsapp" && whatsappHref ? (
              <WhatsAppButton href={whatsappHref} w={{ base: "full", sm: "auto" }}>
                {panel.ctaLabel}
              </WhatsAppButton>
            ) : panel.cta === "hire" ? (
              <PrimaryButton asRouter to="/hire" w={{ base: "full", sm: "auto" }}>
                {panel.ctaLabel}
              </PrimaryButton>
            ) : (
              <PrimaryButton href={mailHref} w={{ base: "full", sm: "auto" }}>
                {panel.ctaLabel}
              </PrimaryButton>
            )}
          </Box>
        </VStack>
      </Box>
    </motion.div>
  );
};

const AudienceSection = ({ whatsappHref, mailHref }) => {
  const [activeTab, setActiveTab] = useState("students");

  return (
    <Section bg={landingLayout.pageBg} id="audience">
      <LandingContainer>
        <SectionHeader
          eyebrow="Who it's for"
          title="Built for students and hiring teams"
          lead="Two paths on one platform — conversational profiles on campus, clear signal for recruiters and T&P cells."
        />

        <Flex display={{ base: "flex", lg: "none" }} justify="center" mb={8}>
          <HStack p={1} bg={colors.surface} borderRadius="full" border="1px solid" borderColor={colors.border} spacing={0}>
            {panels.map((panel) => (
              <Box
                key={panel.id}
                as="button"
                type="button"
                px={5}
                py={2.5}
                borderRadius="full"
                fontSize="sm"
                fontWeight="semibold"
                bg={activeTab === panel.id ? colors.brand : "transparent"}
                color={activeTab === panel.id ? "white" : colors.textSecondary}
                onClick={() => setActiveTab(panel.id)}
                transition="all 0.25s"
              >
                {panel.tab}
              </Box>
            ))}
          </HStack>
        </Flex>

        <Box display={{ base: "block", lg: "none" }}>
          <AnimatePresence mode="wait">
            <AudiencePanel
              key={activeTab}
              panel={panels.find((p) => p.id === activeTab)}
              whatsappHref={whatsappHref}
              mailHref={mailHref}
              isActive
            />
          </AnimatePresence>
        </Box>

        <ScrollStagger>
          <SimpleGrid display={{ base: "none", lg: "grid" }} columns={2} spacing={8}>
            {panels.map((panel) => (
              <motion.div key={panel.id} variants={fadeUp}>
                <AudiencePanel panel={panel} whatsappHref={whatsappHref} mailHref={mailHref} isActive />
              </motion.div>
            ))}
          </SimpleGrid>
        </ScrollStagger>

        <Flex justify="center" mt={10} display={{ base: "none", lg: "flex" }}>
          <GhostLink href="#how-it-works">See how it works</GhostLink>
        </Flex>
      </LandingContainer>
    </Section>
  );
};

export default AudienceSection;
