import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../../../components/common/DataTable/DataTable';
import Button from '../../../../components/common/Button/Button';
import Loader from '../../../../components/common/Loader/Loader';
import Alert from '../../../../components/common/Alert/Alert';
import symptomService from '../../services/symptomService';
import './SymptomHistory.css';

const SymptomHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatSymptoms = (symptoms) => {
    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return 'No symptoms listed';
    }

    return symptoms
      .slice(0, 3)
      .map((symptom) => {
        if (typeof symptom === 'string') return symptom;
        return symptom?.label || symptom?.name || symptom?.id || 'Symptom';
      })
      .join(', ')
      .concat(symptoms.length > 3 ? ` +${symptoms.length - 3} more` : '');
  };

  const formatResult = (predictions) => {
    if (!Array.isArray(predictions) || predictions.length === 0) {
      return 'No prediction';
    }

    const top = predictions[0];
    const disease = top?.disease || 'Unknown';
    const probability = typeof top?.probability === 'number' ? `${Math.round(top.probability * 100)}%` : '';
    return probability ? `${disease} (${probability})` : disease;
  };

  const normalizeHistory = (raw) => {
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.checks)
        ? raw.checks
        : Array.isArray(raw?.results)
          ? raw.results
          : [];

    return list.map((item, index) => {
      const id = item?._id || item?.checkId || item?.id || `history_${index}`;

      return {
        id,
        date: item?.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown',
        symptoms: formatSymptoms(item?.symptoms),
        result: formatResult(item?.predictions),
        saved: item?.savedToRecords ? 'Yes' : 'No',
        raw: item
      };
    });
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await symptomService.getSymptomHistory();

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to load symptom history');
      }

      const serverHistory = normalizeHistory(response.data);
      const localHistory = normalizeHistory(symptomService.getCachedResults());
      const mergedHistory = [...serverHistory];

      localHistory.forEach((item) => {
        if (!mergedHistory.some((existing) => existing.id === item.id)) {
          mergedHistory.push(item);
        }
      });

      setHistory(mergedHistory);
    } catch (err) {
      const localHistory = normalizeHistory(symptomService.getCachedResults());

      if (localHistory.length > 0) {
        setHistory(localHistory);
        setError('Unable to load server history. Showing locally saved results only.');
      } else {
        setError(err?.response?.data?.message || err?.message || 'Failed to load symptom history');
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => [
    { header: 'Date', accessor: 'date' },
    { header: 'Symptoms', accessor: 'symptoms' },
    { header: 'Result', accessor: 'result' },
    { header: 'Saved To Records', accessor: 'saved' },
    {
      header: 'Action',
      accessor: 'action',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            navigate(`/symptom-results/${row.id}`);
          }}
        >
          View
        </Button>
      )
    }
  ], [navigate]);

  if (loading) {
    return (
      <div className="symptom-history">
        <Loader message="Loading symptom history..." />
      </div>
    );
  }

  return (
    <div className="symptom-history">
      <h2>Symptom Check History</h2>
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {!error && history.length === 0 && (
        <div className="symptom-history-empty">
          <p>No symptom checks found yet.</p>
          <Button onClick={() => navigate('/symptoms/checker')}>Start New Symptom Check</Button>
        </div>
      )}

      {history.length > 0 && (
        <div className="symptom-history-table">
          <DataTable columns={columns} data={history} onRowClick={(row) => navigate(`/symptom-results/${row.id}`)} />
        </div>
      )}
    </div>
  );
};

export default SymptomHistory;