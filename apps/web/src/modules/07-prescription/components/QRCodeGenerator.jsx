import React from 'react';
import QRCode from 'qrcode.react';

const QRCodeGenerator = ({ prescriptionId, data }) => {
  const qrData = JSON.stringify({
    prescriptionId,
    timestamp: new Date().toISOString(),
    ...data
  });

  return (
    <div className="qr-code-generator">
      <h3>Prescription QR Code</h3>
      <div className="qr-code-container">
        <QRCode value={qrData} size={200} />
      </div>
      <p>Scan this code to verify prescription</p>
    </div>
  );
};

export default QRCodeGenerator;