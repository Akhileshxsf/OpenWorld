import { useState } from "react";
import { firestore, storage, auth } from "../../firebase/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Box, Button, Input, Textarea, Image, useToast, Spinner } from "@chakra-ui/react";
import { v4 as uuidv4 } from "uuid";

const AddPost = () => {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [buttonText, setButtonText] = useState("Add Post"); // New state for button text
  const toast = useToast();

  const handleSubmit = async () => {
    if (isSubmitted) return;

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

    setIsSubmitted(true);
    setLoading(true);
    setButtonText("Posting..."); // Change button text instantly

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
      setIsSubmitted(false);
      setButtonText("Add Post"); // Revert button text
      return;
    }

    const imageName = `${uuidv4()}_${image.name}`;
    const imageRef = ref(storage, `posts/${imageName}`);

    const uploadTask = uploadBytesResumable(imageRef, image);

    uploadTask.on(
      "state_changed",
      null,
      (error) => {
        toast({
          title: "Error",
          description: error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setLoading(false);
        setIsSubmitted(false);
        setButtonText("Add Post"); // Revert button text
      },
      async () => {
        const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);

        try {
          await addDoc(collection(firestore, "userPosts"), {
            caption,
            img: imageUrl,
            userId: user.uid,
            username: user.displayName || "Default Username",
            profilePic: user.photoURL || "/defaultProfilePic.png",
            createdAt: new Date(),
          });

          toast({
            title: "Post added",
            description: "Your post has been successfully added.",
            status: "success",
            duration: 3000,
            isClosable: true,
          });

          setCaption("");
          setImage(null);
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to add the post. Please try again later.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        } finally {
          setLoading(false);
          setIsSubmitted(false);
          setTimeout(() => {
            setButtonText("Add Post"); // Revert button text after 2 seconds
          }, 2000);
        }
      }
    );
  };

  return (
    <Box p={4} maxW="500px" mx="auto">
      <Textarea
        placeholder="Write a caption..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        mb={4}
        size="lg"
      />

      <Input
        type="file"
        onChange={(e) => setImage(e.target.files[0])}
        mb={4}
      />

      {image && (
        <Image
          src={URL.createObjectURL(image)}
          alt="Post Image Preview"
          boxSize="200px"
          objectFit="cover"
          mb={4}
        />
      )}

      {loading ? (
        <Spinner size="lg" />
      ) : (
        <Button
          colorScheme="blue"
          onClick={() => {
            setLoading(true);
            handleSubmit();
          }}
          isFullWidth
          disabled={loading}
        >
          {buttonText} {/* Use the buttonText state */}
        </Button>
      )}
    </Box>
  );
};

export default AddPost;