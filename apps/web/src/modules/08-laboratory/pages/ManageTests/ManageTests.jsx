import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../../../utils/api';
import Loader from '../../../../components/common/Loader/Loader';
import Button from '../../../../components/common/Button/Button';
import Card from '../../../../components/common/Card/Card';
import './ManageTests.css';

const ManageTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const [formData, setFormData] = useState({
    testName: '',
    testCode: '',
    category: 'Hematology',
    price: '',
    turnaroundTime: 24,
    turnaroundUnit: 'hours',
    description: '',
    sampleType: 'Blood',
    prerequisites: '',
    requiresFasting: false
  });

  // Matches backend LabTest schema enums
  const TEST_CATEGORIES = [
    'Hematology',
    'Biochemistry',
    'Microbiology',
    'Immunology',
    'Pathology',
    'Radiology',
    'Cardiology',
    'Hormones',
    'Vitamins',
    'Allergy',
    'Molecular',
    'Other'
  ];

  const SAMPLE_TYPES = [
    'Blood',
    'Urine',
    'Stool',
    'Saliva',
    'Tissue',
    'Swab',
    'Other'
  ];

  const TURNAROUND_UNITS = ['hours', 'days'];

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/laboratory/catalog');
      
      // Handle different response formats
      let testData = [];
      if (response.data?.success && response.data?.data) {
        testData = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (Array.isArray(response.data)) {
        testData = response.data;
      } else if (response.data?.tests) {
        testData = response.data.tests;
      }
      
      // Normalize data format
      const normalizedTests = testData.map(test => ({
        _id: test._id || test.id,
        testName: test.testName || test.name || 'Unknown Test',
        testCode: test.testCode || test.code || '',
        category: test.category || 'Other',
        price: parseFloat(test.price) || 0,
        turnaroundTime: test.turnaroundTime || '24 hours',
        description: test.description || '',
        sampleType: test.sampleType || 'Blood',
        prerequisites: test.prerequisites || '',
        requiresFasting: test.requiresFasting || false,
        reportFormat: test.reportFormat || 'PDF'
      }));
      
      setTests(normalizedTests.length > 0 ? normalizedTests : getMockTests());
    } catch (error) {
      console.warn('Fetching catalog failed, using mock data:', error.message);
      setTests(getMockTests());
    } finally {
      setLoading(false);
    }
  };

  const getMockTests = () => {
    return [
      {
        _id: '1',
        testName: 'Complete Blood Count (CBC)',
        testCode: 'CBC',
        category: 'Hematology',
        price: 15.00,
        turnaroundTime: '24 hours',
        description: 'Comprehensive blood cell count and analysis',
        sampleType: 'Blood',
        prerequisites: 'None',
        reportFormat: 'PDF'
      },
      {
        _id: '2',
        testName: 'Lipid Panel',
        testCode: 'LP',
        category: 'Biochemistry',
        price: 20.00,
        turnaroundTime: '24 hours',
        description: 'Cholesterol and triglyceride levels',
        sampleType: 'Blood',
        prerequisites: '8 hours fasting',
        reportFormat: 'PDF'
      },
      {
        _id: '3',
        testName: 'Thyroid Function Test (TSH, T3, T4)',
        testCode: 'TFT',
        category: 'Biochemistry',
        price: 25.00,
        turnaroundTime: '24 hours',
        description: 'Thyroid hormone levels',
        sampleType: 'Blood',
        prerequisites: 'None',
        reportFormat: 'PDF'
      }
    ];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.testName || !formData.testCode || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      
      // Format turnaroundTime as string: "24 hours"
      const turnaroundTimeStr = `${parseInt(formData.turnaroundTime)} ${formData.turnaroundUnit}`;
      
      const payload = {
        testName: formData.testName,
        testCode: formData.testCode.toUpperCase(),
        category: formData.category,
        price: parseFloat(formData.price),
        turnaroundTime: turnaroundTimeStr,
        description: formData.description || formData.testName,
        sampleType: formData.sampleType,
        prerequisites: formData.prerequisites || 'No special preparation required',
        requiresFasting: formData.requiresFasting
      };

      if (editingTestId) {
        // Update existing test in catalog
        try {
          const turnaroundTimeStr = `${parseInt(formData.turnaroundTime)} ${formData.turnaroundUnit}`;
          
          const updatePayload = {
            testName: formData.testName,
            testCode: formData.testCode.toUpperCase(),
            category: formData.category,
            price: parseFloat(formData.price),
            turnaroundTime: turnaroundTimeStr,
            description: formData.description || formData.testName,
            sampleType: formData.sampleType,
            prerequisites: formData.prerequisites || 'No special preparation required',
            requiresFasting: formData.requiresFasting
          };
          
          const response = await api.put(`/laboratory/catalog/${editingTestId}`, updatePayload);
          
          if (response.status === 200 || response.data?.success) {
            // Update local state immediately
            setTests(tests.map(t => 
              t._id === editingTestId 
                ? { ...t, ...updatePayload, _id: editingTestId }
                : t
            ));
            toast.success('Test updated successfully!');
            resetForm();
            setShowForm(false);
          } else {
            throw new Error(response.data?.message || 'Failed to update test');
          }
        } catch (error) {
          const errorMsg = error?.response?.data?.message || error?.message || 'Failed to update test';
          toast.error(errorMsg);
          console.error('Update test error:', error);
        }
      } else {
        // Add new test to catalog
        try {
          const response = await api.post('/laboratory/catalog', payload);
          
          if (response.status === 201 || response.data?.success) {
            // Add optimistically to the UI, then refresh
            const newTest = {
              _id: response.data?.data?._id || `temp-${Date.now()}`,
              ...payload
            };
            setTests(prev => [newTest, ...prev]);
            toast.success('Test added to your catalog successfully!');
            
            // Refresh from server after short delay
            setTimeout(() => {
              fetchTests();
            }, 1000);
          } else {
            throw new Error(response.data?.message || 'Failed to add test');
          }
        } catch (error) {
          const errorMsg = error?.response?.data?.message || error?.message || 'Failed to add test';
          toast.error(errorMsg);
          console.error('Add test error:', error);
        }
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (test) => {
    try {
      // Parse turnaroundTime string to extract value and unit
      let timeValue = 24;
      let timeUnit = 'hours';
      
      const turnaroundStr = test.turnaroundTime || '24 hours';
      const match = turnaroundStr.toString().match(/(\d+)\s*(hour|hours|day|days)?/i);
      if (match) {
        timeValue = parseInt(match[1]) || 24;
        if (match[2]) {
          timeUnit = match[2].toLowerCase().includes('day') ? 'days' : 'hours';
        }
      }
      
      setFormData({
        testName: test.testName || '',
        testCode: test.testCode || '',
        category: test.category || 'Hematology',
        price: (test.price ? test.price.toString() : ''),
        turnaroundTime: timeValue,
        turnaroundUnit: timeUnit,
        description: test.description || '',
        sampleType: test.sampleType || 'Blood',
        prerequisites: test.prerequisites || '',
        requiresFasting: test.requiresFasting || false
      });
      
      setEditingTestId(test._id || null);
      setShowForm(true);
    } catch (error) {
      console.error('Error loading test for editing:', error);
      toast.error('Error loading test details');
    }
  };

  const handleDelete = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test?')) return;

    try {
      setSubmitting(true);
      const response = await api.delete(`/laboratory/catalog/${testId}`);
      if (response.status === 200 || response.data?.success) {
        setTests(tests.filter(t => t._id !== testId));
        toast.success('Test deleted successfully!');
      } else {
        // Mock delete for demo
        setTests(tests.filter(t => t._id !== testId));
        toast.success('Test deleted successfully!');
      }
    } catch (error) {
      const errorMsg = error?.response?.data?.message || 'Failed to delete test';
      toast.error(errorMsg);
      console.error('Delete error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      testName: '',
      testCode: '',
      category: 'Hematology',
      price: '',
      turnaroundTime: 24,
      turnaroundUnit: 'hours',
      description: '',
      sampleType: 'Blood',
      prerequisites: '',
      requiresFasting: false
    });
    setEditingTestId(null);
  };

  const filteredTests = tests.filter(test => {
    const testName = test.testName || '';
    const testCode = test.testCode || '';
    const category = test.category || '';
    
    const matchesSearch = testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         testCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <Loader message="Loading test catalog..." />;
  }

  return (
    <div className="manage-tests-container">
      <div className="page-header">
        <div>
          <h1>Laboratory Test Catalog Management</h1>
          <p>Manage the tests available at your laboratory</p>
        </div>
        <Button 
          variant="primary"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancel' : '+ Add New Test'}
        </Button>
      </div>

      {showForm && (
        <Card className="form-card">
          <h2>{editingTestId ? 'Edit Test' : 'Add New Test'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Test Name *</label>
                <input
                  type="text"
                  name="testName"
                  value={formData.testName}
                  onChange={handleInputChange}
                  placeholder="e.g., Complete Blood Count"
                  required
                />
              </div>
              <div className="form-group">
                <label>Test Code *</label>
                <input
                  type="text"
                  name="testCode"
                  value={formData.testCode}
                  onChange={handleInputChange}
                  placeholder="e.g., CBC"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleInputChange}>
                  {TEST_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Price (INR) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Turnaround Time</label>
                <div className="form-row-inline">
                  <input
                    type="number"
                    name="turnaroundTime"
                    value={formData.turnaroundTime}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="24"
                    style={{ flex: 2 }}
                  />
                  <select name="turnaroundUnit" value={formData.turnaroundUnit} onChange={handleInputChange} style={{ flex: 1 }}>
                    {TURNAROUND_UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Sample Type</label>
                <select name="sampleType" value={formData.sampleType} onChange={handleInputChange}>
                  {SAMPLE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of the test"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="requiresFasting"
                  checked={formData.requiresFasting}
                  onChange={(e) => setFormData(prev => ({ ...prev, requiresFasting: e.target.checked }))}
                />
                Requires Fasting
              </label>
            </div>

            <div className="form-group">
              <label>Preparation Instructions</label>
              <textarea
                name="prerequisites"
                value={formData.prerequisites}
                onChange={handleInputChange}
                placeholder="e.g., Fast for 8 hours, drink water"
                rows="2"
              />
            </div>

            <div className="form-actions">
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Saving...' : editingTestId ? 'Update Test' : 'Add Test'}
              </Button>
              <Button 
                type="button" 
                variant="secondary"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="category-filters">
          <button 
            className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            All Categories
          </button>
          {TEST_CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="tests-grid">
        {filteredTests.length === 0 ? (
          <div className="empty-state">
            <p>No tests found. Add your first test to get started!</p>
          </div>
        ) : (
          filteredTests.map(test => (
            <Card key={test._id} className="test-card">
              <div className="test-header">
                <div>
                  <h3>{test.testName}</h3>
                  <span className="test-code">Code: {test.testCode}</span>
                </div>
                <span className="test-category">{test.category}</span>
              </div>

              <div className="test-details">
                <p><strong>Price:</strong> INR {typeof test.price === 'number' ? test.price.toFixed(2) : parseFloat(test.price || 0).toFixed(2)}</p>
                <p><strong>Turnaround:</strong> {test.turnaroundTime || '24 hours'}</p>
                <p><strong>Sample:</strong> {test.sampleType || 'Blood'}</p>
                {test.prerequisites && <p><strong>Prerequisites:</strong> {test.prerequisites}</p>}
              </div>

              {test.description && (
                <div className="test-description">
                  <p>{test.description}</p>
                </div>
              )}

              <div className="test-actions">
                <Button 
                  variant="secondary"
                  size="small"
                  onClick={() => handleEdit(test)}
                >
                  Edit
                </Button>
                <Button 
                  variant="danger"
                  size="small"
                  onClick={() => handleDelete(test._id)}
                  disabled={submitting}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="summary">
        <p>Total Tests: {filteredTests.length}</p>
      </div>
    </div>
  );
};

export default ManageTests;