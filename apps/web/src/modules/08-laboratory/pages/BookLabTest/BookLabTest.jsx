import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import laboratoryService from '../../services/laboratoryService';
import Loader from '../../../../components/common/Loader/Loader';
import LabTestCard from '../../components/LabTestCard/LabTestCard';
import { formatPKRSimple } from '../../../../utils/currencyFormatter';
import './BookLabTest.css';

const BookLabTest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tests, setTests] = useState([]);
  const [labs, setLabs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabId, setSelectedLabId] = useState('');
  const [selectedTests, setSelectedTests] = useState([]);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Suggestion dropdown state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBoxRef = useRef(null);

  const [bookingData, setBookingData] = useState({
    appointmentDate: '',
    sampleCollectionType: 'walk-in',
    homeCollectionAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      contactNumber: ''
    },
    specialInstructions: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSuccessResponse = (response) => Boolean(response?.success);
  const asArray = (value) => (Array.isArray(value) ? value : []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [testsRes, categoriesRes, labsRes] = await Promise.allSettled([
        laboratoryService.getAllTests(),
        laboratoryService.getTestCategories(),
        laboratoryService.getAvailableLabs()
      ]);

      if (testsRes.status === 'fulfilled' && isSuccessResponse(testsRes.value)) {
        setTests(asArray(testsRes.value.data));
      } else {
        setTests([]);
      }

      if (categoriesRes.status === 'fulfilled' && isSuccessResponse(categoriesRes.value)) {
        setCategories(asArray(categoriesRes.value.data));
      } else {
        setCategories([]);
      }

      if (labsRes.status === 'fulfilled' && isSuccessResponse(labsRes.value)) {
        const allLabs = asArray(labsRes.value.data);
        setLabs(allLabs);
        if (allLabs.length > 0) {
          setSelectedLabId(allLabs[0]._id);
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load lab data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestsForSelectedLab();
  }, [selectedLabId]);

  const fetchTestsForSelectedLab = async () => {
    try {
      const params = selectedLabId ? { laboratoryId: selectedLabId } : {};
      const testsRes = await laboratoryService.getAllTests(params);
      if (isSuccessResponse(testsRes)) {
        const availableTests = asArray(testsRes.data);
        setTests(availableTests);
        setSelectedTests((prev) => prev.filter((item) => availableTests.some((test) => test._id === item._id)));
      }
    } catch (error) {
      console.error('Failed to refresh tests for selected laboratory:', error);
      toast.error('Unable to load tests for selected laboratory');
    }
  };

  // Live suggestion list
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const seen = new Set();
    const results = [];

    for (const test of tests) {
      const name = test.testName || '';
      const code = test.testCode || '';
      const matchesName = name.toLowerCase().includes(q);
      const matchesCode = code.toLowerCase().includes(q);

      if (!matchesName && !matchesCode) continue;

      const nameKey = `name:${name.toLowerCase()}`;
      if (!seen.has(nameKey)) {
        seen.add(nameKey);
        results.push({
          type: 'name',
          value: name,
          code,
          category: test.category,
          label: name,
          sublabel: code ? `Code: ${code}` : test.category
        });
      }

      if (matchesCode && code) {
        const codeKey = `code:${code.toLowerCase()}`;
        if (!seen.has(codeKey)) {
          seen.add(codeKey);
          results.push({
            type: 'code',
            value: code,
            category: test.category,
            label: code,
            sublabel: name
          });
        }
      }
    }

    results.sort((a, b) => {
      const aStarts = a.value.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.value.toLowerCase().startsWith(q) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.value.localeCompare(b.value);
    });

    return results.slice(0, 8);
  }, [searchQuery, tests]);

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.value);
    setShowSuggestions(false);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(true);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault();
      setSearchQuery(suggestions[0].value);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const filteredTests = tests.filter(test => {
    const matchesCategory = !selectedCategory || test.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      (test.testName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.testCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleTestSelection = (test) => {
    setSelectedTests(prev => {
      const exists = prev.find(t => t._id === test._id);
      if (exists) {
        return prev.filter(t => t._id !== test._id);
      } else {
        return [...prev, test];
      }
    });
  };

  const calculateTotal = () => {
    return selectedTests.reduce((sum, test) => sum + Number(test.price || 0), 0);
  };

  const handleInputChange = (field, value) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      homeCollectionAddress: {
        ...prev.homeCollectionAddress,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedTests.length === 0) {
      toast.error('Please select at least one test');
      return;
    }

    if (!selectedLabId) {
      toast.error('Please select a laboratory location');
      return;
    }

    if (!bookingData.appointmentDate) {
      toast.error('Please select appointment date');
      return;
    }

    if (bookingData.sampleCollectionType === 'home-collection' && !bookingData.homeCollectionAddress.street) {
      toast.error('Please provide home collection address');
      return;
    }

    try {
      setSubmitting(true);
      const orderData = {
        tests: selectedTests.map(t => t._id),
        laboratoryId: selectedLabId,
        ...bookingData
      };

      const response = await laboratoryService.createOrder(orderData);

      if (!isSuccessResponse(response)) {
        throw new Error(response?.message || 'Failed to create laboratory order');
      }

      const createdOrderId = response?.data?._id || response?.data?.id;
      if (!createdOrderId) {
        throw new Error('Order created but no order id returned from backend');
      }

      toast.success('Lab test order created successfully!');
      navigate(`/laboratory/orders/${createdOrderId}`);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (showBookingForm) {
    return (
      <div className="book-lab-test">
        <div className="booking-form-container">
          <button 
            className="btn-back"
            onClick={() => setShowBookingForm(false)}
          >
            ← Back to Test Selection
          </button>

          <h2 className="form-title">Complete Your Booking</h2>

          <div className="selected-tests-summary">
            <h3>Selected Tests ({selectedTests.length})</h3>
            <div className="selected-tests-list">
              {selectedTests.map(test => (
                <div key={test._id} className="selected-test-item">
                  <div>
                    <p className="test-name">{test.testName}</p>
                    <p className="test-code">{test.testCode}</p>
                  </div>
                  <div className="test-price">{formatPKRSimple(test.price)}</div>
                  <button 
                    className="btn-remove"
                    onClick={() => toggleTestSelection(test)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="total-amount">
              <span>Total Amount:</span>
              <span className="amount">{formatPKRSimple(calculateTotal())}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="booking-form">
            <div className="form-group">
              <label className="form-label">Appointment Date *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={bookingData.appointmentDate}
                onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sample Collection Type *</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="collectionType"
                    value="walk-in"
                    checked={bookingData.sampleCollectionType === 'walk-in'}
                    onChange={(e) => handleInputChange('sampleCollectionType', e.target.value)}
                  />
                  <span>Walk-in</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="collectionType"
                    value="home-collection"
                    checked={bookingData.sampleCollectionType === 'home-collection'}
                    onChange={(e) => handleInputChange('sampleCollectionType', e.target.value)}
                  />
                  <span>Home Collection</span>
                </label>
              </div>
            </div>

            {bookingData.sampleCollectionType === 'home-collection' && (
              <div className="address-section">
                <h4>Home Collection Address</h4>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Street Address *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={bookingData.homeCollectionAddress.street}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={bookingData.homeCollectionAddress.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={bookingData.homeCollectionAddress.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Zip Code *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={bookingData.homeCollectionAddress.zipCode}
                      onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Number *</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={bookingData.homeCollectionAddress.contactNumber}
                      onChange={(e) => handleAddressChange('contactNumber', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Special Instructions</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={bookingData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                placeholder="Any special instructions or requirements..."
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => setShowBookingForm(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-submit"
                disabled={submitting}
              >
                {submitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="book-lab-test">
      <div className="page-header">
        <div>
          <h1 className="page-title">Book Lab Tests</h1>
          <p className="page-subtitle">Select tests from our comprehensive catalog</p>
        </div>
        {selectedTests.length > 0 && (
          <button 
            className="btn-proceed"
            onClick={() => setShowBookingForm(true)}
          >
            Proceed ({selectedTests.length} tests) - {formatPKRSimple(calculateTotal())}
          </button>
        )}
      </div>

      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <label className="filter-label">Laboratory Location</label>
            <select
              className="lab-select"
              value={selectedLabId}
              onChange={(e) => setSelectedLabId(e.target.value)}
            >
              <option value="">Select laboratory location</option>
              {labs.map((lab) => (
                <option key={lab._id} value={lab._id}>
                  {`${lab.labName}${lab.location ? ` - ${lab.location}` : ''}${lab.isVerified ? '' : ' (Unverified)'}`}
                </option>
              ))}
            </select>
          </div>

          <div className="search-box-wrapper" ref={searchBoxRef}>
            <div className="search-bar">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search tests by name or code..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map((s, idx) => (
                  <button
                    key={`${s.type}-${s.value}-${idx}`}
                    type="button"
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(s)}
                  >
                    <span className="suggestion-icon">
                      {s.type === 'code' ? '🏷️' : '🧪'}
                    </span>
                    <span className="suggestion-text">
                      <span className="suggestion-label">{s.label}</span>
                      {s.sublabel && (
                        <span className="suggestion-sublabel">{s.sublabel}</span>
                      )}
                    </span>
                    {s.category && (
                      <span className="suggestion-category">{s.category}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {showSuggestions && searchQuery.trim() && suggestions.length === 0 && (
              <div className="search-suggestions">
                <div className="no-suggestions">
                  No tests match "<strong>{searchQuery}</strong>"
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="category-filters">
          <button 
            className={`category-btn ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            All Tests
          </button>
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {filteredTests.length === 0 ? (
        <div className="empty-state">
          <p>No tests found matching your criteria</p>
        </div>
      ) : (
        <div className="tests-grid">
          {filteredTests.map(test => {
            const isSelected = selectedTests.some(t => t._id === test._id);
            return (
              <LabTestCard
                key={test._id}
                test={test}
                isSelected={isSelected}
                onSelect={toggleTestSelection}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookLabTest;