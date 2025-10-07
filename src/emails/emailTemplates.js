export function createWelcomeEmailTemplate(name, clientURL, isLogin = false) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${isLogin ? 'Welcome Back to OpenWorld!' : 'Welcome to OpenWorld!'}</title>
  </head>
  <body style="font-family: 'Poppins', sans-serif; line-height: 1.6; color: #fff; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000;">
    <div style="background: #000; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; box-shadow: 0 0 15px rgba(255, 255, 255, 0.15);">
      <img src="https://openworldtradetime.com/openworld2022.jpeg" alt="OpenWorld Logo" style="width: 80px; height: 80px; margin-bottom: 20px; border-radius: 8px;">
      <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: bold;">${isLogin ? `Welcome Back, ${name}!` : `Welcome, ${name}!`}</h1>
    </div>
    <div style="background-color: #111; padding: 35px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1);">
      <p style="font-size: 18px; color: #1e40af;"><strong>Hello ${name},</strong></p>
      <p>${isLogin 
        ? 'Great to see you back at <strong>OpenWorld</strong> – India\'s first social network for Trading Time!' 
        : 'Thank you for joining <strong>OpenWorld</strong> – India\'s first social network for Trading Time!'} 
      Start by chatting with <strong>Mira</strong>, your AI friend, who helps you connect with anyone you wish. Build a strong profile so others can discover and connect with you.</p>
      
      <div style="background-color: #1a1a1a; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #1e40af;">
        <p style="font-size: 16px; margin: 0 0 15px 0; color: #ccc;"><strong>Get started in just a few steps:</strong></p>
        <ul style="padding-left: 20px; margin: 0; color: #ccc;">
          <li style="margin-bottom: 10px;">Chat with Mira to find connections</li>
          <li style="margin-bottom: 10px;">Complete your profile with skills and interests</li>
          <li style="margin-bottom: 10px;">Explore AI-powered match recommendations</li>
          <li style="margin-bottom: 0;">Check notifications at <a href="${clientURL}" style="color: #1e40af; text-decoration: none;">openworldtradetime.com</a> – we're in beta!</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${clientURL}" style="background: #1e40af; color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: 500; display: inline-block;">${isLogin ? 'Explore Now' : 'Get Started'}</a>
      </div>
      
      <p style="margin-bottom: 5px; color: #ccc;">We're in beta, so visit <a href="${clientURL}" style="color: #1e40af; text-decoration: none;">openworldtradetime.com</a> regularly to stay updated with notifications and new features.</p>
      <p style="margin-top: 0; color: #ccc;">Happy connecting!</p>
      
      <p style="margin-top: 25px; margin-bottom: 0; color: #666;">Best regards,<br>The OpenWorld Team</p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p>© 2025 OpenWorld. All rights reserved.</p>
      <p>
        <a href="${clientURL}/privacy" style="color: #1e40af; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
        <a href="${clientURL}/terms" style="color: #1e40af; text-decoration: none; margin: 0 10px;">Terms of Service</a>
        <a href="${clientURL}/contact" style="color: #1e40af; text-decoration: none; margin: 0 10px;">Contact Us</a>
      </p>
    </div>
  </body>
  </html>
  `;
}