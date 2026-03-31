// utils/emailService.js
import nodemailer from 'nodemailer';
import dns from 'dns';

// Force DNS resolution to use IPv4
dns.setDefaultResultOrder('ipv4first');

// Create transporter with explicit IPv4 preference
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    // Force connection options
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    // Disable IPv6 and force IPv4
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    },
    // Use specific IP family
    family: 4, // Force IPv4
    // Debug option
    debug: process.env.NODE_ENV === 'development'
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
    // Don't retry immediately to avoid blocking
    setTimeout(() => {
      transporter = createTransporter();
      verifyConnection();
    }, 5000);
  }
};

// Call verifyConnection but don't wait for it
verifyConnection().catch(console.error);

export const sendEmail = async ({ to, subject, html, text }) => {
  // Validate email configuration
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('Email configuration missing');
    return null; // Return null instead of throwing
  }

  // Skip sending if no recipient
  if (!to || !to.includes('@')) {
    console.error('Invalid email recipient:', to);
    return null;
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
    console.log(`✅ Email sent successfully to ${to}`);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', {
      to,
      subject,
      error: error.message,
      code: error.code
    });
    
    // Don't throw, just return null
    return null;
  }
};

export const sendRequestStatusEmail = async (visitor, request, status, notes) => {
  // Skip if no visitor email
  if (!visitor?.email) {
    console.log('No visitor email, skipping email');
    return null;
  }

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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Service Request Update</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${visitor.fullName || 'Valued Customer'}</strong>,</p>
          <p>Your service request for <strong>${request.service?.name || 'Service'}</strong> ${statusMessages[status] || `has been ${status}`}.</p>
          
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
    return null;
  }
};