import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== EXPORT TO PDF WITH SIGNATURES ====================
export const ExportMeetingToPDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await Meeting.findById(id)
      .populate('createdBy', 'fullName email');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        msg: "Meeting not found"
      });
    }

    // Create PDF document
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      bufferPages: true
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=meeting_${meeting.title.replace(/\s/g, '_')}_${meeting.meetingDate.toISOString().split('T')[0]}.pdf`);
    
    doc.pipe(res);
    
    // Add header with logo placeholder
    doc.fontSize(24).font('Helvetica-Bold').text(meeting.title, { align: 'center' });
    doc.moveDown(0.5);
    
    // Meeting details section
    doc.fontSize(12).font('Helvetica');
    doc.text(`Date: ${new Date(meeting.meetingDate).toLocaleDateString()}`, { align: 'center' });
    doc.text(`Time: ${meeting.startTime} - ${meeting.endTime}`, { align: 'center' });
    doc.text(`Location: ${meeting.location}`, { align: 'center' });
    doc.moveDown();
    
    // Meeting info box
    doc.fontSize(14).font('Helvetica-Bold').text('Meeting Information', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Description: ${meeting.description}`);
    doc.text(`Meeting Leader: ${meeting.meetingLeader.name}`);
    doc.text(`Position: ${meeting.meetingLeader.position}`);
    if (meeting.meetingLeader.department) {
      doc.text(`Department: ${meeting.meetingLeader.department}`);
    }
    doc.text(`Meeting Type: ${meeting.meetingType.toUpperCase()}`);
    doc.text(`Status: ${meeting.status.toUpperCase()}`);
    doc.moveDown();
    
    // Statistics
    doc.fontSize(12).font('Helvetica-Bold').text(`Total Participants: ${meeting.participants.length}`);
    doc.moveDown();
    
    // Participants list with signatures
    doc.fontSize(14).font('Helvetica-Bold').text('Participants & Signatures', { underline: true });
    doc.moveDown();
    
    let yPos = doc.y;
    
    for (let i = 0; i < meeting.participants.length; i++) {
      const p = meeting.participants[i];
      
      // Check if we need a new page
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }
      
      // Participant card background
      doc.rect(50, yPos - 5, 500, 100).fill('#f9f9f9');
      
      // Participant number and name
      doc.fontSize(11).font('Helvetica-Bold').fillColor('black');
      doc.text(`${i + 1}. ${p.fullName}`, 60, yPos);
      
      // Participant details
      doc.fontSize(10).font('Helvetica');
      doc.text(`Institution: ${p.institution}`, 60, yPos + 15);
      doc.text(`Position: ${p.position}`, 60, yPos + 30);
      if (p.email) doc.text(`Email: ${p.email}`, 60, yPos + 45);
      doc.text(`Signed At: ${new Date(p.signedAt).toLocaleString()}`, 60, yPos + 60);
      
      // Add signature image
      if (p.signature) {
        try {
          // Remove data:image prefix if present
          let signatureBase64 = p.signature;
          if (signatureBase64.includes('base64,')) {
            signatureBase64 = signatureBase64.split('base64,')[1];
          }
          
          const signatureBuffer = Buffer.from(signatureBase64, 'base64');
          doc.image(signatureBuffer, 400, yPos, { width: 100, height: 40, fit: [100, 40] });
          doc.text('Signature:', 400, yPos - 15);
        } catch (err) {
          doc.text('[Signature not available]', 400, yPos + 10);
        }
      } else {
        doc.text('[No signature]', 400, yPos + 10);
      }
      
      yPos += 100;
      
      // Add separator line
      if (i < meeting.participants.length - 1) {
        doc.strokeColor('#cccccc').lineWidth(0.5);
        doc.moveTo(50, yPos - 5).lineTo(550, yPos - 5).stroke();
      }
    }
    
    // Add footer with page numbers
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8);
      doc.text(
        `Generated on ${new Date().toLocaleString()} - Page ${i + 1} of ${pageCount}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
    }
    
    doc.end();
    
  } catch (err) {
    console.error("Error exporting PDF:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

// ==================== EXPORT TO EXCEL WITH SIGNATURES ====================
export const ExportMeetingToExcel = async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await Meeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        msg: "Meeting not found"
      });
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Reception Management System';
    workbook.created = new Date();
    
    // Add Meeting Info Sheet
    const infoSheet = workbook.addWorksheet('Meeting Information');
    infoSheet.getColumn('A').width = 25;
    infoSheet.getColumn('B').width = 50;
    
    infoSheet.addRow(['Meeting Title', meeting.title]);
    infoSheet.addRow(['Description', meeting.description]);
    infoSheet.addRow(['Date', new Date(meeting.meetingDate).toLocaleDateString()]);
    infoSheet.addRow(['Time', `${meeting.startTime} - ${meeting.endTime}`]);
    infoSheet.addRow(['Location', meeting.location]);
    infoSheet.addRow(['Meeting Leader', meeting.meetingLeader.name]);
    infoSheet.addRow(['Leader Position', meeting.meetingLeader.position]);
    infoSheet.addRow(['Leader Department', meeting.meetingLeader.department || 'N/A']);
    infoSheet.addRow(['Meeting Type', meeting.meetingType]);
    infoSheet.addRow(['Status', meeting.status]);
    infoSheet.addRow(['Total Participants', meeting.participants.length]);
    infoSheet.addRow(['Generated On', new Date().toLocaleString()]);
    
    // Style the info sheet
    infoSheet.getRow(1).font = { bold: true, size: 14 };
    infoSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4CAF50' }
    };
    
    // Add Participants Sheet
    const participantsSheet = workbook.addWorksheet('Participants with Signatures');
    
    // Set columns
    participantsSheet.columns = [
      { header: '#', key: 'no', width: 8 },
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Institution', key: 'institution', width: 30 },
      { header: 'Position', key: 'position', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Signed At', key: 'signedAt', width: 20 }
    ];
    
    // Style header row
    participantsSheet.getRow(1).font = { bold: true, size: 12 };
    participantsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2196F3' }
    };
    
    // Add participants data
    meeting.participants.forEach((p, index) => {
      const row = participantsSheet.addRow({
        no: index + 1,
        fullName: p.fullName,
        institution: p.institution,
        position: p.position,
        email: p.email || 'N/A',
        signedAt: new Date(p.signedAt).toLocaleString()
      });
      
      // Add height for signature row
      row.height = 60;
    });
    
    // Add Signatures Sheet (separate sheet with images)
    const signaturesSheet = workbook.addWorksheet('Signatures');
    signaturesSheet.columns = [
      { header: '#', key: 'no', width: 8 },
      { header: 'Participant Name', key: 'name', width: 30 },
      { header: 'Signature', key: 'signature', width: 40 }
    ];
    
    // Style signatures header
    signaturesSheet.getRow(1).font = { bold: true, size: 12 };
    signaturesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF9800' }
    };
    
    // Add signatures as images
    for (let i = 0; i < meeting.participants.length; i++) {
      const p = meeting.participants[i];
      const rowNum = i + 2; // +2 because row 1 is header
      
      signaturesSheet.getCell(`A${rowNum}`).value = i + 1;
      signaturesSheet.getCell(`B${rowNum}`).value = p.fullName;
      
      // Add signature image if exists
      if (p.signature) {
        try {
          let signatureBase64 = p.signature;
          if (signatureBase64.includes('base64,')) {
            signatureBase64 = signatureBase64.split('base64,')[1];
          }
          
          const signatureBuffer = Buffer.from(signatureBase64, 'base64');
          const imageId = workbook.addImage({
            buffer: signatureBuffer,
            extension: 'png'
          });
          
          // Add image to cell
          signaturesSheet.addImage(imageId, {
            tl: { col: 2, row: rowNum - 1 },
            ext: { width: 150, height: 40 }
          });
          
          signaturesSheet.getRow(rowNum).height = 50;
        } catch (err) {
          signaturesSheet.getCell(`C${rowNum}`).value = '[Signature not available]';
        }
      } else {
        signaturesSheet.getCell(`C${rowNum}`).value = '[No signature]';
      }
    }
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=meeting_${meeting.title.replace(/\s/g, '_')}_${meeting.meetingDate.toISOString().split('T')[0]}.xlsx`);
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (err) {
    console.error("Error exporting Excel:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

// ==================== EXPORT TO HTML WITH SIGNATURES ====================
export const ExportMeetingToHTML = async (req, res) => {
  try {
    const { id } = req.params;
    
    const meeting = await Meeting.findById(id)
      .populate('createdBy', 'fullName email');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        msg: "Meeting not found"
      });
    }

    // Generate HTML content
    const htmlContent = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${meeting.title} - Attendance Report</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f5f5f5;
          padding: 40px;
          color: #333;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 32px;
          margin-bottom: 10px;
        }
        
        .meeting-info {
          padding: 30px;
          background: #f8f9fa;
          border-bottom: 1px solid #e0e0e0;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }
        
        .info-card {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .info-card h3 {
          color: #667eea;
          margin-bottom: 10px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .info-card p {
          font-size: 16px;
          font-weight: 500;
        }
        
        .stats {
          background: white;
          padding: 20px 30px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .stats h2 {
          color: #333;
        }
        
        .badge {
          background: #4CAF50;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
        }
        
        .participants {
          padding: 30px;
        }
        
        .participant-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          transition: box-shadow 0.3s;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .participant-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .participant-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #f0f0f0;
        }
        
        .participant-name {
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }
        
        .participant-number {
          background: #667eea;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
        }
        
        .participant-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
        }
        
        .detail-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        
        .detail-value {
          font-size: 14px;
          color: #333;
        }
        
        .signature-section {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          margin-top: 10px;
        }
        
        .signature-title {
          font-size: 12px;
          color: #666;
          margin-bottom: 10px;
          font-weight: bold;
        }
        
        .signature-image {
          max-width: 300px;
          max-height: 80px;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 10px;
          background: white;
        }
        
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #e0e0e0;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .participant-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .header {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${meeting.title}</h1>
          <p>Meeting Attendance Report with Signatures</p>
        </div>
        
        <div class="meeting-info">
          <div class="info-card">
            <h3>📅 Date & Time</h3>
            <p>${new Date(meeting.meetingDate).toLocaleDateString()} at ${meeting.startTime} - ${meeting.endTime}</p>
          </div>
          <div class="info-card">
            <h3>📍 Location</h3>
            <p>${meeting.location}</p>
          </div>
          <div class="info-card">
            <h3>👨‍💼 Meeting Leader</h3>
            <p>${meeting.meetingLeader.name} (${meeting.meetingLeader.position})</p>
          </div>
          <div class="info-card">
            <h3>📋 Meeting Type</h3>
            <p>${meeting.meetingType.toUpperCase()}</p>
          </div>
        </div>
        
        <div class="stats">
          <h2>📝 Participants List</h2>
          <div class="badge">Total: ${meeting.participants.length}</div>
        </div>
        
        <div class="participants">
          ${meeting.participants.map((p, index) => `
            <div class="participant-card">
              <div class="participant-header">
                <span class="participant-name">${p.fullName}</span>
                <span class="participant-number">#${index + 1}</span>
              </div>
              <div class="participant-details">
                <div class="detail-item">
                  <span class="detail-label">🏢 Institution</span>
                  <span class="detail-value">${p.institution}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">💼 Position</span>
                  <span class="detail-value">${p.position}</span>
                </div>
                ${p.email ? `
                <div class="detail-item">
                  <span class="detail-label">📧 Email</span>
                  <span class="detail-value">${p.email}</span>
                </div>
                ` : ''}
                <div class="detail-item">
                  <span class="detail-label">⏰ Signed At</span>
                  <span class="detail-value">${new Date(p.signedAt).toLocaleString()}</span>
                </div>
              </div>
              <div class="signature-section">
                <div class="signature-title">✍️ Digital Signature</div>
                ${p.signature ? 
                  `<img src="${p.signature}" class="signature-image" alt="${p.fullName}'s signature" />` : 
                  '<p>No signature provided</p>'
                }
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>Reception Management System - Official Meeting Report</p>
        </div>
      </div>
    </body>
    </html>`;
    
    // Send HTML file
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=meeting_${meeting.title.replace(/\s/g, '_')}_${meeting.meetingDate.toISOString().split('T')[0]}.html`);
    res.send(htmlContent);
    
  } catch (err) {
    console.error("Error exporting HTML:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};

// ==================== EXPORT TO ZIP WITH ALL FORMATS ====================
export const ExportMeetingToAllFormats = async (req, res) => {
  try {
    const { id } = req.params;
    const archiver = (await import('archiver')).default;
    
    const meeting = await Meeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        msg: "Meeting not found"
      });
    }
    
    // Create zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=meeting_export_${meeting._id}.zip`);
    
    archive.pipe(res);
    
    // Add PDF (would need to implement PDF generation in memory)
    // Add Excel
    // Add HTML
    // Add JSON data
    
    // Add meeting data as JSON
    const jsonData = JSON.stringify({
      meeting: {
        title: meeting.title,
        description: meeting.description,
        date: meeting.meetingDate,
        location: meeting.location,
        meetingLeader: meeting.meetingLeader,
        participants: meeting.participants.map(p => ({
          ...p.toObject(),
          signature: p.signature ? '[SIGNATURE_PRESENT]' : null
        }))
      },
      exportedAt: new Date()
    }, null, 2);
    
    archive.append(jsonData, { name: 'meeting_data.json' });
    
    // Finalize archive
    await archive.finalize();
    
  } catch (err) {
    console.error("Error creating zip export:", err);
    res.status(500).json({
      success: false,
      msg: err.message
    });
  }
};