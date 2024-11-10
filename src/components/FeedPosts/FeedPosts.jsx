import { Container , VStack , Flex,Box, SkeletonCircle, Skeleton } from '@chakra-ui/react';
import FeedPost from './FeedPost';
import { useState } from 'react';
import { useEffect } from 'react';
const FeedPosts = () => {
  const [isLoading,setIsLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false)
    },2000)
  },[])

  
  return (
    <Container maxW={'container.sm'} py={10} px={2}>
      {isLoading && [0,1,2,3].map((_,idx) =>(
        <VStack key={idx} gap={4} alignItems={"flex-start"} mb={10}>
           <Flex gap="2">
            <SkeletonCircle size='10'/>
            <VStack gap={2} alignItems={"flex-start"} >
             <Skeleton height='10px' w={"200px"} />
             <Skeleton height='10px' w={"200px"} />
            </VStack>

           </Flex>
            <Skeleton w={"full"}>
              <Box h={"500px"}>
                contents wrapped
              </Box>
            </Skeleton>
        </VStack>
        ))}
         
         {!isLoading && (
          <>
            <FeedPost img='/img24.png' username='AstroPhysicist' avatar='/img5.png'  altText="Astro image" />
            <FeedPost img='/paint.png' username='Painter' avatar='Painter.png' altText="Painter image"/>
            <FeedPost img='/dish.png' username='chef' avatar='/cheif.png' altText="chef image"/>
            <FeedPost img='/pro1.png' username='Competitive programer' avatar='/pro.png' altText="competitive programer"/>
          </>
         )}




    </Container>
  );
};

export default FeedPosts;