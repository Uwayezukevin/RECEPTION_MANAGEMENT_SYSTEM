// utils/emailService.js - SendGrid Version
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAILFROM || process.env.EMAIL_USER || 'noreply@reception.com';

// Check if SendGrid is configured
const isSendGridConfigured = () => {
  return SENDGRID_API_KEY && SENDGRID_API_KEY.startsWith('SG.');
};

if (isSendGridConfigured()) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('✅ SendGrid initialized successfully');
} else {
  console.log('⚠️ SendGrid not configured. Email sending disabled.');
  console.log('   Add SENDGRID_API_KEY to your environment variables');
}

export const sendEmail = async ({ to, subject, html, text }) => {
  // Skip if SendGrid not configured
  if (!isSendGridConfigured()) {
    console.log(`📧 Email skipped: SendGrid not configured`);
    return { success: false, skipped: true, reason: 'SendGrid not configured' };
  }

  // Skip if no recipient
  if (!to || !to.includes('@')) {
    console.log(`📧 Email skipped: Invalid email: ${to}`);
    return null;
  }

  try {
    const msg = {
      to: to,
      from: EMAIL_FROM,
      subject: subject || 'Notification from Reception Management System',
      text: text || html?.replace(/<[^>]*>/g, '') || '',
      html: html || '',
      // Optional: Add tracking settings
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      }
    };

    const response = await sgMail.send(msg);
    console.log(`✅ Email sent successfully to ${to}`);
    return { success: true, messageId: response[0]?.headers?.['x-message-id'] };
  } catch (error) {
    console.error(`❌ Email failed to ${to}:`);
    console.error(`   Error: ${error.message}`);
    
    // Log detailed error response if available
    if (error.response?.body) {
      console.error(`   Details:`, JSON.stringify(error.response.body, null, 2));
    }
    
    return null;
  }
};

export const sendRequestStatusEmail = async (visitor, request, status, notes) => {
  // Skip if no visitor email
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

  const statusIcons = {
    approved: '✅',
    rejected: '❌',
    completed: '🎉'
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Service Request ${status.toUpperCase()}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
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
        .header p {
          margin: 10px 0 0;
          opacity: 0.9;
          font-size: 14px;
        }
        .content {
          padding: 30px;
          background: #ffffff;
        }
        .status-badge {
          display: inline-block;
          background: ${statusColors[status] || '#4CAF50'};
          color: white;
          padding: 8px 16px;
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
          border-left: 4px solid ${statusColors[status] || '#4CAF50'};
        }
        .request-details p {
          margin: 8px 0;
        }
        .request-details strong {
          color: #555;
        }
        .notes {
          background: #fff3cd;
          padding: 15px;
          margin: 20px 0;
          border-left: 4px solid #ffc107;
          border-radius: 4px;
        }
        .notes strong {
          color: #856404;
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
        @media only screen and (max-width: 600px) {
          .container {
            width: 100% !important;
          }
          .content {
            padding: 20px !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${statusIcons[status] || '📧'} Service Request ${status.toUpperCase()}</h1>
          <p>Update on your request #${request._id.toString().slice(-8).toUpperCase()}</p>
        </div>
        <div class="content">
          <p>Dear <strong>${visitor.fullName || 'Valued Customer'}</strong>,</p>
          
          <p>Your service request for <strong>${request.service?.name || 'Service'}</strong> ${statusMessages[status] || `has been ${status}`}.</p>
          
          <div class="status-badge">
            Status: ${status.toUpperCase()}
          </div>
          
          <div class="request-details">
            <h3 style="margin-top: 0; color: ${statusColors[status] || '#4CAF50'};">Request Details</h3>
            <p><strong>📋 Service:</strong> ${request.service?.name || 'N/A'}</p>
            <p><strong>📅 Event Date:</strong> ${new Date(request.eventDate).toLocaleDateString()}</p>
            <p><strong>⚡ Priority:</strong> ${request.priority || 'medium'}</p>
            <p><strong>🆔 Request ID:</strong> ${request._id.toString().slice(-8).toUpperCase()}</p>
            <p><strong>📝 Submitted:</strong> ${new Date(request.createdAt).toLocaleString()}</p>
          </div>
          
          ${notes ? `
            <div class="notes">
              <strong>📝 Staff Notes:</strong><br>
              ${notes}
            </div>
          ` : ''}
          
          ${status === "approved" ? '<p>✅ Your request has been approved and will be processed soon. You will receive another notification when it\'s completed.</p>' : ''}
          ${status === "rejected" ? '<p>❌ We regret to inform you that your request could not be approved at this time. If you have questions, please contact our support team.</p>' : ''}
          ${status === "completed" ? '<p>🎉 Your request has been completed successfully! Thank you for using our service.</p>' : ''}
          
          <p>Thank you for choosing our services!</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            This is an automated message from the Reception Management System.<br>
            Please do not reply to this email.
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Reception Management System. All rights reserved.</p>
          <p>Need help? Contact our support team at support@reception.com</p>
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
    
    if (result?.success) {
      console.log(`✅ Status email sent to ${visitor.email}`);
    }
    return result;
  } catch (error) {
    console.log(`⚠️ Failed to send status email: ${error.message}`);
    return null;
  }
};