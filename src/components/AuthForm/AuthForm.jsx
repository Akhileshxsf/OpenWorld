import { Box, VStack, Flex, Text, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import GoogleAuth from './GoogleAuth';

const AuthForm = ({ isLogin: initialIsLogin = true, onIsLoginChange }) => {
  const [isLogin, setIsLogin] = useState(initialIsLogin);

  const handleTabChange = (index) => {
    const newIsLogin = index === 0;
    setIsLogin(newIsLogin);
    if (onIsLoginChange) {
      onIsLoginChange(newIsLogin);
    }
  };

  return (
    <VStack spacing={6} w={"full"}>
      <Tabs
        variant="unstyled"
        index={isLogin ? 0 : 1}
        onChange={handleTabChange}
        w="full"
        align="center"
      >
        <TabList mb={6} borderBottom="1px solid rgba(255, 255, 255, 0.1)">
          <Tab
            color={isLogin ? "#FFFFFF" : "#CCCCCC"}
            fontWeight={isLogin ? "bold" : "medium"}
            borderBottom={isLogin ? "2px solid #1E90FF" : "none"}
            _hover={{ color: "#FFFFFF" }}
            fontFamily={"'Poppins', sans-serif"}
            fontSize="md"
          >
            Log In
          </Tab>
          <Tab
            color={!isLogin ? "#FFFFFF" : "#CCCCCC"}
            fontWeight={!isLogin ? "bold" : "medium"}
            borderBottom={!isLogin ? "2px solid #1E90FF" : "none"}
            _hover={{ color: "#FFFFFF" }}
            fontFamily={"'Poppins', sans-serif"}
            fontSize="md"
          >
            Sign Up
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            <Login />
          </TabPanel>
          <TabPanel p={0}>
            <Signup />
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      <Flex alignItems={"center"} justifyContent={"center"} wrap="wrap" my={4} gap={1} w={"full"}>
        <Box flex={1} h={"1px"} bg={"rgba(255, 255, 255, 0.3)"} />
        <Text mx={3} color={"#CCCCCC"} fontFamily={"'Poppins', sans-serif"} fontSize="sm">
          OR
        </Text>
        <Box flex={1} h={"1px"} bg={"rgba(255, 255, 255, 0.3)"} />
      </Flex>
      
      <GoogleAuth prefix={isLogin ? "Log in" : "Sign up"} />
    </VStack>
  );
};

export default AuthForm;