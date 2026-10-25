import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import doctorService from '../../../../services/doctorService';
import DataTable from '../../../../components/common/DataTable/DataTable';
import './DoctorPatientsList.css';

const DoctorPatientsList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPatients();
  }, [currentPage, searchTerm]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const filters = {
        page: currentPage,
        limit: 20,
        search: searchTerm
      };
      
      const response = await doctorService.getPatients(filters);
      
      if (response.success) {
        setPatients(response.data.patients || response.data || []);
        setTotalPages(response.data.totalPages || 1);
      } else {
        toast.error(response.message || 'Failed to fetch patients');
        setPatients([]);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPatients();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const columns = [
    {
      header: 'Patient Name',
      accessor: 'firstName',
      render: (value, row) => `${row.firstName} ${row.lastName}`
    },
    {
      header: 'Age',
      accessor: 'dateOfBirth',
      render: (value) => calculateAge(value)
    },
    {
      header: 'Gender',
      accessor: 'gender',
      render: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : 'N/A'
    },
    {
      header: 'Phone',
      accessor: 'contactNumber',
      render: (value, row) => value || row.phone || 'N/A'
    },
    {
      header: 'Email',
      accessor: 'email'
    },
    {
      header: 'Last Visit',
      accessor: 'lastAppointmentDate',
      render: (value) => formatDate(value)
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (value) => (
        <div className="action-buttons">
          <Link to={`/doctor/patients/${value}`} className="btn-view">
            View Details
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="doctor-patients-list">
      <div className="page-header">
        <h2>My Patients</h2>
      </div>

      <div className="search-section">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search patients by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading patients...</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="empty-state">
          <p>No patients found</p>
        </div>
      ) : (
        <>
          <DataTable columns={columns} data={patients} />
          
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DoctorPatientsList;
