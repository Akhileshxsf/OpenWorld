import { useEffect, useState } from "react";
import useShowToast from "./useShowToast";
import {  collection, getDocs , query, where } from "firebase/firestore";
import { firestore } from "../firebase/firebase";
import useUserProfileStore from "../store/userProfileStore";

const useGetUserProfileByUsername = (username) => {
  const [isLoading, setIsLoading] = useState(true);
  const showToast = useShowToast();
    const {userProfile,setUserProfile}   = useUserProfileStore();


  useEffect(() => {
      const getUserProfile = async() => {
           setIsLoading(true);
        try {
              const q = query(collection(firestore,"users"), where("username","==",username));
               const querySnapshot= await getDocs(q);
                 
               if (querySnapshot.empty) {
                setUserProfile(null);
                console.log("User profile not found for username:", username);
              } else {
                const userDoc = querySnapshot.docs[0].data();
                setUserProfile(userDoc);
                console.log("User profile found:", userDoc);
              }
               
          } catch (error) {
              showToast('Error',error.message,'error');
              console.error("Error fetching user profile:", error);
          } finally{
             setIsLoading(false);
          }
      };


     getUserProfile();
},[setUserProfile, username, showToast]);

    return { isLoading, userProfile };
};

export default useGetUserProfileByUsername;