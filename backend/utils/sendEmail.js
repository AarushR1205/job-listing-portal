import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  try {
    let transporter;

    // Use SMTP defined in environment if exists, else use ethereal testing account
    if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD
        }
      });
    } else {
      // Generate test SMTP service account from ethereal.email
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[Email System] Using Ethereal Test Account: ${testAccount.user}`);
    }

    const message = {
      from: `${process.env.FROM_NAME || 'CareerBridge Admin'} <${process.env.FROM_EMAIL || 'noreply@careerbridge.com'}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html
    };

    const info = await transporter.sendMail(message);

    if (!process.env.SMTP_HOST) {
      console.log(`Email sent: ${info.messageId}`);
      console.log(`Preview Email: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

export default sendEmail;
