import React, { useState } from 'react';
import Button from '../../../components/common/Button/Button';

const FileUploader = ({ onUpload, acceptedTypes = '.pdf,.jpg,.png' }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      setSelectedFile(null);
    }
  };

  return (
    <div className="file-uploader">
      <input type="file" onChange={handleFileSelect} accept={acceptedTypes} />
      {selectedFile && <p>Selected: {selectedFile.name}</p>}
      <Button onClick={handleUpload} disabled={!selectedFile}>Upload</Button>
    </div>
  );
};

export default FileUploader;