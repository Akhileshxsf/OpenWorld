// src/hooks/useLike.js
import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { firestore } from "../firebase/firebase";
import { useToast } from "@chakra-ui/react";

const useLike = (currentUser) => {
  const [likedPosts, setLikedPosts] = useState({});
  const toast = useToast();

  useEffect(() => {
    if (!currentUser) return;
  }, [currentUser]);

  const handleLike = async (postId) => {
    if (!currentUser) {
      toast({
        title: "You need to log in to like posts!",
        status: "warning",
        duration: 2000,
      });
      return;
    }

    try {
      const postRef = doc(firestore, "posts", postId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) return;

      const postData = postSnap.data();
      const hasLiked = postData.likedBy?.includes(currentUser.uid);

      await updateDoc(postRef, {
        likedBy: hasLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
      });

      setLikedPosts((prev) => ({
        ...prev,
        [postId]: hasLiked
          ? prev[postId]?.filter((uid) => uid !== currentUser.uid)
          : [...(prev[postId] || []), currentUser.uid],
      }));
    } catch (error) {
      console.error("Error liking/unliking post:", error);
      toast({
        title: "Error processing like",
        status: "error",
        duration: 2000,
      });
    }
  };

  return { likedPosts, handleLike };
};

export default useLike;
