import React, { useState } from 'react';
import Button from '../../../../components/common/Button/Button';
import Card from '../../../../components/common/Card/Card';
import './UploadDocuments.css';

const UploadDocuments = () => {
  const [files, setFiles] = useState([]);

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    setFiles([...files, ...uploadedFiles]);
  };

  return (
    <div className="upload-documents">
      <Card title="Upload Medical Documents">
        <input type="file" multiple onChange={handleFileUpload} accept=".pdf,.jpg,.png" />
        <div className="file-list">
          {files.map((file, index) => (
            <div key={index} className="file-item">
              <span>{file.name}</span>
              <button onClick={() => setFiles(files.filter((_, i) => i !== index))}>Remove</button>
            </div>
          ))}
        </div>
        <Button>Upload Documents</Button>
      </Card>
    </div>
  );
};

export default UploadDocuments;