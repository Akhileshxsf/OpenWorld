import { VStack, Flex, Text, Box, Link} from "@chakra-ui/react";
import SuggestedHeader from "./SuggestedHeader";
import SuggestedTimeSeller from './SuggestedTimeSeller';
import useGetSuggestedUsers from "../../hooks/useGetSuggestedUsers";

const SuggestedTimeSellers = () => {
  const {isLoading,SuggestedTimeSellers} = useGetSuggestedUsers();

  if (isLoading || !SuggestedTimeSellers) return null;

  return(
   <VStack  py={8} px={6} gap={4}>
    <SuggestedHeader />

    <Flex alignItems={"center"} justifyContent={"space-between"}w={"full"}>
    <Text fontSize={12} fontWeight={"bold"} color={"gray.500"}>
      SuggestedTimeSellers For you
    </Text>
     <Text fontSize={12} fontWeight={"bold"} _hover={{color: "gray.400"}} cursor={"pointer"}>
        see All
     </Text>
    </Flex>
       
       {SuggestedTimeSellers.map(user =>(
        <SuggestedTimeSeller user={user} key={user.id} />
       ))}

       <Box
         fontSize={12} color={"gray.500"} mt={5} alignSelf="start"
       >
         © 2024 Built By{" "}
         <Link href='https://www.linkedin.com/in/akhilesh-thota-518339261?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app' target='_blank' color='blue.500' fontSize={14}>
             Akhilesh Thota
         </Link>
       </Box>
    </VStack>
  );
};

export default SuggestedTimeSellers;