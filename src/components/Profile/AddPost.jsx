import { useState } from "react";
import { firestore, storage, auth } from "../../firebase/firebase"; // Import auth
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Box, Button, Input, Textarea, Image, useToast } from "@chakra-ui/react";
import { v4 as uuidv4 } from "uuid"; // To generate a unique filename for the image

const AddPost = () => {
  const [caption, setCaption] = useState(""); // State for caption
  const [image, setImage] = useState(null); // State for image file
  const [loading, setLoading] = useState(false); // State for loading indicator
  const toast = useToast(); // Chakra UI toast for notifications

  // Handle form submission (posting)
  const handleSubmit = async () => {
    if (!caption || !image) {
      toast({
        title: "Error",
        description: "Please provide a caption and image for the post.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true); // Start loading

    // Ensure the user is authenticated and get their UID
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to post.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
      return;
    }

    // Create a unique filename for the image
    const imageName = `${uuidv4()}_${image.name}`;
    const imageRef = ref(storage, `posts/${imageName}`);

    // Upload image to Firebase Storage
    const uploadTask = uploadBytesResumable(imageRef, image);

    uploadTask.on(
      "state_changed",
      null, // Progress handling can be added here if needed
      (error) => {
        toast({
          title: "Error",
          description: error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setLoading(false); // Stop loading on error
      },
      async () => {
        // Get the image URL once uploaded
        const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);

        // Add post to Firestore
        try {
          await addDoc(collection(firestore, "userPosts"), {
            caption, // The caption text
            img: imageUrl, // The uploaded image URL
            userId: user.uid, // Use the authenticated user's UID
            username: user.displayName || "Default Username", // Use actual username
            profilePic: user.photoURL || "/defaultProfilePic.png", // Use user's profile pic if available
            createdAt: new Date(), // Timestamp of post creation
          });

          toast({
            title: "Post added",
            description: "Your post has been successfully added.",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          setCaption(""); // Clear caption
          setImage(null); // Clear image preview
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to add the post. Please try again later.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        } finally {
          setLoading(false); // Stop loading
        }
      }
    );
  };

  return (
    <Box p={4} maxW="500px" mx="auto">
      {/* Textarea for caption */}
      <Textarea
        placeholder="Write a caption..."
        value={caption} // Bind Textarea to caption state
        onChange={(e) => setCaption(e.target.value)} // Handle Textarea changes
        mb={4}
        size="lg"
      />

      {/* File input for image */}
      <Input
        type="file"
        onChange={(e) => setImage(e.target.files[0])} // Handle file selection
        mb={4}
      />

      {/* Display image preview if selected */}
      {image && (
        <Image
          src={URL.createObjectURL(image)} // Display image preview
          alt="Post Image Preview"
          boxSize="200px"
          objectFit="cover"
          mb={4}
        />
      )}

      {/* Submit button */}
      <Button
        colorScheme="blue"
        isLoading={loading} // Show loading state when posting
        onClick={handleSubmit} // Handle post submission
        isFullWidth
      >
        Add Post
      </Button>
    </Box>
  );
};

export default AddPost;
