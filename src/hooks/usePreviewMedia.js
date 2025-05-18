import { useState } from "react";

const usePreviewMedia = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState(null);

  const handleMediaChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setSelectedFile(reader.result);
      setFileType(type);
    };
  };

  return { handleMediaChange, selectedFile, setSelectedFile, fileType };
};

export default usePreviewMedia;