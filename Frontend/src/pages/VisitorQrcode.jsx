// src/pages/VisitorQrcode.jsx
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FaHome, FaDownload, FaPrint, FaShareAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/image.png';

const VisitorQrcode = () => {
  const navigate = useNavigate();
  const visitorUrl = `${window.location.origin}/visitor-service`;
  
  const downloadQRCode = () => {
    const canvas = document.querySelector('.qr-code-canvas svg');
    if (canvas) {
      const svgData = new XMLSerializer().serializeToString(canvas);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.href = svgUrl;
      link.download = 'visitor-registration-qr.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(svgUrl);
      alert('QR Code downloaded successfully!');
    }
  };

  const printQRCode = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Visitor Registration QR Code</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
            }
            .qr-code {
              margin: 20px 0;
            }
            .logo {
              max-width: 100px;
              margin-bottom: 20px;
            }
            h2 {
              color: #2563eb;
              margin-bottom: 10px;
            }
            p {
              color: #666;
              margin-bottom: 20px;
            }
            .url {
              font-size: 12px;
              color: #999;
              word-break: break-all;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="${logo}" alt="Logo" class="logo" />
            <h2>Visitor Registration</h2>
            <p>Scan this QR code to register as a visitor</p>
            <div class="qr-code">
              <img src="${document.querySelector('.qr-code-canvas svg').outerHTML}" style="width: 200px; height: 200px;" />
            </div>
            <div class="url">${visitorUrl}</div>
            <p style="margin-top: 30px; font-size: 10px; color: #ccc;">Reception Management System</p>
          </div>
        </body>
      </html>
    `);
    printWindow.print();
    printWindow.close();
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Visitor Registration QR Code',
          text: 'Scan this QR code to register as a visitor',
          url: visitorUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(visitorUrl);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* QR Code Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-4 text-center">
            <img src={logo} alt="MININFRA Logo" className="h-12 mx-auto mb-2 bg-white rounded-lg p-1" />
            <h1 className="text-xl font-bold text-white">Visitor Registration</h1>
            <p className="text-primary-100 text-sm mt-1">Scan QR code to register</p>
          </div>
          
          {/* QR Code */}
          <div className="p-6 flex flex-col items-center">
            <div className="qr-code-canvas bg-white p-4 rounded-xl shadow-md border border-gray-200">
              <QRCodeSVG 
                value={visitorUrl}
                size={220}
                level="H"
                includeMargin={true}
                className="mx-auto"
              />
            </div>
            
            {/* URL Display */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 break-all bg-gray-50 p-2 rounded-lg">
                {visitorUrl}
              </p>
            </div>
            
            {/* Instructions */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                📱 Scan this QR code with your phone camera<br />
                to access the visitor registration form
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadQRCode}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FaDownload /> Download
            </button>
            <button
              onClick={printQRCode}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <FaPrint /> Print
            </button>
            <button
              onClick={shareQRCode}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <FaShareAlt /> Share
            </button>
          </div>
          
          {/* Back Button */}
          <div className="px-6 pb-6">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              <FaHome /> Back to Home
            </button>
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 text-center border-t border-gray-200">
            <p className="text-xs text-gray-400">
              This QR code links to the official visitor registration page
            </p>
          </div>
        </div>
        
        {/* Info Note */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Place this QR code at the reception desk for easy visitor access
          </p>
        </div>
      </div>
    </div>
  );
};

export default VisitorQrcode;