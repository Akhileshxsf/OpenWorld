import { Input, VStack, Button, Alert, AlertIcon, FormControl, FormLabel } from '@chakra-ui/react';
import { useState } from 'react';
import useLogin from '../../hooks/useLogin';

const Login = () => {
  const [inputs, setInputs] = useState({
    email: '',
    password: '',
  });

  const { loading, error, login } = useLogin();

  return (
    <VStack spacing={6}>
      <FormControl>
        <FormLabel color="#CCCCCC" fontSize="sm" fontFamily="'Poppins', sans-serif" mb={2}>
          Email
        </FormLabel>
        <Input
          type='email'
          value={inputs.email}
          onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
          bg={"#1A1A1A"}
          color={"#FFFFFF"}
          borderColor={"rgba(255, 255, 255, 0.1)"}
          _hover={{ borderColor: "#1E90FF" }}
          _focus={{ borderColor: "#1E90FF", boxShadow: "0 0 0 1px #1E90FF" }}
          fontFamily={"'Poppins', sans-serif"}
          fontSize="sm"
          size="md"
          placeholder="Enter your email"
        />
      </FormControl>
      <FormControl>
        <FormLabel color="#CCCCCC" fontSize="sm" fontFamily="'Poppins', sans-serif" mb={2}>
          Password
        </FormLabel>
        <Input
          type='password'
          value={inputs.password}
          onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
          bg={"#1A1A1A"}
          color={"#FFFFFF"}
          borderColor={"rgba(255, 255, 255, 0.1)"}
          _hover={{ borderColor: "#1E90FF" }}
          _focus={{ borderColor: "#1E90FF", boxShadow: "0 0 0 1px #1E90FF" }}
          fontFamily={"'Poppins', sans-serif"}
          fontSize="sm"
          size="md"
          placeholder="Enter your password"
        />
      </FormControl>
      {error && (
        <Alert status='error' fontSize={13} p={3} borderRadius={8} bg={"#1A1A1A"} color={"#FF4D4D"} border="1px solid rgba(255, 77, 77, 0.2)">
          <AlertIcon fontSize={12} mr={2} />
          {error.message}
        </Alert>
      )}
      <Button
        w={"full"}
        size={"md"}
        isLoading={loading}
        onClick={() => login(inputs)}
        bg={"linear-gradient(135deg, #1E90FF 0%, #1C86EE 100%)"}
        color={"#FFFFFF"}
        _hover={{ bg: "linear-gradient(135deg, #1C86EE 0%, #1E90FF 100%)", transform: "translateY(-1px)" }}
        boxShadow="0 4px 12px rgba(30, 144, 255, 0.3)"
        fontFamily={"'Poppins', sans-serif"}
        fontWeight={"medium"}
        fontSize="sm"
        transition="all 0.2s ease"
      >
        Log In
      </Button>
    </VStack>
  );
};

export default Login;