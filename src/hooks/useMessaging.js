import { useState } from 'react';

const useMessaging = () => {
  const [isMessaging, setIsMessaging] = useState(false);
  const [message, setMessage] = useState('');

  const openMessaging = () => setIsMessaging(true);
  const closeMessaging = () => {
    setIsMessaging(false);
    setMessage('');
  };

  const handleSendQuotation = (userId) => {
    if (!message.trim()) return;
    console.log(`Message sent to user ${userId}: ${message}`);
    // Here, you can add an API call to send the message
    closeMessaging();
  };

  return {
    isMessaging,
    message,
    setMessage,
    openMessaging,
    closeMessaging,
    handleSendQuotation,
  };
};

export default useMessaging;
