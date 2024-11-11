// hooks/useFetchAllUsers.js
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase/firebase";
import useShowToast from "./useShowToast";

const useFetchAllUsers = () => {
    const [allUsers, setAllUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const showToast = useShowToast();

    const fetchAllUsers = async () => {
        setIsLoading(true);
        try {
            const querySnapshot = await getDocs(collection(firestore, "users"));
            const users = querySnapshot.docs.map((doc) => doc.data());
            setAllUsers(users);
        } catch (error) {
            showToast("Error", error.message, "error");
            console.error("Error fetching all users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return { allUsers, isLoading, fetchAllUsers };
};

export default useFetchAllUsers;
