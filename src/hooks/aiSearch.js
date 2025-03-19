// src/hooks/aiSearch.js

const openWorldInfo = {
  "time trading": [
    `OpenWorld is a platform where you can trade your time for services like mentorship, lessons, advice, and more. 
     Right now, sessions are free! All you need to do is click "Buy Time" at the scheduled time listed by the time seller, and you'll be connected for a video call. ⏳💬`,
    `Time trading on OpenWorld allows you to exchange your time for valuable services. At this stage, sessions are free! Just click "Buy Time" during the time slot provided by the seller, and you're all set to start your interaction. 🌍💡`,
  ],
  "buy time": [
    `To buy time on OpenWorld, write the channel name of the time seller in the feed, check the available time slots, and click "Buy Time" at the time specified by the seller. It's completely free at the moment, and you'll be connected via video call. 🛍️📞`,
    `Buying time is simple! Just click on the channel name of the time seller in the feed, choose a time slot, and click "Buy Time" when it's time. Sessions are free right now, and you’ll be connected instantly for a video call. 🕒💡`,
  ],
  "sell time": [
    `Selling your time is easy! Go to the sidebar, click the hand icon, and set your availability. Add a creative description of what you’ll offer, whether it’s mentorship, lessons, or project help. Right now, sessions are free, so take this chance to build your profile and get started with selling your time in innovative ways! 💼🔑`,
    `To sell time, click the hand icon in the sidebar and create a post with the time slots you're available for. Add a creative twist to your offer—maybe a unique lesson or project help idea. Sessions are free at the moment, so this is a great opportunity to start selling your time and engaging with the community. 📲🎤`,
  ],
  "profile": [
    `Your OpenWorld profile is your personal space to show what you're offering! Add posts, display your skills and achievements, and set your availability to sell time. The platform is still in its early stages, so make sure to set up a complete profile to start helping others or ask for help in return. 🌟📖`,
    `To make the most of OpenWorld, create and update your profile with what you’re offering, your skills, and your achievements. You can post about the services you provide, whether it's lessons or project help, and engage with others by offering or seeking help. It’s the perfect time to build your presence as the platform grows! 🏅🖋️`,
  ],
  "video call": [
    `Right now, video calls are available when you click "Buy Time" for a time slot listed by the seller. Sessions are free during this early phase. If you face any issues, try toggling the video off and back on to resolve connection problems. Enjoy your calls and start collaborating! 🎥💬`,
    `The video call feature connects you with time sellers when you click "Buy Time" at the scheduled time. It’s completely free at the moment! If the video isn't working, just toggle it off and back on. Ready to start your session? 📅💻`,
  ],
  "how it works": [
    `OpenWorld is built around the idea of trading time. Users can buy or sell time, exchanging knowledge, mentorship, or help on projects. Currently, sessions are free. All you have to do is click "Buy Time" during the seller’s available time slot, and you’ll be connected via video call. Don’t forget to create your profile and post about what you’re offering! 🌍💡`,
    `On OpenWorld, time trading allows you to offer or seek services like lessons, mentorship, or project help. Right now, sessions are free, but you still need to click "Buy Time" during the time slot mentioned by the seller to get connected. Set up your profile, post, and start engaging with others today! ⏳💻`,
  ],
  "getting started": [
    `To get started on OpenWorld, create your profile, add posts that showcase what you’re offering or seeking, and sell your time! You can help others or ask for help with projects or learning. Since sessions are free right now, it’s a great opportunity to start connecting with people and building your reputation. 🌟🤝`,
    `Start by creating a profile that reflects your skills and services. You can sell time, ask for help, or offer your expertise to others. The platform is still in its early stage, so it's a fantastic time to jump in and get started while everything is free! 🎤📚`,
  ],
  "help": [
    `Looking for help? OpenWorld is all about collaboration. You can ask for help with any projects or learning goals by searching for someone who can help. If you want to offer help, create a post and start selling your time. Right now, all sessions are free, so it’s the perfect time to give back or get assistance. 🆘💬`,
    `If you need help, simply search for someone who offers services like mentorship or project assistance, and click "Buy Time" at their listed time. You can also offer your help by selling your time—post about what you can offer and start connecting with others! 🌍🛠️`,
  ],
  "engage": [
    `Engage with OpenWorld by setting up a profile, posting about what you're offering, and selling your time. You can also ask for help from others or give your time in exchange for assistance on projects. The best part? Right now, all sessions are free! So why not get started today? 🏅💬`,
    `The best way to engage on OpenWorld is to start with your profile. Add posts about the services you offer, whether it’s tutoring, mentorship, or project collaboration. You can also ask for help or give help by selling your time. All sessions are free at the moment, so make the most of it and get involved! 🎤🌍`,
  ],
  "contact": [
    `If you have specific questions or need further assistance, feel free to DM me directly at 9618069125. I'm here to help you navigate OpenWorld and get the most out of the platform. Don't hesitate to reach out! 📲💬`,
    `Have a question that needs a personal touch? DM me at 9618069125, and I'll be happy to assist you with any queries you have about OpenWorld. I’m just a message away! 💬📱`,
  ],
};

const getRandomCrazyFact = () => {
  const crazyFacts = [
    "Did you know? The average person spends about 6 months of their life waiting for red lights to turn green. 🚦⏳",
    "Fun fact: In 10 minutes, you can teach someone how to juggle! 🎪",
    "If you were to fold a piece of paper 42 times, it would reach the moon! 🌕📄",
  ];
  return crazyFacts[Math.floor(Math.random() * crazyFacts.length)];
};

// AI search function with extended responses
const searchAI = (query) => {
  const normalizedQuery = query.toLowerCase();

  // Try to match the query with predefined topics
  for (const key in openWorldInfo) {
    const regex = new RegExp(`\\b${key}\\b`, "i");
    if (regex.test(normalizedQuery)) {
      // Randomly pick one of the possible responses for variety
      const randomIndex = Math.floor(Math.random() * openWorldInfo[key].length);
      const response = openWorldInfo[key][randomIndex];

      // Add a crazy fact to make it more engaging
      const crazyFact = getRandomCrazyFact();

      return `${response} Here's a crazy fact for you: ${crazyFact} 🤪`;
    }
  }

  const fallback = `I couldn't quite understand that. Here are some things you can ask about:
    - "Time trading on OpenWorld"
    - "How to buy time"
    - "Selling time on OpenWorld"
    - "How OpenWorld video calls work"
    - "Getting started with OpenWorld"
    - "Offering or asking for help on OpenWorld"

  Or feel free to ask something else! Or... ask for a crazy fact! 🤪

  For specific questions, DM me at 9618069125. 📲`;
  return fallback;
};

export default searchAI;
