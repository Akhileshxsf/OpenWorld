import { motion } from "framer-motion";
import { Button, HStack, Text, Flex, Box, IconButton, Link, VStack, Heading, Container } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { Building2, GraduationCap, Landmark, MessageCircle, ArrowRight } from "lucide-react";

/**
 * OpenWorldX landing palette — slate neutrals + one brand blue + semantic WhatsApp green.
 * WCAG-friendly pairs on white and on dark surfaces.
 */
export const colors = {
  page: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceMuted: "#F1F5F9",
  surfaceDark: "#0F172A",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#64748B",
  textSubtle: "#94A3B8",
  textOnDark: "#F8FAFC",
  textOnDarkSecondary: "#CBD5E1",
  textOnDarkMuted: "#94A3B8",
  brand: "#2563EB",
  brandHover: "#1D4ED8",
  brandActive: "#1E40AF",
  brandSubtle: "#EFF6FF",
  brandBorder: "#BFDBFE",
  brandOnDark: "#93C5FD",
  whatsapp: "#059669",
  whatsappHover: "#047857",
  whatsappSubtle: "#ECFDF5",
};

export const landingLayout = {
  pageBg: colors.page,
  /** Vertical rhythm — not full-viewport blocks (avoids awkward scroll jumps) */
  sectionPy: { base: 14, md: 18, lg: 22 },
  sectionPyCompact: { base: 10, md: 12 },
  containerPx: { base: 5, md: 8, lg: 10 },
  maxWidth: "7xl",
  proseMaxW: "2xl",
  headerHeight: { base: "3.5rem", md: "4rem" },
};

/** When ~25% of section enters viewport, reveal (feels natural while scrolling) */
export const scrollViewport = {
  once: true,
  amount: 0.22,
  margin: "0px 0px -8% 0px",
};

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.55, ease: "easeOut" } },
};

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.06 } },
};

export const ScrollStagger = ({ children, className, style }) => (
  <motion.div
    className={className}
    style={style}
    variants={staggerContainer}
    initial="hidden"
    whileInView="visible"
    viewport={scrollViewport}
  >
    {children}
  </motion.div>
);

export const ScrollReveal = ({ children, delay = 0, y = 28 }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={scrollViewport}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

export const statIcons = [Building2, GraduationCap, Landmark, MessageCircle];

const MotionButton = motion(Button);

export const LandingContainer = ({ children, maxW = landingLayout.maxWidth, ...props }) => (
  <Container maxW={maxW} w="full" mx="auto" px={landingLayout.containerPx} {...props}>
    {children}
  </Container>
);

export const Section = ({ id, bg = "transparent", children, compact = false, ...props }) => (
  <Box
    as="section"
    id={id}
    py={compact ? landingLayout.sectionPyCompact : landingLayout.sectionPy}
    bg={bg}
    overflow="hidden"
    w="full"
    {...props}
  >
    {children}
  </Box>
);

export const SectionHeader = ({ eyebrow, title, lead, align = "center", mb = { base: 8, md: 12 } }) => (
  <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={scrollViewport}>
    <VStack
      spacing={4}
      textAlign={align}
      mb={mb}
      maxW={landingLayout.proseMaxW}
      mx={align === "center" ? "auto" : undefined}
      align={align === "center" ? "center" : "flex-start"}
    >
      {eyebrow && (
        <motion.div variants={fadeUp}>
          <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.12em" textTransform="uppercase" color={colors.brand}>
            {eyebrow}
          </Text>
        </motion.div>
      )}
      <motion.div variants={fadeUp}>
        <Heading
          as="h2"
          fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
          fontWeight="semibold"
          letterSpacing="-0.025em"
          color={colors.text}
          lineHeight="1.15"
        >
          {title}
        </Heading>
      </motion.div>
      {lead && (
        <motion.div variants={fadeUp}>
          <Text fontSize={{ base: "md", md: "lg" }} color={colors.textSecondary} lineHeight="1.75">
            {lead}
          </Text>
        </motion.div>
      )}
    </VStack>
  </motion.div>
);

export const IncubatorTrustLine = ({ size = "sm", textAlign = "left" }) => (
  <Text fontSize={size === "sm" ? "sm" : "md"} color={colors.textMuted} textAlign={textAlign} lineHeight="1.6">
    Incubated at{" "}
    <Text as="span" color={colors.textSecondary} fontWeight="semibold">
      Atal Incubation Centre, IIT Delhi
    </Text>
  </Text>
);

export const HeroEyebrow = ({ children }) => (
  <Text fontSize="xs" fontWeight="semibold" letterSpacing="0.12em" textTransform="uppercase" color={colors.brand}>
    {children}
  </Text>
);

const buttonBase = {
  h: "auto",
  minH: 11,
  px: 5,
  py: 2.5,
  borderRadius: "full",
  fontWeight: "semibold",
  fontSize: "sm",
  letterSpacing: "-0.01em",
};

export const WhatsAppButton = ({ href, children, size = "lg", w, flex }) => (
  <MotionButton
    as="a"
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    size={size}
    w={w}
    flex={flex}
    {...buttonBase}
    bg={colors.whatsapp}
    color="white"
    shadow="0 1px 2px rgba(5, 150, 105, 0.2)"
    _hover={{ bg: colors.whatsappHover, shadow: "0 4px 12px rgba(5, 150, 105, 0.25)" }}
    _active={{ bg: "#065F46" }}
    whileTap={{ scale: 0.98 }}
  >
    <HStack spacing={2} justify="center">
      <MessageCircle size={17} strokeWidth={2} />
      <span>{children}</span>
    </HStack>
  </MotionButton>
);

export const PrimaryButton = ({ href, children, asRouter, to, size = "lg", w, flex, variant = "solid" }) => {
  const isOutline = variant === "outline";
  const isLight = variant === "light";
  const props = asRouter ? { as: RouterLink, to } : { as: "a", href };

  let bg = colors.brand;
  let color = "white";
  let borderColor;
  let shadow = "0 1px 2px rgba(37, 99, 235, 0.2)";
  let hoverBg = colors.brandHover;
  let hoverBorder;
  let showArrow = true;

  if (isOutline) {
    bg = colors.surface;
    color = colors.textSecondary;
    borderColor = colors.borderStrong;
    shadow = "none";
    hoverBg = colors.surfaceMuted;
    hoverBorder = colors.textMuted;
    showArrow = false;
  } else if (isLight) {
    bg = colors.surface;
    color = colors.brand;
    shadow = "0 1px 2px rgba(15, 23, 42, 0.06)";
    hoverBg = colors.brandSubtle;
    showArrow = true;
  }

  return (
    <MotionButton
      {...props}
      size={size}
      w={w}
      flex={flex}
      {...buttonBase}
      bg={bg}
      color={color}
      variant={isOutline ? "outline" : "solid"}
      borderColor={borderColor}
      borderWidth={isOutline ? "1px" : undefined}
      shadow={shadow}
      _hover={{
        bg: hoverBg,
        borderColor: hoverBorder ?? borderColor,
        color: isLight ? colors.brandHover : color,
        shadow: isOutline ? "none" : "0 4px 12px rgba(37, 99, 235, 0.22)",
      }}
      _active={{ bg: isLight ? colors.brandBorder : colors.brandActive }}
      whileTap={{ scale: 0.98 }}
    >
      <HStack spacing={2} justify="center">
        <span>{children}</span>
        {showArrow && <ArrowRight size={17} strokeWidth={2} />}
      </HStack>
    </MotionButton>
  );
};

export const GhostLink = ({ href, children, asRouter, to }) => {
  const props = asRouter ? { as: RouterLink, to } : { as: "a", href };
  return (
    <MotionButton
      {...props}
      variant="ghost"
      {...buttonBase}
      minH={10}
      px={3}
      color={colors.brand}
      fontWeight="semibold"
      _hover={{ color: colors.brandHover, bg: colors.brandSubtle }}
      whileTap={{ scale: 0.98 }}
    >
      <HStack spacing={1.5}>
        <span>{children}</span>
        <ArrowRight size={16} color="currentColor" />
      </HStack>
    </MotionButton>
  );
};

export const HeaderSignInButton = ({ to = "/auth", w }) => (
  <MotionButton
    as={RouterLink}
    to={to}
    variant="outline"
    size="sm"
    w={w}
    h={9}
    px={4}
    borderRadius="full"
    borderColor={colors.borderStrong}
    color={colors.textSecondary}
    fontWeight="semibold"
    fontSize="sm"
    bg={colors.surface}
    _hover={{ bg: colors.surfaceMuted, borderColor: colors.textMuted, color: colors.text }}
    whileTap={{ scale: 0.98 }}
  >
    Sign in
  </MotionButton>
);

export const HeaderCtaButton = ({ href = "#students", w }) => (
  <MotionButton
    as="a"
    href={href}
    size="sm"
    w={w}
    h={9}
    px={5}
    borderRadius="full"
    bg={colors.brand}
    color="white"
    fontWeight="semibold"
    fontSize="sm"
    shadow="0 1px 2px rgba(37, 99, 235, 0.25)"
    _hover={{ bg: colors.brandHover }}
    _active={{ bg: colors.brandActive }}
    whileTap={{ scale: 0.98 }}
  >
    Get started
  </MotionButton>
);

export const SocialIconLink = ({ href, label, children }) => (
  <IconButton
    as={Link}
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    icon={children}
    variant="ghost"
    color={colors.textOnDarkMuted}
    borderRadius="lg"
    _hover={{ color: colors.textOnDark, bg: "whiteAlpha.100" }}
    transition="all 0.2s"
    size="md"
  />
);
