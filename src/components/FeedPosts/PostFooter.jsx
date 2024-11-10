import { Flex, Box, Image, Text, InputGroup, Input, Button, InputRightElement} from "@chakra-ui/react";
import { useState } from "react";


const PostFooter = ({username,isProfilePage }) => {

    
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] =  useState(1000);
          
      const handleLike = () => {
        if(liked){
          setLiked(false);
          setLikes(likes - 1);
        } else{
          setLiked(true);
          setLikes(likes + 1);
        }
            }

            

           

  return (
  <Box mb={10} marginTop={"auto"}>
    <Flex alignItems={"center"} gap={4} w={"full"} pt={0} mb={2} mt={2}>
       <Box onClick={handleLike}
       cursor={"pointer"}
       fontSize={18}
       aria-label={!liked ? "Like" : "Unlike"}
       >
          {!liked ? (
                
                <Image src="/unlike5678.jpeg"   alt="Liked"  width="40px" height="30px" />
               
          ) : (
                 <Image src="/like123.png" alt="Not Liked"  width="40px" height="30px" />

          ) }
       </Box>

       <Box cursor={"pointer"} fontSize={18} aria-label="Comment">
       <Image src="comment123.png" alt="comment"  width="40px" height="30px" />
       </Box>

    </Flex>
    <Text fontWeight={600} fontSize={"sm"}>
      {likes} likes
    </Text>
      {!isProfilePage && (
        <>
        <Text fontSize='sm' fontWeight={700}>
        {username}<Text as="span" fontWeight={400}>
          :-Explore the cosmos together. Buy your cosmic moment now!
        </Text>
     
      </Text>
      <Text fontSize='sm' color={"gray"}>
        View all 1,000 comments
      </Text>
        </>
      )}

      <Flex
        alignItems={"center"}
        gap={2}
        justifyContent={"space-between"}
        w={"full"}
      >
        <InputGroup>
          <Input variant={"flushed"} placeholder={"Add a comment..."} fontSize={14} />
           <InputRightElement>
             <Button
                fontSize={14}
                color={"blue.500"}
                fontWeight={600}
                cursor={"pointer"}
                _hover={{color:"white"}}
                bg={"transparent"}
             >
               Post
             </Button>
           </InputRightElement>
        </InputGroup>
         

      </Flex>

  </Box>
);
  
};

export default PostFooter;