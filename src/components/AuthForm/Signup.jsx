import { ViewIcon,VStack , ViewOffIcon } from "@chakra-ui/icons";
import { Button, Input, InputGroup, InputRightElement, Alert, AlertIcon, FormControl, FormLabel } from "@chakra-ui/react";
import { useState } from "react";
import useSignUpWithEmailAndPassword from "../../hooks/useSignUpWithEmailAndPassword";

const Signup = () => {
  const [inputs, setInputs] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    profession: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const { loading, error, signup } = useSignUpWithEmailAndPassword();

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
          Username
        </FormLabel>
        <Input
          type='text'
          value={inputs.username}
          onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
          bg={"#1A1A1A"}
          color={"#FFFFFF"}
          borderColor={"rgba(255, 255, 255, 0.1)"}
          _hover={{ borderColor: "#1E90FF" }}
          _focus={{ borderColor: "#1E90FF", boxShadow: "0 0 0 1px #1E90FF" }}
          fontFamily={"'Poppins', sans-serif"}
          fontSize="sm"
          size="md"
          placeholder="Enter your username"
        />
      </FormControl>
      <FormControl>
        <FormLabel color="#CCCCCC" fontSize="sm" fontFamily="'Poppins', sans-serif" mb={2}>
          Profession
        </FormLabel>
        <Input
          type='text'
          value={inputs.profession}
          onChange={(e) => setInputs({ ...inputs, profession: e.target.value })}
          bg={"#1A1A1A"}
          color={"#FFFFFF"}
          borderColor={"rgba(255, 255, 255, 0.1)"}
          _hover={{ borderColor: "#1E90FF" }}
          _focus={{ borderColor: "#1E90FF", boxShadow: "0 0 0 1px #1E90FF" }}
          fontFamily={"'Poppins', sans-serif"}
          fontSize="sm"
          size="md"
          placeholder="Enter your profession"
        />
      </FormControl>
      <FormControl>
        <FormLabel color="#CCCCCC" fontSize="sm" fontFamily="'Poppins', sans-serif" mb={2}>
          Password
        </FormLabel>
        <InputGroup>
          <Input
            type={showPassword ? "text" : "password"}
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
          <InputRightElement h={"full"}>
            <Button
              variant={"ghost"}
              size={"sm"}
              onClick={() => setShowPassword(!showPassword)}
              color={"#CCCCCC"}
              _hover={{ color: "#1E90FF" }}
            >
              {showPassword ? <ViewIcon /> : <ViewOffIcon />}
            </Button>
          </InputRightElement>
        </InputGroup>
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
        onClick={() => signup(inputs)}
        bg={"linear-gradient(135deg, #1E90FF 0%, #1C86EE 100%)"}
        color={"#FFFFFF"}
        _hover={{ bg: "linear-gradient(135deg, #1C86EE 0%, #1E90FF 100%)", transform: "translateY(-1px)" }}
        boxShadow="0 4px 12px rgba(30, 144, 255, 0.3)"
        fontFamily={"'Poppins', sans-serif"}
        fontWeight={"medium"}
        fontSize="sm"
        transition="all 0.2s ease"
      >
        Sign Up
      </Button>
    </VStack>
  );
};

export default Signup;