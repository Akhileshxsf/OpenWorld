import { createWelcomeEmailTemplate } from "../emails/emailTemplates.js";

const API_KEY = import.meta.env.VITE_RESEND_API_KEY; // From .env
const sender = {
  name: "OpenWorld", // Adjust as needed
  email: "noreply@openworldtradetime.com" // Your verified sender email in Resend
};

export const sendWelcomeEmail = async (email, name, clientURL, isLogin = false) => {
  if (!API_KEY) {
    console.warn("Resend API key not set—skipping email");
    return;
  }

  try {
    const response = await fetch('/api/resend/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        from: `${sender.name} <${sender.email}>`,
        to: email,
        subject: isLogin ? "Welcome Back to OpenWorld!" : "Welcome to OpenWorld!",
        html: createWelcomeEmailTemplate(name, clientURL, isLogin),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Resend API error:", errorData);
      return; // Non-blocking
    }

    const data = await response.json();
    console.log("Welcome email sent successfully:", data);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    // Non-blocking—UI continues
  }
};