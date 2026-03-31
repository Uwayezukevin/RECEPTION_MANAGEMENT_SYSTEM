// utils/emailService.js
import nodemailer from 'nodemailer';

// Create transporter with better timeout and error handling
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // false for port 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    // Add these critical timeout settings
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000,
    socketTimeout: 30000,
    // For Gmail specifically
    tls: {
      rejectUnauthorized: false // Only use if having certificate issues
    }
  });
};

let transporter = createTransporter();

// Verify connection on startup
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service connected successfully');
  } catch (error) {
    console.error('❌ Email service connection failed:', error.message);
    // Retry after 5 seconds
    setTimeout(() => {
      transporter = createTransporter();
      verifyConnection();
    }, 5000);
  }
};

// Call this when your app starts
verifyConnection();

export const sendEmail = async ({ to, subject, html, text }) => {
  // Validate email configuration
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('Email configuration missing. Check environment variables.');
    throw new Error('Email service not configured properly');
  }

  // Validate recipient
  if (!to || !to.includes('@')) {
    console.error('Invalid email recipient:', to);
    throw new Error('Invalid email address');
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: subject || 'Notification from Reception System',
      text: text || html?.replace(/<[^>]*>/g, '') || '',
      html: html || ''
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', {
      to,
      subject,
      error: error.message,
      code: error.code,
      command: error.command
    });
    
    // If connection error, recreate transporter
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.log('🔄 Recreating transporter due to connection error...');
      transporter = createTransporter();
      await transporter.verify();
    }
    
    throw error;
  }
};

export const sendRequestStatusEmail = async (visitor, request, status, notes) => {
  const statusMessages = {
    approved: 'has been approved',
    rejected: 'has been rejected',
    completed: 'has been completed'
  };

  const statusColors = {
    approved: '#4CAF50',
    rejected: '#f44336',
    completed: '#2196F3'
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header { 
          background: ${statusColors[status] || '#4CAF50'}; 
          color: white; 
          padding: 30px; 
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content { 
          padding: 30px; 
          background: #ffffff;
        }
        .status-badge {
          display: inline-block;
          background: ${statusColors[status] || '#4CAF50'};
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          margin: 10px 0;
        }
        .request-details {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .request-details p {
          margin: 8px 0;
        }
        .notes { 
          background: #fff3cd; 
          padding: 15px; 
          margin: 20px 0; 
          border-left: 4px solid #ffc107; 
          border-radius: 4px;
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          background: #f8f9fa;
          color: #666; 
          font-size: 12px;
          border-top: 1px solid #e0e0e0;
        }
        .button {
          display: inline-block;
          background: ${statusColors[status] || '#4CAF50'};
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Service Request Update</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${visitor.fullName}</strong>,</p>
          <p>Your service request ${statusMessages[status]}.</p>
          
          <div class="request-details">
            <p><strong>📋 Service:</strong> ${request.service?.name || 'N/A'}</p>
            <p><strong>📅 Date:</strong> ${new Date(request.eventDate).toLocaleDateString()}</p>
            <p><strong>⚡ Priority:</strong> ${request.priority || 'medium'}</p>
            <p><strong>🏷️ Status:</strong> <span class="status-badge">${status.toUpperCase()}</span></p>
          </div>
          
          ${notes ? `
            <div class="notes">
              <strong>📝 Staff Notes:</strong><br>
              ${notes}
            </div>
          ` : ''}
          
          <p>You can track your request status at any time.</p>
          
          <p>Thank you for using our service!</p>
        </div>
        <div class="footer">
          <p>This is an automated message from Reception Management System.</p>
          <p>&copy; ${new Date().getFullYear()} Reception Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    return await sendEmail({
      to: visitor.email,
      subject: `Service Request ${status.toUpperCase()} - ${request.service?.name || 'Service'}`,
      html
    });
  } catch (error) {
    console.error('Failed to send status email:', error);
    // Don't throw - we don't want to break the request flow
    return null;
  }
};