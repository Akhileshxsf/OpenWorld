import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Flex,
  HStack,
  VStack,
  Link,
  Image,
  Text,
  Container,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  useDisclosure,
} from "@chakra-ui/react";
import { Menu, X } from "lucide-react";
import { HeaderSignInButton, HeaderCtaButton, colors } from "./landingUi";

const NAV_LINKS = [
  { href: "#experience", label: "Demo" },
  { href: "#audience", label: "Who it's for" },
  { href: "#partners", label: "T&P network" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

const NavLink = ({ href, label, onClick, ...props }) => (
  <Link
    href={href}
    onClick={onClick}
    fontSize="sm"
    fontWeight="medium"
    color={colors.textSecondary}
    whiteSpace="nowrap"
    px={3}
    py={2}
    borderRadius="full"
    _hover={{ color: colors.brand, bg: colors.brandSubtle, textDecoration: "none" }}
    {...props}
  >
    {label}
  </Link>
);

const LandingHeader = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const closeAndNavigate = () => onClose();

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={30}
      bg="rgba(255,255,255,0.94)"
      backdropFilter="blur(12px)"
      borderBottom="1px solid"
      borderColor={colors.border}
    >
      <Container maxW="7xl" px={{ base: 5, md: 10, lg: 12 }} h={{ base: 14, md: 16 }}>
        <Flex align="center" justify="space-between" h="full" gap={4} minW={0}>
          <Flex align="center" gap={2.5} as={RouterLink} to="/" flexShrink={0} _hover={{ textDecoration: "none" }}>
            <Image src="/logohero.jpeg" alt="OpenWorldX" w={9} h={9} objectFit="contain" borderRadius="lg" />
            <Box display={{ base: "none", sm: "block" }}>
              <Text fontWeight="semibold" color={colors.text} fontSize="md" lineHeight="1.2">
                OpenWorldX
              </Text>
              <Text fontSize="10px" color={colors.textMuted} display={{ base: "none", md: "block" }}>
                AIC IIT Delhi
              </Text>
            </Box>
          </Flex>

          <HStack as="nav" aria-label="Main" spacing={0} display={{ base: "none", xl: "flex" }} flex={1} justify="center">
            {NAV_LINKS.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </HStack>

          <HStack spacing={2} flexShrink={0} display={{ base: "none", md: "flex" }}>
            <HeaderSignInButton />
            <HeaderCtaButton href="#students" />
          </HStack>

          <IconButton
            aria-label={isOpen ? "Close menu" : "Open menu"}
            icon={isOpen ? <X size={22} /> : <Menu size={22} />}
            variant="ghost"
            borderRadius="lg"
            size="sm"
            display={{ base: "inline-flex", xl: "none" }}
            onClick={isOpen ? onClose : onOpen}
          />
        </Flex>
      </Container>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
        <DrawerOverlay backdropFilter="blur(4px)" />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerBody pt={14} pb={8}>
            <VStack align="stretch" spacing={1}>
              {NAV_LINKS.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} onClick={closeAndNavigate} fontSize="md" py={3} px={4} />
              ))}
            </VStack>
            <VStack spacing={3} mt={10} w="full">
              <HeaderSignInButton w="full" />
              <Box w="full" onClick={closeAndNavigate}>
                <HeaderCtaButton href="#students" w="full" />
              </Box>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default LandingHeader;
