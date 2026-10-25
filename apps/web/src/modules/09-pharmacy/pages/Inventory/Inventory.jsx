import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import pharmacyService from '../../services/pharmacyService';
import './Inventory.css';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all, low, out
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    medicineName: '',
    genericName: '',
    category: '',
    manufacturer: '',
    dosageForm: '',
    strength: '',
    currentStock: 0,
    reorderLevel: 0,
    unitPrice: 0,
    expiryDate: '',
    batchNumber: '',
    description: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await pharmacyService.getInventory();
      setInventory(response.data || response);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      // Transform formData to match backend expectations
      const itemData = {
        name: formData.medicineName,
        genericName: formData.genericName || '',
        manufacturer: formData.manufacturer,
        category: formData.category,
        dosageForm: formData.dosageForm || 'Tablet',
        strength: formData.strength || '100mg',
        stock: parseInt(formData.currentStock) || 0,
        price: parseFloat(formData.unitPrice) || 0,
        description: formData.description || ''
      };
      await pharmacyService.addInventoryItem(itemData);
      toast.success('Item added successfully');
      setShowAddModal(false);
      resetForm();
      fetchInventory();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error(error.message || 'Failed to add item');
    }
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    try {
      // Transform formData to match backend expectations
      const updateData = {
        stock: parseInt(formData.currentStock) || 0,
        price: parseFloat(formData.unitPrice) || 0
      };
      await pharmacyService.updateInventoryItem(selectedItem._id || selectedItem.id, updateData);
      toast.success('Item updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchInventory();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error(error.message || 'Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await pharmacyService.deleteInventoryItem(itemId);
      toast.success('Item deleted successfully');
      fetchInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleReorder = async (itemId) => {
    const item = inventory.find((entry) => (entry._id || entry.id) === itemId);
    const medicineData = item?.medicineId || item;
    const medicineName = medicineData?.name || item?.medicineName || 'this medicine';
    toast.info(`Use inventory update to restock ${medicineName}. Auto-reorder API is not enabled yet.`);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    const medicineData = item.medicineId || item;
    setFormData({
      medicineName: medicineData.name || item.medicineName || '',
      genericName: medicineData.genericName || item.genericName || '',
      category: medicineData.category || item.category || item.medicineCategory || '',
      manufacturer: medicineData.manufacturer || item.manufacturer || '',
      dosageForm: medicineData.dosageForm || item.dosageForm || '',
      strength: medicineData.strength || item.strength || '',
      currentStock: item.currentStock || item.stock || 0,
      reorderLevel: item.reorderLevel || item.minimumStock || 0,
      unitPrice: item.unitPrice || item.price || 0,
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
      batchNumber: item.batchNumber || '',
      description: medicineData.description || item.description || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      medicineName: '',
      genericName: '',
      category: '',
      manufacturer: '',
      dosageForm: '',
      strength: '',
      currentStock: 0,
      reorderLevel: 0,
      unitPrice: 0,
      expiryDate: '',
      batchNumber: '',
      description: ''
    });
    setSelectedItem(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStockStatus = (item) => {
    const stock = item.currentStock || item.stock || 0;
    const reorderLevel = item.reorderLevel || item.minimumStock || 0;

    if (stock === 0) return 'out';
    if (stock <= reorderLevel) return 'low';
    return 'normal';
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 90; // Expiring within 3 months
  };

  const filteredInventory = inventory.filter(item => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const medicineData = item.medicineId || item;
    const medicineName = (medicineData.name || item.medicineName || '').toLowerCase();
    const manufacturer = (medicineData.manufacturer || item.manufacturer || '').toLowerCase();
    const batchNumber = (item.batchNumber || '').toLowerCase();
    
    const matchesSearch = medicineName.includes(searchLower) ||
                          manufacturer.includes(searchLower) ||
                          batchNumber.includes(searchLower);

    // Category filter
    const itemCategory = medicineData.category || item.category || item.medicineCategory || '';
    const matchesCategory = categoryFilter === 'all' || itemCategory === categoryFilter;

    // Stock filter
    const stockStatus = getStockStatus(item);
    const matchesStock = stockFilter === 'all' || 
                         (stockFilter === 'low' && stockStatus === 'low') ||
                         (stockFilter === 'out' && stockStatus === 'out');

    return matchesSearch && matchesCategory && matchesStock;
  });

  const categories = [...new Set(inventory.map(item => {
    const medicineData = item.medicineId || item;
    return medicineData.category || item.category || item.medicineCategory;
  }).filter(Boolean))];

  if (loading) {
    return (
      <div className="inventory-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Inventory Management</h1>
          <p className="subtitle">Manage medicine stock and inventory</p>
        </div>
        <button className="btn-add" onClick={() => setShowAddModal(true)}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      </div>

      <div className="page-controls">
        <div className="search-box">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by medicine name, manufacturer, or batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Category:</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Stock Status:</label>
            <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
              <option value="all">All Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      <div className="inventory-grid">
        {filteredInventory.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3>No items found</h3>
            <p>There are no items matching your filters</p>
          </div>
        ) : (
          filteredInventory.map(item => {
            const stockStatus = getStockStatus(item);
            const expiringSoon = isExpiringSoon(item.expiryDate);
            const medicineData = item.medicineId || item;
            const medicineName = medicineData.name || item.medicineName || 'Unknown Medicine';
            const category = medicineData.category || item.category || item.medicineCategory || 'N/A';
            const manufacturer = medicineData.manufacturer || item.manufacturer || 'N/A';

            return (
              <div key={item._id || item.id} className={`inventory-card stock-${stockStatus}`}>
                <div className="card-header">
                  <div className="card-title">
                    <h3>{medicineName}</h3>
                    <span className="category-badge">{category}</span>
                  </div>
                  {expiringSoon && (
                    <span className="expiry-warning">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Expiring Soon
                    </span>
                  )}
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="info-label">Manufacturer:</span>
                    <span className="info-value">{manufacturer}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Batch Number:</span>
                    <span className="info-value">{item.batchNumber || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Unit Price:</span>
                    <span className="info-value">{formatCurrency(item.unitPrice || item.price)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Expiry Date:</span>
                    <span className="info-value">
                      {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <div className="stock-section">
                    <div className="stock-header">
                      <span className="stock-label">Current Stock</span>
                      <span className={`stock-value stock-${stockStatus}`}>
                        {item.currentStock || item.stock || 0}
                      </span>
                    </div>
                    <div className="stock-bar">
                      <div 
                        className={`stock-progress stock-${stockStatus}`}
                        style={{ 
                          width: `${Math.min(100, ((item.currentStock || item.stock || 0) / Math.max(1, item.reorderLevel || item.minimumStock || 1)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="stock-footer">
                      <span className="reorder-text">
                        Reorder at: {item.reorderLevel || item.minimumStock || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-actions">
                  <button className="btn-edit" onClick={() => openEditModal(item)}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  {stockStatus !== 'normal' && (
                    <button 
                      className="btn-reorder"
                      onClick={() => handleReorder(item._id || item.id)}
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reorder
                    </button>
                  )}
                  <button 
                    className="btn-delete"
                    onClick={() => handleDeleteItem(item._id || item.id)}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showAddModal ? 'Add New Item' : 'Edit Item'}</h2>
              <button className="close-btn" onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                resetForm();
              }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={showAddModal ? handleAddItem : handleEditItem}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Medicine Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.medicineName}
                      onChange={(e) => setFormData({...formData, medicineName: e.target.value})}
                      placeholder="Enter medicine name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Generic Name</label>
                    <input
                      type="text"
                      value={formData.genericName}
                      onChange={(e) => setFormData({...formData, genericName: e.target.value})}
                      placeholder="Enter generic name"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="">Select category</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Drops">Drops</option>
                      <option value="Cream">Cream</option>
                      <option value="Ointment">Ointment</option>
                      <option value="Inhaler">Inhaler</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Dosage Form *</label>
                    <input
                      type="text"
                      required
                      value={formData.dosageForm}
                      onChange={(e) => setFormData({...formData, dosageForm: e.target.value})}
                      placeholder="e.g., Oral, Topical"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Strength *</label>
                    <input
                      type="text"
                      required
                      value={formData.strength}
                      onChange={(e) => setFormData({...formData, strength: e.target.value})}
                      placeholder="e.g., 500mg, 10ml"
                    />
                  </div>
                  <div className="form-group">
                    <label>Manufacturer</label>
                    <input
                      type="text"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                      placeholder="Enter manufacturer"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Batch Number</label>
                    <input
                      type="text"
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                      placeholder="Enter batch number"
                    />
                  </div>
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Current Stock *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({...formData, currentStock: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit Price *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({...formData, unitPrice: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Enter medicine description, usage instructions, etc."
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {showAddModal ? 'Add Item' : 'Update Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
