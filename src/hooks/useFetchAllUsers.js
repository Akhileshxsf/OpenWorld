import { useState, useEffect, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase/firebase";
import useShowToast from "./useShowToast";

const useFetchAllUsers = () => {
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const showToast = useShowToast();

    useEffect(() => {
        const fetchAllUsers = async () => {
            setIsLoading(true);
            try {
                const querySnapshot = await getDocs(collection(firestore, "users"));
                const users = querySnapshot.docs.map((doc) => doc.data());
                setAllUsers(users);
            } catch (error) {
                showToast("Error", error.message, "error");
                console.error("Error fetching users:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllUsers();
    }, []);

    // Search Function with Debounce Effect
    const searchUsers = useCallback((query) => {
        if (!query) {
            setFilteredUsers([]);
            return;
        }

        const lowerCaseQuery = query.toLowerCase();

        // Filter & Rank Results
        const results = allUsers
            .map(user => ({
                ...user,
                rank: (user.name?.toLowerCase().includes(lowerCaseQuery) ? 2 : 0) +
                      (user.profession?.toLowerCase().includes(lowerCaseQuery) ? 1 : 0),
            }))
            .filter(user => user.rank > 0) // Only keep matches
            .sort((a, b) => b.rank - a.rank); // Sort by relevance

        setFilteredUsers(results);
    }, [allUsers]);

    return { allUsers, filteredUsers, isLoading, searchUsers };
};

export default useFetchAllUsers;
