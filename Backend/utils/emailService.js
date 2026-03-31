// utils/emailService.js
import nodemailer from 'nodemailer';

// Note: dns.setDefaultResultOrder is a built-in Node.js function, no package needed!
// It's available in Node.js v17+ by default

// Force DNS resolution to use IPv4 (built-in Node.js, no external package needed)
if (typeof dns !== 'undefined') {
  try {
    const dns = await import('dns');
    dns.setDefaultResultOrder('ipv4first');
    console.log('✅ DNS set to prefer IPv4');
  } catch (error) {
    console.log('⚠️ DNS module not available, using default settings');
  }
}

// Create transporter with explicit IPv4 preference
const createTransporter = () => {
  // Skip if email is disabled
  if (process.env.EMAIL_ENABLED !== 'true') {
    console.log('📧 Email service disabled (EMAIL_ENABLED != true)');
    return null;
  }

  // Check if email configuration exists
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('⚠️ Email configuration incomplete, email disabled');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    // Force connection options
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    // Force IPv4 (this is a nodemailer option, works without dns package)
    family: 4,
    // TLS options
    tls: {
      rejectUnauthorized: false
    }
  });
};

let transporter = createTransporter();

// Verify connection only if transporter exists and email is enabled
if (transporter && process.env.EMAIL_ENABLED === 'true') {
  const verifyConnection = async () => {
    try {
      await transporter.verify();
      console.log('✅ Email service connected successfully');
    } catch (error) {
      console.log('⚠️ Email service not available (will retry on send)');
    }
  };
  verifyConnection().catch(() => {});
}

export const sendEmail = async ({ to, subject, html, text }) => {
  // Skip if email is disabled
  if (process.env.EMAIL_ENABLED !== 'true') {
    console.log(`📧 Email skipped (disabled): ${subject}`);
    return { success: true, skipped: true };
  }

  // Validate email configuration
  if (!transporter) {
    console.log('📧 Email skipped: transporter not configured');
    return null;
  }

  // Skip sending if no recipient
  if (!to || !to.includes('@')) {
    console.log('📧 Email skipped: Invalid email recipient:', to);
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
    console.log(`⚠️ Email failed: ${error.message}`);
    return null;
  }
};

export const sendRequestStatusEmail = async (visitor, request, status, notes) => {
  // Skip if email is disabled
  if (process.env.EMAIL_ENABLED !== 'true') {
    console.log(`📧 Status email skipped (disabled): ${status}`);
    return null;
  }

  // Skip if no visitor email
  if (!visitor?.email) {
    console.log('📧 Status email skipped: No visitor email');
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
    console.log(`⚠️ Failed to send status email: ${error.message}`);
    return null;
  }
};