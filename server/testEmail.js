
const nodemailer = require("nodemailer");

async function testEmail() {
  // Generate temporary Ethereal credentials
  const testAccount = await nodemailer.createTestAccount();

  console.log("Email:", testAccount.user);
  console.log("Password:", testAccount.pass);

  // Configure the test SMTP transporter
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // Send a test email
  const info = await transporter.sendMail({
    from: '"MIT-SoFT Admin" <admin@example.com>',
    to: "superadmin@example.com",
    subject: "Test Approval Notification",
    text: "A new content change request requires your approval.",
    html: `
      <h2>Approval Required</h2>
      <p>A new content change request is waiting for your review.</p>
    `,
  });

  console.log("Message sent:", info.messageId);
  console.log(
    "Preview email:",
    nodemailer.getTestMessageUrl(info)
  );
}

testEmail().catch((error) => {
  console.error("Email test failed:", error);
});
