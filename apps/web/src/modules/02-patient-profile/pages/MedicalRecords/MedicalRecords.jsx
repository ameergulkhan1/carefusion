import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { patientService } from '../../services/patientService';
import './MedicalRecords.css';

const MedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    search: ''
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadData, setUploadData] = useState({
    documentType: '',
    documentDate: '',
    notes: '',
    tags: '',
    doctorName: '',
    hospitalName: ''
  });
  const [uploading, setUploading] = useState(false);
  const [aiSummarizing, setAiSummarizing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchRecords();
  }, [filters]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await patientService.getMedicalRecords(filters);
      if (response.success && response.data) {
        setRecords(response.data.records || []);
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error('Records fetch error:', error);
      toast.error(error.message || 'Failed to load medical records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      validateAndSetFiles(files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      validateAndSetFiles(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateAndSetFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF and image files are allowed');
      return false;
    }

    return true;
  };

  const validateAndSetFiles = (files) => {
    const validFiles = files.filter((file) => validateAndSetFile(file));
    if (validFiles.length === 0) return;

    setSelectedFiles((prev) => {
      const merged = [...prev, ...validFiles];
      const deduped = merged.filter((file, index, arr) => (
        arr.findIndex((item) => item.name === file.name && item.size === file.size) === index
      ));
      return deduped.slice(0, 10);
    });
  };

  const processAiClinicalSummary = async (reportFiles, latestRecords = []) => {
    if (!reportFiles.length) return;

    setAiSummarizing(true);
    try {
      const allReportFiles = await patientService.collectReportFilesForMasterSummary({
        records: latestRecords,
        newFiles: reportFiles
      });

      if (!allReportFiles.length) {
        toast.info('No readable report documents found for combined AI summary.');
        return null;
      }

      const context = {
        documentType: uploadData.documentType
      };

      const summaryResponse = await patientService.summarizePdfReports(allReportFiles, context);
      const summaryRecord = patientService.saveClinicalSummaryLocal({
        sourceFileNames: allReportFiles.map((file) => file.name),
        summary: summaryResponse.summary,
        documentDate: uploadData.documentDate || new Date().toISOString().split('T')[0]
      });

      const existingSummaryRecords = patientService.getSummaryRecords(latestRecords);
      for (const summaryItem of existingSummaryRecords) {
        try {
          await patientService.deleteMedicalRecord(summaryItem._id);
        } catch (deleteError) {
          console.warn('Failed to remove old AI summary record:', summaryItem?._id, deleteError);
        }
      }

      await patientService.uploadClinicalSummaryToRecords(summaryResponse, {
        documentDate: uploadData.documentDate,
        tags: uploadData.tags,
        doctorName: uploadData.doctorName,
        hospitalName: uploadData.hospitalName
      });

      // Final safety check: keep exactly one latest summary record.
      try {
        const refreshed = await patientService.getMedicalRecords({});
        const allSummaryRecords = patientService.getSummaryRecords(refreshed?.data?.records || []);
        const sorted = [...allSummaryRecords].sort((a, b) => {
          const aTime = new Date(a.updatedAt || a.createdAt || a.documentDate || 0).getTime();
          const bTime = new Date(b.updatedAt || b.createdAt || b.documentDate || 0).getTime();
          return bTime - aTime;
        });
        const toDelete = sorted.slice(1);
        for (const record of toDelete) {
          try {
            await patientService.deleteMedicalRecord(record._id);
          } catch (cleanupError) {
            console.warn('Failed to prune duplicate AI summary record:', record?._id, cleanupError);
          }
        }
      } catch (refreshError) {
        console.warn('Failed to verify single AI summary record after update:', refreshError);
      }

      patientService.downloadClinicalSummaryPdf(
        summaryResponse,
        'master-ai-clinical-summary.pdf'
      );

      toast.success(`Master AI clinical summary updated from ${allReportFiles.length} document(s)`);
      return summaryRecord;
    } catch (error) {
      toast.error(error.message || 'Uploaded, but AI summary generation failed');
      return null;
    } finally {
      setAiSummarizing(false);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    if (!uploadData.documentType) {
      toast.error('Please select document type');
      return;
    }

    try {
      setUploading(true);
      for (const file of selectedFiles) {
        await patientService.uploadMedicalRecord(file, uploadData);
      }

      const reportFiles = selectedFiles.filter((file) => (
        ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
      ));

      if (reportFiles.length > 0) {
        const latestRecordsResponse = await patientService.getMedicalRecords({});
        const latestRecords = latestRecordsResponse?.data?.records || [];
        await processAiClinicalSummary(reportFiles, latestRecords);
      } else {
        toast.info('Documents uploaded. AI summary is available for PDF and image reports only.');
      }

      toast.success(`Uploaded ${selectedFiles.length} document(s) successfully`);
      setShowUploadModal(false);
      resetUploadForm();
      fetchRecords();
    } catch (error) {
      toast.error(error.message || 'Failed to upload medical record');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setSelectedFiles([]);
    setUploadData({
      documentType: '',
      documentDate: '',
      notes: '',
      tags: '',
      doctorName: '',
      hospitalName: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      await patientService.deleteMedicalRecord(id);
      toast.success('Medical record deleted successfully');
      fetchRecords();
    } catch (error) {
      toast.error(error.message || 'Failed to delete medical record');
    }
  };

  const handleView = (record) => {
    setSelectedRecord(record);
    setShowViewer(true);
    setImageError(false);
  };

  const handleDownload = async (record) => {
    try {
      const response = await patientService.downloadMedicalRecord(record._id);
      window.open(response.data.url, '_blank');
    } catch (error) {
      toast.error(error.message || 'Failed to download medical record');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentIcon = (type) => {
    const icons = {
      lab_report: '🧪',
      prescription: '💊',
      xray: '🩻',
      mri: '🧲',
      ct_scan: '📷',
      ultrasound: '🔊',
      ecg: '💓',
      consultation_note: '📋',
      discharge_summary: '📄',
      vaccination_record: '💉',
      other: '📁'
    };
    return icons[type] || icons.other;
  };

  const filteredRecords = records;
  const selectedPdfCount = selectedFiles.filter((file) => file.type === 'application/pdf').length;
  const selectedImageCount = selectedFiles.length - selectedPdfCount;

  return (
    <div className="medical-records">
      <div className="page-header">
        <h1 className="page-title">Medical Records</h1>
        <p className="page-subtitle">View and manage your medical documents</p>
        <div className="ai-policy-banner">
          <div className="policy-badge">AI Summary Flow</div>
          <p>
            Upload PDF or image reports. The system automatically rebuilds one master summary from all your uploaded
            report documents, keeps it updated after each upload, and avoids irrelevant or repeated content.
          </p>
        </div>
      </div>

      <div className="records-controls">
        <div className="search-bar">
          <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search by document name, date, or type..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="lab_report">Lab Reports</option>
            <option value="prescription">Prescriptions</option>
            <option value="xray">X-Rays</option>
            <option value="mri">MRI Scans</option>
            <option value="ct_scan">CT Scans</option>
            <option value="ultrasound">Ultrasound</option>
            <option value="ecg">ECG</option>
            <option value="consultation_note">Consultation Notes</option>
            <option value="discharge_summary">Discharge Summary</option>
            <option value="vaccination_record">Vaccination Records</option>
            <option value="other">Other</option>
          </select>

          <button className="btn-upload" onClick={() => setShowUploadModal(true)}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Document
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3 className="empty-title">No medical records found</h3>
          <p className="empty-text">
            {filters.type || filters.search
              ? 'Try adjusting your filters'
              : 'Upload your first medical document to get started'}
          </p>
          <button className="btn-upload" onClick={() => setShowUploadModal(true)}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Document
          </button>
        </div>
      ) : (
        <div className="records-grid">
          {filteredRecords.map((record) => (
            <div key={record._id} className="record-card" onClick={() => handleView(record)}>
              <div className="record-header">
                <div className={`record-icon icon-${record.documentType}`}>
                  {getDocumentIcon(record.documentType)}
                </div>
                <span className={`record-type-badge icon-${record.documentType}`}>
                  {record.documentType.replace('_', ' ')}
                </span>
              </div>

              <div className="record-body">
                <h4 className="record-title">{record.fileName}</h4>
                <div className="record-meta">
                  <div className="record-meta-item">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(record.documentDate)}</span>
                  </div>
                  <div className="record-meta-item">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>{formatFileSize(record.fileSize)}</span>
                  </div>
                  {record.uploadedBy && (
                    <div className="record-meta-item">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{record.uploadedBy.fullName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="record-actions" onClick={(e) => e.stopPropagation()}>
                <button className="btn-action" onClick={() => handleView(record)}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </button>
                <button className="btn-action" onClick={() => handleDownload(record)}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
                <button className="btn-action delete" onClick={() => handleDelete(record._id)}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Upload Medical Document</h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="upload-form">
                <div
                  className="file-drop-zone"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="file-drop-icon">📁</div>
                  <p className="file-drop-text">Drop files here or click to browse</p>
                  <p className="file-drop-hint">Supported: PDF, JPG, PNG, WEBP (Max 10MB each, up to 10 files per upload)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="file-input"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    multiple
                    onChange={handleFileSelect}
                  />
                </div>

                {selectedFiles.length > 0 && (
                  <div>
                    <div className="selection-summary">
                      <span>{selectedFiles.length} selected</span>
                      <span>{selectedPdfCount} PDF</span>
                      <span>{selectedImageCount} image</span>
                      <span>AI ready: Yes</span>
                    </div>
                    {selectedFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="selected-file">
                        <div className="file-icon">📄</div>
                        <div className="file-info">
                          <p className="file-name">{file.name}</p>
                          <p className="file-size">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          className="btn-remove-file"
                          onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== index))}
                        >
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <p className="file-drop-hint" style={{ marginTop: '8px' }}>
                      Master summary policy: every new upload updates one combined summary across all report documents for this patient.
                    </p>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Document Type *</label>
                  <select
                    className="form-select"
                    value={uploadData.documentType}
                    onChange={(e) => setUploadData({ ...uploadData, documentType: e.target.value })}
                  >
                    <option value="">Select document type</option>
                    <option value="lab_report">Lab Report</option>
                    <option value="prescription">Prescription</option>
                    <option value="xray">X-Ray</option>
                    <option value="mri">MRI Scan</option>
                    <option value="ct_scan">CT Scan</option>
                    <option value="ultrasound">Ultrasound</option>
                    <option value="ecg">ECG</option>
                    <option value="consultation_note">Consultation Note</option>
                    <option value="discharge_summary">Discharge Summary</option>
                    <option value="vaccination_record">Vaccination Record</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Document Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={uploadData.documentDate}
                    onChange={(e) => setUploadData({ ...uploadData, documentDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Doctor Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Doctor who issued this document"
                    value={uploadData.doctorName}
                    onChange={(e) => setUploadData({ ...uploadData, doctorName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Hospital/Clinic Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Where was this document issued"
                    value={uploadData.hospitalName}
                    onChange={(e) => setUploadData({ ...uploadData, hospitalName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tags (comma-separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., urgent, follow-up, chronic"
                    value={uploadData.tags}
                    onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Additional notes about this document"
                    value={uploadData.notes}
                    onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                    rows="3"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowUploadModal(false)}>
                Cancel
              </button>
              <button
                className="btn-submit"
                onClick={handleUpload}
                disabled={uploading || aiSummarizing || selectedFiles.length === 0 || !uploadData.documentType}
              >
                {uploading ? 'Uploading...' : aiSummarizing ? 'Generating AI Summary...' : 'Upload Documents'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showViewer && selectedRecord && (
        <div className="modal-overlay viewer-modal" onClick={() => setShowViewer(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedRecord.fileName}</h3>
              <button className="modal-close" onClick={() => setShowViewer(false)}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="document-viewer">
                {imageError ? (
                  <div className="viewer-error">
                    <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>Failed to load document</p>
                  </div>
                ) : selectedRecord.mimeType === 'application/pdf' ? (
                  <iframe 
                    src={selectedRecord.documentUrl}
                    title={selectedRecord.fileName}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <img 
                    src={selectedRecord.documentUrl} 
                    alt={selectedRecord.fileName}
                    onError={() => {
                      setImageError(true);
                      toast.error('Failed to display image');
                    }}
                  />
                )}
              </div>
            </div>

            <div className="viewer-controls">
              <button className="viewer-btn" onClick={() => handleDownload(selectedRecord)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
              <button className="viewer-btn" onClick={() => window.print()}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;