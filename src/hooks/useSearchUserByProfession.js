import { useState, useEffect } from 'react';

// This custom hook will fetch user profiles based on profession and return a random set of profiles
const useSearchUserByProfession = (profession) => {
  const [userProfiles, setUserProfiles] = useState([]);
  const [aiResult, setAiResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!profession) return; // Skip if no profession is provided

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        // Mock data for testing
        const mockData = [
          { name: 'John Doe', profession: profession, contact: 'john@example.com' },
          { name: 'Jane Smith', profession: profession, contact: 'jane@example.com' },
          { name: 'Alice Johnson', profession: profession, contact: 'alice@example.com' },
          { name: 'Bob Lee', profession: profession, contact: 'bob@example.com' },
          { name: 'Charlie Brown', profession: profession, contact: 'charlie@example.com' },
          { name: 'David Harris', profession: profession, contact: 'david@example.com' },
          { name: 'Eva White', profession: profession, contact: 'eva@example.com' },
          { name: 'Frank Green', profession: profession, contact: 'frank@example.com' },
          { name: 'Grace Adams', profession: profession, contact: 'grace@example.com' },
          { name: 'Hannah Miller', profession: profession, contact: 'hannah@example.com' },
        ];

        // Simulate a network delay and randomly shuffle the data
        const shuffledUsers = mockData.sort(() => 0.5 - Math.random()).slice(0, 10);

        setUserProfiles(shuffledUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [profession]);

  return { isLoading, userProfiles, aiResult };
};

export default useSearchUserByProfession;
