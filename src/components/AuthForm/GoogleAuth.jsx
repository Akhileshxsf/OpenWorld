import { Flex, Image, Text } from "@chakra-ui/react";
import { useSignInWithGoogle } from "react-firebase-hooks/auth";
import { auth, firestore } from '../../firebase/firebase';
import useShowToast from "../../hooks/useShowToast";
import useAuthStore from "../../store/authStore";
import { setDoc, doc } from 'firebase/firestore';
import { getDoc } from "firebase/firestore";
import { sendWelcomeEmail } from "../../lib/sendWelcomeEmail"; // Adjust path as needed

const GoogleAuth = ({ prefix }) => {
  const [signInWithGoogle, , , error] = useSignInWithGoogle(auth);
  const showToast = useShowToast();
  const loginUser = useAuthStore((state) => state.login);

  const handleGoogleAuth = async () => {
    try {
      const newUser = await signInWithGoogle();
      if (!newUser && error) {
        showToast("Error", error.message, "error");
        return;
      }
      const userRef = doc(firestore, "users", newUser.user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // login
        const userDoc = userSnap.data();
        localStorage.setItem("user-info", JSON.stringify(userDoc));
        loginUser(userDoc);

        // Send welcome back email on login (optional)
        await sendWelcomeEmail(
          newUser.user.email,
          userDoc.username,
          "https://openworldtradetime.com",
          true // isLogin = true for welcome back
        );
      } else {
        // signup
        const userDoc = {
          uid: newUser.user.uid,
          email: newUser.user.email,
          username: newUser.user.email.split("@")[0],
          fullName: newUser.user.displayName,
          profession: newUser.user.displayName,
          bio: "",
          profilePicURL: newUser.user.photoURL,
          SoldInstances: [],
          Rating: [],
          posts: [],
          createdAt: Date.now(),
        };
        await setDoc(doc(firestore, "users", newUser.user.uid), userDoc);
        localStorage.setItem("user-info", JSON.stringify(userDoc));
        loginUser(userDoc);

        // Send welcome email on signup
        await sendWelcomeEmail(
          newUser.user.email,
          userDoc.username,
          "https://openworldtradetime.com"
        );
      }
    } catch (error) {
      showToast("Error", error.message, "error");
    }
  };

  return (
    <Flex
      alignItems={"center"}
      justifyContent={"center"}
      cursor={"pointer"}
      onClick={handleGoogleAuth}
      p={3}
      w="full"
      bg="rgba(255, 255, 255, 0.05)"
      border="1px solid rgba(255, 255, 255, 0.1)"
      borderRadius="md"
      transition="all 0.2s ease"
      _hover={{
        bg: "rgba(30, 144, 255, 0.1)",
        borderColor: "#1E90FF",
        transform: "translateY(-1px)",
      }}
    >
      <Image src='/google.png' w={5} h={5} alt='Google logo' mr={2} />
      <Text color={"#FFFFFF"} fontFamily={"'Poppins', sans-serif"} fontWeight={"medium"} fontSize="sm">
        {prefix} with Google
      </Text>
    </Flex>
  );
};

export default GoogleAuth;