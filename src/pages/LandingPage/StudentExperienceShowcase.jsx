import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Flex, VStack, HStack, Text, Progress } from "@chakra-ui/react";
import { Sparkles, ShieldCheck, UserRound } from "lucide-react";
import { Section, SectionHeader, LandingContainer, ScrollStagger, fadeUp, colors } from "./landingUi";

const CHAT_STEPS = [
  { role: "mira", text: "Hi! I'm Mira. Which IIT or NIT are you from?" },
  { role: "user", text: "IIT Delhi — Mechanical, final year." },
  { role: "mira", text: "What skills and projects should recruiters see first?" },
  { role: "user", text: "SolidWorks, FEA, and a solar vehicle team lead role." },
  { role: "mira", text: "Got it — updating your conversational profile." },
];

const PROFILE_FIELDS = [
  { key: "college", label: "Campus", value: "IIT Delhi · Mech", at: 1 },
  { key: "skills", label: "Skills", value: "CAD · FEA · Team lead", at: 3 },
  { key: "story", label: "In conversation", value: "Solar vehicle project lead, internship-ready.", at: 4 },
  { key: "verified", label: "Verification", value: "Skills & experience captured via chat", at: 5 },
];

const bubbleVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 30 } },
};

const WhatsAppPhoneMock = ({ stepIndex, messages }) => (
  <Box
    borderRadius="xl"
    overflow="hidden"
    border="1px solid"
    borderColor={colors.border}
    bg="#F0F2F5"
    shadow="lg"
    maxW="sm"
    mx="auto"
    w="full"
  >
    <Flex bg="#075E54" px={4} py={3.5} align="center" gap={3}>
      <Flex w={9} h={9} borderRadius="full" bg="whiteAlpha.300" align="center" justify="center">
        <Sparkles size={16} color="white" />
      </Flex>
      <Box flex={1}>
        <Text color="white" fontWeight="semibold" fontSize="sm">
          Mira
        </Text>
        <Text color="whiteAlpha.800" fontSize="xs">
          OpenWorldX
        </Text>
      </Box>
    </Flex>
    <VStack align="stretch" spacing={3} px={4} py={5} minH="260px" bg="#ECE5DD">
      <AnimatePresence mode="popLayout">
        {messages.map((msg, i) => (
          <motion.div key={`${stepIndex}-${i}-${msg.text.slice(0, 8)}`} variants={bubbleVariants} initial="hidden" animate="visible" layout>
            <Flex justify={msg.role === "user" ? "flex-end" : "flex-start"}>
              <Box
                maxW="88%"
                px={3}
                py={2}
                borderRadius="lg"
                bg={msg.role === "user" ? "#DCF8C6" : "white"}
                fontSize="sm"
                color="gray.800"
                lineHeight="1.55"
                shadow="sm"
              >
                {msg.text}
              </Box>
            </Flex>
          </motion.div>
        ))}
      </AnimatePresence>
    </VStack>
  </Box>
);

const ConversationalProfileMock = ({ progressStep }) => {
  const completeness = Math.min(100, Math.round((progressStep / CHAT_STEPS.length) * 100));

  return (
    <Box borderRadius="xl" border="1px solid" borderColor={colors.border} bg={colors.surface} shadow="lg" maxW="md" mx="auto" w="full" overflow="hidden">
      <Box px={6} py={5} borderBottom="1px solid" borderColor={colors.border}>
        <HStack spacing={3}>
          <Flex w={10} h={10} borderRadius="lg" bg={colors.brandSubtle} align="center" justify="center">
            <UserRound size={20} color={colors.brand} />
          </Flex>
          <Box flex={1}>
            <Text fontWeight="semibold" color={colors.text} fontSize="sm">
              Conversational profile
            </Text>
            <Text color={colors.textMuted} fontSize="xs">
              Built with Mira on WhatsApp
            </Text>
          </Box>
        </HStack>
        <Box mt={4}>
          <Flex justify="space-between" mb={1.5}>
            <Text fontSize="xs" color={colors.textMuted}>
              Completeness
            </Text>
            <Text fontSize="xs" fontWeight="semibold" color={colors.textSecondary}>
              {completeness}%
            </Text>
          </Flex>
          <Progress value={completeness} size="xs" borderRadius="full" sx={{ "& > div": { bg: colors.brand } }} bg={colors.surfaceMuted} />
        </Box>
      </Box>
      <VStack align="stretch" spacing={3} p={6}>
        {PROFILE_FIELDS.map((field) => {
          const visible = progressStep >= field.at;
          return (
            <AnimatePresence key={field.key}>
              {visible && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                  <Box p={4} borderRadius="lg" border="1px solid" borderColor={colors.border} bg={colors.surfaceMuted}>
                    <Text fontSize="xs" fontWeight="semibold" color={colors.textMuted} textTransform="uppercase" letterSpacing="0.08em">
                      {field.label}
                    </Text>
                    <HStack mt={2} spacing={2}>
                      {field.key === "verified" && <ShieldCheck size={16} color={colors.whatsapp} />}
                      <Text fontSize="sm" color={colors.textSecondary} lineHeight="1.5">
                        {field.value}
                      </Text>
                    </HStack>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}
      </VStack>
    </Box>
  );
};

const StudentExperienceShowcase = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => {
      setStep((s) => (s >= CHAT_STEPS.length ? 0 : s + 1));
    }, 2200);
    return () => clearInterval(tick);
  }, []);

  const visibleMessages = CHAT_STEPS.slice(0, step);

  return (
    <Section id="experience" bg={colors.surface}>
      <LandingContainer>
        <SectionHeader
          eyebrow="See it in action"
          title="From WhatsApp chat to profile"
          lead="A short conversation with Mira becomes a structured, verified narrative recruiters and T&P teams can use."
        />
        <ScrollStagger>
          <Flex direction={{ base: "column", lg: "row" }} gap={{ base: 8, lg: 10 }} align="stretch" justify="center">
            <motion.div variants={fadeUp} style={{ flex: 1 }}>
              <WhatsAppPhoneMock stepIndex={step} messages={visibleMessages} />
            </motion.div>
            <motion.div variants={fadeUp} style={{ flex: 1 }}>
              <ConversationalProfileMock progressStep={step} />
            </motion.div>
          </Flex>
        </ScrollStagger>
      </LandingContainer>
    </Section>
  );
};

export default StudentExperienceShowcase;
