import React, { useEffect, useMemo, useState } from 'react';
import Card from '../../../../components/common/Card/Card';
import Button from '../../../../components/common/Button/Button';
import Alert from '../../../../components/common/Alert/Alert';
import Loader from '../../../../components/common/Loader/Loader';
import prescriptionService from '../../services/prescriptionService';
import { doctorService } from '../../../../services/doctorService';
import './CreatePrescription.css';

const CreatePrescription = () => {
  const [patients, setPatients] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [form, setForm] = useState({
    patientId: '',
    diagnosis: '',
    instructions: '',
    notes: '',
    validUntil: '',
    maxRefills: 0,
    sendToPharmacy: false,
    pharmacyId: '',
    sendNotes: ''
  });

  const [medications, setMedications] = useState([
    { medicationName: '', dosage: '', frequency: '', duration: '', instructions: '', quantity: '' }
  ]);

  useEffect(() => {
    fetchPatients();
    fetchPharmacies();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const response = await doctorService.getPatients({ page: 1, limit: 200 });
      const list = Array.isArray(response?.data?.patients)
        ? response.data.patients
        : Array.isArray(response?.data)
          ? response.data
          : [];
      setPatients(list);
    } catch (err) {
      setError(err?.message || 'Failed to load patients. Please refresh and try again.');
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchPharmacies = async () => {
    try {
      const response = await prescriptionService.getAvailablePharmacies();
      if (response?.success) {
        setPharmacies(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.warn('Failed to load pharmacies:', err?.message || err);
      setPharmacies([]);
    }
  };

  const patientOptions = useMemo(() => {
    return patients.map((patient) => {
      const user = patient?.user || {};
      const name = user.fullName || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient';
      return {
        value: patient?._id,
        label: `${name}${user.email ? ` (${user.email})` : ''}`
      };
    });
  }, [patients]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient?._id === form.patientId),
    [patients, form.patientId]
  );

  const updateMedication = (index, field, value) => {
    setMedications((prev) =>
      prev.map((medication, idx) => (idx === index ? { ...medication, [field]: value } : medication))
    );
  };

  const addMedicationRow = () => {
    setMedications((prev) => [
      ...prev,
      { medicationName: '', dosage: '', frequency: '', duration: '', instructions: '', quantity: '' }
    ]);
  };

  const removeMedicationRow = (index) => {
    setMedications((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev));
  };

  const validateForm = () => {
    if (!form.patientId) return 'Please select a patient.';
    if (!form.diagnosis.trim()) return 'Diagnosis is required.';
    if (form.sendToPharmacy && !form.pharmacyId) return 'Please select a pharmacy to send this prescription.';

    const validMedications = medications.filter(
      (med) => med.medicationName.trim() && med.dosage.trim() && med.frequency.trim() && med.duration.trim()
    );

    if (validMedications.length === 0) {
      return 'Add at least one complete medication (name, dosage, frequency, duration).';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccessMessage('');

      const payload = {
        patientId: form.patientId,
        diagnosis: form.diagnosis.trim(),
        instructions: form.instructions.trim() || undefined,
        notes: form.notes.trim() || undefined,
        validUntil: form.validUntil || undefined,
        refill: {
          maxRefills: Number(form.maxRefills || 0)
        },
        pharmacyId: form.sendToPharmacy ? form.pharmacyId || undefined : undefined,
        sendNotes: form.sendToPharmacy ? form.sendNotes || undefined : undefined,
        medications: medications
          .filter((med) => med.medicationName.trim() && med.dosage.trim() && med.frequency.trim() && med.duration.trim())
          .map((med) => ({
            medicationName: med.medicationName.trim(),
            dosage: med.dosage.trim(),
            frequency: med.frequency.trim(),
            duration: med.duration.trim(),
            instructions: med.instructions.trim() || undefined,
            quantity: med.quantity ? Number(med.quantity) : undefined
          }))
      };

      const response = await prescriptionService.createPrescription(payload);

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to create prescription');
      }

      const created = response.data || {};
      setSuccessMessage(`Prescription created successfully (${created.prescriptionId || created._id || 'Saved'}).`);

      setForm({
        patientId: '',
        diagnosis: '',
        instructions: '',
        notes: '',
        validUntil: '',
        maxRefills: 0,
        sendToPharmacy: false,
        pharmacyId: '',
        sendNotes: ''
      });
      setMedications([{ medicationName: '', dosage: '', frequency: '', duration: '', instructions: '', quantity: '' }]);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create prescription');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPatients) {
    return (
      <div className="create-prescription">
        <Loader message="Loading patients..." />
      </div>
    );
  }

  return (
    <div className="create-prescription">
      <Card title="Create Prescription">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage('')} />}

        <form onSubmit={handleSubmit} className="prescription-form">
          <div className="form-row">
            <label htmlFor="patientId">Patient</label>
            <select
              id="patientId"
              value={form.patientId}
              onChange={(e) => setForm((prev) => ({ ...prev, patientId: e.target.value }))}
              required
            >
              <option value="">Select patient</option>
              {patientOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {selectedPatient && (
            <div className="patient-summary">
              <h4>Auto-Populated Patient Details</h4>
              <div className="patient-summary-grid">
                <div>
                  <span className="label">Name</span>
                  <span>{selectedPatient?.user?.fullName || 'N/A'}</span>
                </div>
                <div>
                  <span className="label">Email</span>
                  <span>{selectedPatient?.user?.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="label">Phone</span>
                  <span>{selectedPatient?.user?.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="label">Patient ID</span>
                  <span>{selectedPatient?.patientId || selectedPatient?._id}</span>
                </div>
              </div>
            </div>
          )}

          <div className="form-row">
            <label htmlFor="diagnosis">Diagnosis</label>
            <input
              id="diagnosis"
              value={form.diagnosis}
              onChange={(e) => setForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
              placeholder="Enter diagnosis"
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="instructions">General Instructions</label>
            <textarea
              id="instructions"
              value={form.instructions}
              onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
              placeholder="General medication instructions"
              rows="3"
            />
          </div>

          <div className="form-row">
            <label htmlFor="notes">Clinical Notes</label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes"
              rows="3"
            />
          </div>

          <div className="form-row">
            <label htmlFor="validUntil">Valid Until</label>
            <input
              id="validUntil"
              type="date"
              value={form.validUntil}
              onChange={(e) => setForm((prev) => ({ ...prev, validUntil: e.target.value }))}
            />
          </div>

          <div className="form-row">
            <label htmlFor="maxRefills">Allowed Refills</label>
            <input
              id="maxRefills"
              type="number"
              min="0"
              max="12"
              value={form.maxRefills}
              onChange={(e) => setForm((prev) => ({ ...prev, maxRefills: e.target.value }))}
            />
          </div>

          <div className="form-row checkbox-row">
            <label htmlFor="sendToPharmacy">Send prescription to pharmacy now</label>
            <input
              id="sendToPharmacy"
              type="checkbox"
              checked={form.sendToPharmacy}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sendToPharmacy: e.target.checked,
                  pharmacyId: e.target.checked ? prev.pharmacyId : ''
                }))
              }
            />
          </div>

          {form.sendToPharmacy && (
            <>
              <div className="form-row">
                <label htmlFor="pharmacyId">Select Pharmacy</label>
                <select
                  id="pharmacyId"
                  value={form.pharmacyId}
                  onChange={(e) => setForm((prev) => ({ ...prev, pharmacyId: e.target.value }))}
                  required
                >
                  <option value="">Select pharmacy</option>
                  {pharmacies.map((pharmacy) => (
                    <option key={pharmacy._id} value={pharmacy._id}>
                      {`${pharmacy.pharmacyName}${pharmacy.address?.city ? ` - ${pharmacy.address.city}` : ''}${pharmacy.isVerified ? '' : ' (Unverified)'}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label htmlFor="sendNotes">Message to Pharmacy</label>
                <textarea
                  id="sendNotes"
                  value={form.sendNotes}
                  onChange={(e) => setForm((prev) => ({ ...prev, sendNotes: e.target.value }))}
                  placeholder="Optional message"
                  rows="2"
                />
              </div>
            </>
          )}

          <div className="medications-section">
            <div className="medications-header">
              <h4>Medications</h4>
              <button type="button" className="link-btn" onClick={addMedicationRow}>
                + Add Medication
              </button>
            </div>

            {medications.map((medication, index) => (
              <div className="medication-row" key={`med-${index}`}>
                <input
                  placeholder="Medicine name"
                  value={medication.medicationName}
                  onChange={(e) => updateMedication(index, 'medicationName', e.target.value)}
                />
                <input
                  placeholder="Dosage"
                  value={medication.dosage}
                  onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                />
                <input
                  placeholder="Frequency"
                  value={medication.frequency}
                  onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                />
                <input
                  placeholder="Duration"
                  value={medication.duration}
                  onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={medication.quantity}
                  onChange={(e) => updateMedication(index, 'quantity', e.target.value)}
                />
                <input
                  placeholder="Medicine instructions"
                  value={medication.instructions}
                  onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                />

                <button
                  type="button"
                  className="remove-med-btn"
                  onClick={() => removeMedicationRow(index)}
                  disabled={medications.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <Button type="submit" disabled={submitting || patients.length === 0}>
              {submitting ? 'Creating...' : 'Create Prescription'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreatePrescription;