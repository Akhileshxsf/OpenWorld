import { useDisclosure } from "@chakra-ui/react";
import { useState } from "react";

const useBuyTimeModal = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleBuyTimeClick = () => {
    setIsConnecting(true);

    setTimeout(() => {
      setIsConnecting(false);
      onOpen();
    }, 2000);
  };

  return { isOpen, onOpen, onClose, isConnecting, handleBuyTimeClick };
};

export default useBuyTimeModal;

