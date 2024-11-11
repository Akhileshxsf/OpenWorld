import { useEffect, useState } from "react";
import usePostStore from "../store/postStore";
import useShowToast from "./useShowToast";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../firebase/firebase";

const useGetFeedPosts = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { posts, setPosts } = usePostStore(); // Get posts from store
  const showToast = useShowToast();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, "posts"));
        const fetchedPosts = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        
        setPosts(fetchedPosts); // Update the global state with fetched posts
      } catch (error) {
        showToast("Error", "Failed to load posts", "error");
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    fetchPosts();
  }, [setPosts, showToast]);

  return { isLoading, posts };
};

export default useGetFeedPosts;
