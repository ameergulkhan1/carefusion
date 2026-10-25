import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../../components/common/Card/Card';
import Button from '../../../../components/common/Button/Button';
import Input from '../../../../components/common/Input/Input';
import Loader from '../../../../components/common/Loader/Loader';
import Alert from '../../../../components/common/Alert/Alert';
import symptomService from '../../services/symptomService';
import './SymptomChecker.css';

const SymptomChecker = () => {
  const navigate = useNavigate();
  
  // State management
  const [symptoms, setSymptoms] = useState([]);
  const [categorizedSymptoms, setCategorizedSymptoms] = useState({});
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSymptoms, setFilteredSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Input method selection
  const [inputMethod, setInputMethod] = useState('search'); // 'search', 'category'
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Additional patient information
  const [patientInfo, setPatientInfo] = useState({
    age: '',
    gender: '',
    duration: '',
    temperature: '',
    additionalNotes: ''
  });
  
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  // Load symptoms on component mount
  useEffect(() => {
    fetchSymptoms();
  }, []);

  // Filter symptoms when search term changes
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const filtered = symptoms.filter(symptom =>
        symptom.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        symptom.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSymptoms(filtered);
    } else {
      setFilteredSymptoms([]);
    }
  }, [searchTerm, symptoms]);

  const fetchSymptoms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching symptoms from backend...');
      const response = await symptomService.getAvailableSymptoms();
      
      // Log the ENTIRE response to see what we're actually getting
      console.log('📦 RAW Response:', response);
      console.log('📦 Response Type:', typeof response);
      console.log('📦 Response.data Type:', typeof response?.data);
      
      // Check if response exists
      if (!response) {
        throw new Error('No response received from server');
      }
      
      // Check success flag
      if (!response.success) {
        throw new Error(response.message || response.error || 'Server returned unsuccessful response');
      }
      
      // Check if response.data exists
      if (!response.data) {
        console.error('❌ Response.data is missing!');
        console.error('❌ Full response:', JSON.stringify(response, null, 2));
        throw new Error('⚠️ Backend returned invalid format. Run: .\\FIX_SYMPTOM_ERROR.ps1 to fix backend files.');
      }
      
      console.log('📦 Response.data:', response.data);
      
      const normalizeSymptom = (symptom, index) => {
        if (!symptom) return null;

        if (typeof symptom === 'string') {
          return {
            id: symptom,
            label: symptom.replace(/_/g, ' '),
            description: '',
            severity: 3
          };
        }

        const id = symptom.id || symptom.symptom_id || symptom.symptom || symptom.name || `symptom_${index}`;
        const label = symptom.label || symptom.name || symptom.symptom || String(id).replace(/_/g, ' ');

        return {
          ...symptom,
          id,
          label,
          description: symptom.description || symptom.desc || '',
          severity: Number(symptom.severity) || 3
        };
      };

      const organized = {};
      const allSymptoms = [];

      const addCategorySymptoms = (categoryName, symptomList = []) => {
        const normalized = symptomList
          .map((symptom, index) => normalizeSymptom(symptom, index))
          .filter((symptom) => symptom && symptom.id && symptom.label);

        if (normalized.length > 0) {
          organized[categoryName] = normalized;
          allSymptoms.push(...normalized);
          console.log(`   📁 ${categoryName}: ${normalized.length} symptoms`);
        }
      };

      // Shape 1: { data: { categories: [{ name, symptoms: [] }] } }
      if (Array.isArray(response.data.categories)) {
        console.log('✅ Found categories in response.data.categories');
        response.data.categories.forEach((category, idx) => {
          const categoryName = category?.name || category?.category || `Category ${idx + 1}`;
          const symptomList = Array.isArray(category?.symptoms) ? category.symptoms : [];
          addCategorySymptoms(categoryName, symptomList);
        });
      }
      // Shape 2: { data: [{ name, symptoms: [] }] } (categorized array)
      else if (
        Array.isArray(response.data) &&
        response.data.length > 0 &&
        typeof response.data[0] === 'object' &&
        Array.isArray(response.data[0]?.symptoms)
      ) {
        console.log('✅ Found categories in response.data array');
        response.data.forEach((category, idx) => {
          const categoryName = category?.name || category?.category || `Category ${idx + 1}`;
          addCategorySymptoms(categoryName, category.symptoms);
        });
      }
      // Shape 3: { data: { symptoms: [] } } (flat list)
      else if (Array.isArray(response.data.symptoms)) {
        console.log('✅ Found flat symptoms in response.data.symptoms');
        addCategorySymptoms('General Symptoms', response.data.symptoms);
      }
      // Shape 4: { data: [] } (flat list)
      else if (Array.isArray(response.data)) {
        console.log('✅ Found flat symptoms in response.data');
        addCategorySymptoms('General Symptoms', response.data);
      }
      // Shape 5: { data: { "Category": [] } } (object map)
      else if (typeof response.data === 'object') {
        const objectKeys = Object.keys(response.data);
        const categoryKeys = objectKeys.filter((key) => Array.isArray(response.data[key]));

        if (categoryKeys.length > 0) {
          console.log('✅ Found category map object in response.data');
          categoryKeys.forEach((key) => addCategorySymptoms(key, response.data[key]));
        }
      }

      if (allSymptoms.length === 0) {
        console.error('❌ Could not parse symptoms from response format');
        console.error('❌ Response.data structure:', Object.keys(response.data || {}));
        throw new Error('No valid symptoms received from backend');
      }

      console.log(`📋 Parsed ${Object.keys(organized).length} categories`);
      
      setSymptoms(allSymptoms);
      setCategorizedSymptoms(organized);

      console.log(`✅ Successfully loaded ${allSymptoms.length} symptoms in ${Object.keys(organized).length} categories`);
      
    } catch (err) {
      console.error('❌ Error fetching symptoms:', err);
      console.error('❌ Error message:', err.message);
      
      // Provide actionable error message
      let errorMessage = err.message || 'Failed to load symptoms';
      
      // Add instructions to fix
      if (errorMessage.includes('Backend') || errorMessage.includes('invalid format') || errorMessage.includes('categories')) {
        errorMessage += '\n\n📋 To fix:\n1. Open PowerShell\n2. cd d:\\clinixsol-frontend\n3. Run: .\\FIX_SYMPTOM_ERROR.ps1\n4. Restart backend server';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleSymptom = (symptomId) => {
    setSelectedSymptoms(prev => {
      if (prev.includes(symptomId)) {
        return prev.filter(id => id !== symptomId);
      } else if (prev.length >= 20) {
        setError('Maximum 20 symptoms can be selected');
        setTimeout(() => setError(null), 3000);
        return prev;
      } else {
        return [...prev, symptomId];
      }
    });
  };

  const removeSymptom = (symptomId) => {
    setSelectedSymptoms(prev => prev.filter(id => id !== symptomId));
  };

  const handleAnalyze = async () => {
    // Validation
    if (selectedSymptoms.length < 2) {
      setError('Please select at least 2 symptoms');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      
      // Prepare request data
      const requestData = {
        symptoms: selectedSymptoms,
        ...patientInfo,
        // Convert empty strings to undefined
        age: patientInfo.age ? parseInt(patientInfo.age) : undefined,
        temperature: patientInfo.temperature ? parseFloat(patientInfo.temperature) : undefined,
        duration: patientInfo.duration || undefined,
        gender: patientInfo.gender || undefined,
        additionalNotes: patientInfo.additionalNotes || undefined
      };

      const response = await symptomService.checkSymptoms(requestData);
      
      if (response.success) {
        setSuccessMessage('Analysis complete!');
        const cachedResult = symptomService.cacheSymptomResult(response.data);
        
        // Navigate to results page with check ID
        // Backend returns checkId in response.data.checkId
        const checkId = cachedResult.checkId || cachedResult._id || 'anonymous';
        
        setTimeout(() => {
          navigate(`/symptom-results/${checkId}`, {
            state: { checkData: cachedResult }
          });
        }, 500);
      } else {
        throw new Error(response.message || 'Analysis failed');
      }
    } catch (err) {
      console.error('Error analyzing symptoms:', err);
      setError(err.response?.data?.message || err.message || 'Failed to analyze symptoms. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedSymptoms([]);
    setSearchTerm('');
    setFilteredSymptoms([]);
    setPatientInfo({
      age: '',
      gender: '',
      duration: '',
      temperature: '',
      additionalNotes: ''
    });
    setShowAdditionalInfo(false);
    setError(null);
    setSuccessMessage('');
  };

  const getSymptomLabel = (symptomId) => {
    const symptom = symptoms.find(s => s.id === symptomId);
    return symptom ? symptom.label : symptomId;
  };

  const getSeverityBadge = (severity) => {
    if (severity >= 7) return <span className="severity-badge severe">Severe</span>;
    if (severity >= 4) return <span className="severity-badge moderate">Moderate</span>;
    return <span className="severity-badge mild">Mild</span>;
  };

  const renderSymptomCards = (symptomList = []) => (
    <div className="symptom-grid">
      {symptomList.map((symptom) => (
        <div
          key={symptom.id}
          className={`symptom-card ${selectedSymptoms.includes(symptom.id) ? 'selected' : ''}`}
          onClick={() => toggleSymptom(symptom.id)}
        >
          <div className="symptom-card-header">
            <span className="symptom-label">{symptom.label}</span>
            {getSeverityBadge(symptom.severity)}
          </div>
          {symptom.description && (
            <p className="symptom-description">{symptom.description}</p>
          )}
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="symptom-checker-container">
        <Loader message="Loading symptoms..." />
      </div>
    );
  }

  return (
    <div className="symptom-checker-container">
      <div className="symptom-checker-header">
        <h1>🩺 AI Symptom Checker</h1>
        <p>Select your symptoms to get AI-powered health insights and recommendations</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {successMessage && <Alert type="success" message={successMessage} />}

      <div className="symptom-checker-content">
        {/* Selected Symptoms Summary */}
        <Card className="selected-symptoms-card">
          <div className="selected-header">
            <h3>Selected Symptoms ({selectedSymptoms.length}/20)</h3>
            {selectedSymptoms.length > 0 && (
              <button className="clear-all-btn" onClick={handleReset}>
                Clear All
              </button>
            )}
          </div>
          
          {selectedSymptoms.length === 0 ? (
            <p className="no-symptoms-text">No symptoms selected yet. Please select at least 2 symptoms.</p>
          ) : (
            <div className="selected-symptoms-list">
              {selectedSymptoms.map(symptomId => (
                <div key={symptomId} className="selected-symptom-chip">
                  {getSymptomLabel(symptomId)}
                  <button
                    className="remove-symptom-btn"
                    onClick={() => removeSymptom(symptomId)}
                    aria-label="Remove symptom"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedSymptoms.length >= 2 && (
            <div className="additional-info-section">
              <button
                className="toggle-info-btn"
                onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
              >
                {showAdditionalInfo ? '▼' : '►'} Add Additional Information (Optional)
              </button>

              {showAdditionalInfo && (
                <div className="additional-info-form">
                  <div className="form-row">
                    <Input
                      type="number"
                      label="Age"
                      placeholder="Your age"
                      value={patientInfo.age}
                      onChange={(e) => setPatientInfo({ ...patientInfo, age: e.target.value })}
                      min="0"
                      max="150"
                    />
                    <div className="input-group">
                      <label>Gender</label>
                      <select
                        value={patientInfo.gender}
                        onChange={(e) => setPatientInfo({ ...patientInfo, gender: e.target.value })}
                        className="gender-select"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <Input
                      type="text"
                      label="Symptom Duration"
                      placeholder="e.g., 3 days, 1 week"
                      value={patientInfo.duration}
                      onChange={(e) => setPatientInfo({ ...patientInfo, duration: e.target.value })}
                    />
                    <Input
                      type="number"
                      label="Temperature (°C)"
                      placeholder="Body temperature"
                      value={patientInfo.temperature}
                      onChange={(e) => setPatientInfo({ ...patientInfo, temperature: e.target.value })}
                      step="0.1"
                      min="35"
                      max="45"
                    />
                  </div>

                  <div className="form-row">
                    <div className="input-group full-width">
                      <label>Additional Notes</label>
                      <textarea
                        value={patientInfo.additionalNotes}
                        onChange={(e) => setPatientInfo({ ...patientInfo, additionalNotes: e.target.value })}
                        placeholder="Any additional information about your symptoms..."
                        rows="3"
                        className="notes-textarea"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedSymptoms.length >= 2 && (
            <div className="analyze-button-container">
              <Button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="analyze-btn primary"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Symptoms →'}
              </Button>
            </div>
          )}
        </Card>

        {/* Input Method Selection */}
        <Card className="input-method-card">
          <h3>Select Symptoms</h3>
          <div className="input-method-tabs">
            <button
              className={`method-tab ${inputMethod === 'search' ? 'active' : ''}`}
              onClick={() => setInputMethod('search')}
            >
              🔍 Search
            </button>
            <button
              className={`method-tab ${inputMethod === 'category' ? 'active' : ''}`}
              onClick={() => setInputMethod('category')}
            >
              📋 By Category
            </button>
          </div>

          {/* Search Method */}
          {inputMethod === 'search' && (
            <div className="search-method">
              <Input
                type="text"
                placeholder="Search symptoms (e.g., headache, fever, cough)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="symptom-search-input"
              />

              {searchTerm.length >= 2 && (
                <div className="search-results">
                  {filteredSymptoms.length === 0 ? (
                    <p className="no-results">No symptoms found matching "{searchTerm}"</p>
                  ) : (
                    <div className="symptom-grid">
                      {filteredSymptoms.map(symptom => (
                        <div
                          key={symptom.id}
                          className={`symptom-card ${selectedSymptoms.includes(symptom.id) ? 'selected' : ''}`}
                          onClick={() => toggleSymptom(symptom.id)}
                        >
                          <div className="symptom-card-header">
                            <span className="symptom-label">{symptom.label}</span>
                            {getSeverityBadge(symptom.severity)}
                          </div>
                          {symptom.description && (
                            <p className="symptom-description">{symptom.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Category Method */}
          {inputMethod === 'category' && (
            <div className="category-method">
              <div className="category-selector">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-dropdown"
                >
                  <option value="">Select a category...</option>
                  {Object.keys(categorizedSymptoms).map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCategory && categorizedSymptoms[selectedCategory] && (
                <div className="category-symptoms">
                  <h4>{selectedCategory} ({categorizedSymptoms[selectedCategory].length} symptoms)</h4>
                  {renderSymptomCards(categorizedSymptoms[selectedCategory])}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Info Card */}
      <Card className="info-card">
        <h4>ℹ️ Important Information</h4>
        <ul>
          <li>This tool provides AI-powered health insights based on symptoms</li>
          <li>It is NOT a substitute for professional medical diagnosis</li>
          <li>For emergencies, please contact emergency services immediately</li>
          <li>All information is treated confidentially</li>
          <li>Results are based on machine learning analysis of medical data</li>
        </ul>
      </Card>
    </div>
  );
};

export default SymptomChecker;