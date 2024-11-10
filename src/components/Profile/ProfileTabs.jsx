import { Box, Flex, Text , Image } from "@chakra-ui/react";


const ProfileTabs = () => {
  return (
    <Flex
    w={"full"}
    justifyContent={"center"}
    gap={{base:4,sm:10}}
    textTransform={"uppercase"}
    fontWeight={"bold"}
    
    
    >
        <Flex borderTop={"1px solid white"} alignItems={"center"} p="3" gap={1} cursor={"pointer"}>
            <Box fontSize={20}>
                <Image src="/Posts1.png" alt="Posts" boxSize={6}  />

            </Box>
            <Text fontSize={12} display={{base:"none",sm:"block"}}>Posts</Text>

        </Flex>
        
        <Flex  alignItems={"center"} p="3" gap={1} cursor={"pointer"}>
            <Box fontSize={20}>
                < Image src="/achievement.png" alt="Posts" boxSize={6} />

            </Box>
            <Text fontSize={12} display={{base:"none",sm:"block"}}>Achievements</Text>

        </Flex>


        <Flex  alignItems={"center"} p="3" gap={1} cursor={"pointer"}>
            <Box fontSize={20}>
                <Image src="/Courses.png" alt="Posts" boxSize={6}  fontWeight={"bold"} />

            </Box>
            <Text fontSize={12} display={{base:"none",sm:"block"}}>Courses</Text>

        </Flex>




    </Flex>
  );
};

export default ProfileTabs;