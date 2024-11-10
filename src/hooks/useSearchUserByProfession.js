import { useEffect, useState } from "react";
import useShowToast from "./useShowToast";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../firebase/firebase";
import useUserProfileStore from "../store/userProfileStore";

const useSearchUserByProfession = (profession) => {
  const [isLoading, setIsLoading] = useState(true);
  const showToast = useShowToast();
  const { userProfile, setUserProfile } = useUserProfileStore();

  useEffect(() => {
    const searchUserByProfession = async () => {
      setIsLoading(true);
      try {
        const q = query(collection(firestore, "users"), where("profession", "==", profession));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setUserProfile(null);
          console.log("No user profiles found for the given profession:", profession);
        } else {
          // Assuming you only want the first user found based on the profession
          const userDoc = querySnapshot.docs[0].data();
          setUserProfile(userDoc);
          console.log("User profile found based on profession:", userDoc);
        }
      } catch (error) {
        showToast("Error", error.message, "error");
        console.error("Error fetching user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (profession) {
      searchUserByProfession();
    }
  }, [setUserProfile, profession, showToast]);

  return { isLoading, userProfile };
};

export default useSearchUserByProfession;
