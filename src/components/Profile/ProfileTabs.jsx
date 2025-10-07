import { Box, Flex, Text, Image } from "@chakra-ui/react";

const ProfileTabs = () => {
  return (
    <Flex
      w={"full"}
      justifyContent={"center"}
      textTransform={"uppercase"}
      fontWeight={"bold"}
    >
      <Flex borderTop={"1px solid white"} alignItems={"center"} p="3" gap={1} cursor={"pointer"}>
        <Box fontSize={20}>
          <Image src="/Posts1.png" alt="Posts" boxSize={6} />
        </Box>
        <Text fontSize={12} display={{base:"none",sm:"block"}}>brand identity</Text>
      </Flex>
    </Flex>
  );
};

export default ProfileTabs;