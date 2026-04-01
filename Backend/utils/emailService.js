// utils/emailService.js
import nodemailer from 'nodemailer';
import dns from 'dns';

// Force IPv4 globally
dns.setDefaultResultOrder('ipv4first');

// Create transporter with Render-optimized settings
const createTransporter = () => {
  // Check if email configuration exists
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('⚠️ Email configuration incomplete, email disabled');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    // Force IPv4 and prevent IPv6 attempts
    family: 4,
    localAddress: '0.0.0.0', // Force IPv4
    // Render-specific settings
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false
    }
  });
};

let transporter = createTransporter();

// Verify connection (don't retry, just log)
if (transporter) {
  transporter.verify()
    .then(() => console.log('✅ Email service connected successfully'))
    .catch((err) => console.log('⚠️ Email service will use fallback:', err.message));
}

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.log(`📧 Email skipped: transporter not configured`);
    return null;
  }

  if (!to || !to.includes('@')) {
    console.log(`📧 Email skipped: Invalid email: ${to}`);
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
    // Don't log ENETUNREACH errors as errors, they're expected IPv6 fallback
    if (error.code === 'ENETUNREACH' || error.code === 'ETIMEDOUT') {
      console.log(`📧 Retrying email with IPv4...`);
      // Try one more time with explicit settings
      try {
        const fallbackTransporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          },
          family: 4,
          tls: { rejectUnauthorized: false }
        });
        
        const info = await fallbackTransporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to,
          subject,
          text: text || html?.replace(/<[^>]*>/g, '') || '',
          html
        });
        console.log(`✅ Email sent successfully to ${to} (IPv4 fallback)`);
        return info;
      } catch (fallbackError) {
        console.log(`⚠️ Email failed: ${fallbackError.message}`);
        return null;
      }
    }
    
    console.log(`⚠️ Email failed: ${error.message}`);
    return null;
  }
};

export const sendRequestStatusEmail = async (visitor, request, status, notes) => {
  if (!visitor?.email) {
    console.log('📧 Status email skipped: No visitor email');
    return null;
  }

  console.log(`📧 Preparing status email for ${visitor.email} - Status: ${status}`);

  const statusMessages = {
    approved: 'has been approved',
    rejected: 'has been rejected',
    completed: 'has been completed'
  };

  const statusColors = {
    approved: '#2ecc71',
    rejected: '#e74c3c',
    completed: '#3498db'
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: ${statusColors[status] || '#4CAF50'}; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; background: #ffffff; }
        .status-badge { display: inline-block; background: ${statusColors[status] || '#4CAF50'}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; margin: 10px 0; }
        .request-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .request-details p { margin: 8px 0; }
        .notes { background: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; background: #f8f9fa; color: #666; font-size: 12px; border-top: 1px solid #e0e0e0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Service Request ${status.toUpperCase()}</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${visitor.fullName || 'Valued Customer'}</strong>,</p>
          <p>Your service request for <strong>${request.service?.name || 'Service'}</strong> ${statusMessages[status] || `has been ${status}`}.</p>
          
          <div class="status-badge">
            Status: ${status.toUpperCase()}
          </div>
          
          <div class="request-details">
            <p><strong>📋 Service:</strong> ${request.service?.name || 'N/A'}</p>
            <p><strong>📅 Date:</strong> ${new Date(request.eventDate).toLocaleDateString()}</p>
            <p><strong>⚡ Priority:</strong> ${request.priority || 'medium'}</p>
            <p><strong>🆔 Request ID:</strong> ${request._id.toString().slice(-8).toUpperCase()}</p>
          </div>
          
          ${notes ? `
            <div class="notes">
              <strong>📝 Staff Notes:</strong><br>
              ${notes}
            </div>
          ` : ''}
          
          ${status === "approved" ? "<p>✅ Your request has been approved and will be processed soon.</p>" : ""}
          ${status === "rejected" ? "<p>❌ We regret to inform you that your request could not be approved at this time.</p>" : ""}
          ${status === "completed" ? "<p>🎉 Your request has been completed. Thank you for using our service!</p>" : ""}
          
          <p>Thank you for choosing our services!</p>
        </div>
        <div class="footer">
          <p>This is an automated message from Reception Management System.</p>
          <p>&copy; ${new Date().getFullYear()} Reception Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail({
      to: visitor.email,
      subject: `Service Request ${status.toUpperCase()} - ${request.service?.name || 'Service'}`,
      html
    });
    
    if (result) {
      console.log(`✅ Status email processed for ${visitor.email}`);
    }
    return result;
  } catch (error) {
    console.log(`⚠️ Failed to send status email: ${error.message}`);
    return null;
  }
};