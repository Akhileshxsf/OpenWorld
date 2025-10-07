import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import useShowToast from "./useShowToast";
import { auth, firestore } from "../firebase/firebase";
import { doc, getDoc } from 'firebase/firestore';
import useAuthStore from "../store/authStore";
import { sendWelcomeEmail } from "../lib/sendWelcomeEmail"; // Adjust path as needed

const useLogin = () => {
  const showToast = useShowToast();
  const [
    signInWithEmailAndPassword,
    ,
    loading,
    error,
  ] = useSignInWithEmailAndPassword(auth);
  const loginUser = useAuthStore((state) => state.login);

  const login = async (inputs) => {
    if (!inputs.email || !inputs.password) {
      return showToast("Error", "Please fill all the fields", "error");
    }

    try {
      const userCred = await signInWithEmailAndPassword(inputs.email, inputs.password);
      if (userCred) {
        const docRef = doc(firestore, "users", userCred.user.uid);
        const docSnap = await getDoc(docRef);
        localStorage.setItem("user-info", JSON.stringify(docSnap.data()));
        loginUser(docSnap.data());

        // Send welcome back email (optional, but as requested)
        await sendWelcomeEmail(
          inputs.email,
          docSnap.data().username || inputs.email.split('@')[0],
          "https://openworldtradetime.com",
          true // isLogin = true for welcome back
        );
      }
    } catch (error) {
      showToast("Error", error.message, "error");
    }
  };

  return { loading, error, login };
};

export default useLogin;