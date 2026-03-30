import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html
    });
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

export const sendRequestStatusEmail = async (visitor, request, status, notes) => {
  const statusMessages = {
    approved: 'has been approved',
    rejected: 'has been rejected',
    completed: 'has been completed'
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .status { font-weight: bold; color: #4CAF50; }
        .notes { background: #fff3cd; padding: 10px; margin: 10px 0; border-left: 4px solid #ffc107; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Service Request Update</h1>
        </div>
        <div class="content">
          <p>Dear ${visitor.fullName},</p>
          <p>Your service request for <strong>${request.service.name}</strong> ${statusMessages[status]}.</p>
          <p><strong>Request Details:</strong></p>
          <ul>
            <li>Service: ${request.service.name}</li>
            <li>Status: <span class="status">${status.toUpperCase()}</span></li>
            <li>Date: ${new Date(request.eventDate).toLocaleDateString()}</li>
          </ul>
          ${notes ? `<div class="notes"><strong>Notes:</strong><br>${notes}</div>` : ''}
          <p>Thank you for using our service!</p>
        </div>
        <div class="footer">
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: visitor.email,
    subject: `Service Request ${status.toUpperCase()}`,
    html
  });
};