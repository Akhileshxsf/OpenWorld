import { Grid, VStack, Skeleton, Box} from "@chakra-ui/react";
import { useState, useEffect } from 'react';
import ProfilePost from "./ProfilePost";

const ProfilePosts = () => {
    const [isLoading,setIsLoading] = useState(true)
    
     useEffect(()=> {
         setTimeout(()=>{
            setIsLoading(false)
         },1000)


     },[])




  return (
    <Grid
      templateColumns={{
           sm:"repeat(1, 1fr)",
           md:"repeat(3, 1fr)",


      }}
      gap={1}
      columnGap={1}
    
    
    
    >
        {isLoading && [0,1,2,3,4,5].map((_,idx)=>(
            <VStack key={idx} alignItems={"flex-start"} gap={4}>
              <Skeleton w={"full"}>
                 <Box h="300px">
                    contents wrapped
                 </Box>

              </Skeleton>


            </VStack>
        ))}

         {!isLoading && (
            <>
                <ProfilePost img="/1.jpeg" />
                <ProfilePost img="/2.jpeg" />
                <ProfilePost img="/6.jpeg"/>
                <ProfilePost img="/4.jpeg"/>


            </>
         )}


    </Grid>
  );
};

export default ProfilePosts;

