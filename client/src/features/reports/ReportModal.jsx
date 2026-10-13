import { useState } from 'react';
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx';

export function Modal({ onClose }) {
  const { actions } = useGreenCare();
  const [subject, setSubject] = useState('');
  const [detail, setDetail] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!processing) {
      setProcessing(true);
      setError('');
      try {
        if (!subject.trim() || !detail.trim()) {
          setError('Please fill in both subject and detail before submitting.');
          setProcessing(false);
          return;
        }

        await actions.createReport({
          subject: subject.trim(),
          detail: detail.trim()
        });

        // Reset form on success
        setError('');
        setSubject('');
        setDetail('');
        setProcessing(false);
        onClose && onClose();

        // Show a success message
        alert('Issue reported successfully!');
      } catch (err) {
        setError('Failed to submit report. Please try again.');
        setProcessing(false);
      }
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose && onClose()
      }}>
      <div className="modal">
        <div className="modal-head">
          <h3>Report an Issue</h3>
          <button className="icon-btn" type="button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <label>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter issue subject"
              disabled={processing}
            />
          </div>
          <div className="form-row">
            <label>Detail</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Describe the issue in detail"
              rows="4"
              disabled={processing}
            />
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="modal-actions" style={{ padding: '20px'}}>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onClose}
            disabled={processing}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            type="submit"
            onClick={handleSubmit}
            disabled={processing}
          >
            {processing ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}