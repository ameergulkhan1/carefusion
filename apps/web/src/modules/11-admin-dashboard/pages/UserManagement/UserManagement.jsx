import React, { useState } from 'react';
import DataTable from '../../../../components/common/DataTable/DataTable';
import Button from '../../../../components/common/Button/Button';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Patient', status: 'Active' },
    { id: 2, name: 'Dr. Smith', email: 'smith@example.com', role: 'Doctor', status: 'Active' }
  ]);

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: 'role' },
    { header: 'Status', accessor: 'status' }
  ];

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>User Management</h2>
        <Button>Add New User</Button>
      </div>
      <DataTable columns={columns} data={users} />
    </div>
  );
};

export default UserManagement;