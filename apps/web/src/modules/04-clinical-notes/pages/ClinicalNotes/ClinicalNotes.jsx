import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../hooks/useAuth';
import DataTable from '../../../../components/common/DataTable/DataTable';
import Button from '../../../../components/common/Button/Button';
import clinicalNotesService from '../../services/clinicalNotesService';
import './ClinicalNotes.css';

const ClinicalNotes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const doctorId = user?._id || user?.id || user?.userId;
        const response = await clinicalNotesService.getNotesByDoctor(doctorId);
        const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        setNotes(list);
      } catch (error) {
        console.error('Failed to fetch clinical notes:', error);
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [user]);

  const columns = [
    { header: 'Date', accessor: 'visitDate' },
    { header: 'Patient', accessor: 'patientName' },
    { header: 'Chief Complaint', accessor: 'chiefComplaint' },
    { header: 'Status', accessor: 'status' }
  ];

  const tableData = notes.map((note) => ({
    id: note._id || note.id,
    visitDate: note.visitDate ? new Date(note.visitDate).toLocaleDateString() : 'N/A',
    patientName: note.patient?.name || note.patient?.fullName || 'Unknown',
    chiefComplaint: note.subjective?.chiefComplaint || 'Not specified',
    status: note.status || 'draft'
  }));

  return (
    <div className="clinical-notes">
      <h2>Clinical Notes</h2>
      <Button onClick={() => navigate('/doctor/clinical-notes/new')}>New Note</Button>
      {loading ? (
        <div>Loading notes...</div>
      ) : (
        <DataTable columns={columns} data={tableData} />
      )}
    </div>
  );
};

export default ClinicalNotes;