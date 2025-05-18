import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "../firebase/firebase";
import useShowToast from "./useShowToast";
import useUserProfileStore from "../store/userProfileStore";

const useGetUserProfileByUsername = (username) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const showToast = useShowToast();
  const { userProfile, setUserProfile } = useUserProfileStore();

  useEffect(() => {
    let isMounted = true;

    const getUserProfile = async () => {
      // Guard clause for invalid username
      if (!username || typeof username !== "string") {
        if (isMounted) {
          setUserProfile(null);
          setError("Invalid username");
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const q = query(collection(firestore, "users"), where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (!isMounted) return;

        if (querySnapshot.empty) {
          setUserProfile(null);
          console.log("User profile not found for username:", username);
        } else {
          const userDoc = querySnapshot.docs[0].data();
          setUserProfile(userDoc);
          console.log("User profile found:", userDoc);
        }
      } catch (error) {
        if (isMounted) {
          setError(error.message);
          showToast("Error", error.message, "error");
          console.error("Error fetching user profile:", error);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    getUserProfile();

    return () => {
      isMounted = false;
    };
  }, [setUserProfile, username, showToast]);

  return { isLoading, userProfile, error };
};

export default useGetUserProfileByUsername;