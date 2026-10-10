import { useState } from 'react';
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx';

export function Edit({ speciesId, onClose }) {
  const { state, actions } = useGreenCare();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!processing) {
      setProcessing(true);
      setError('');
      try {
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData);

        // Prepare data for submission (PATCH)
        const speciesData = {
          common_name: data.common_name?.trim() || '',
          scientific_name: data.scientific_name?.trim() || '',
          light: data.light || '',
          watering: data.watering || '',
          fertilizing: data.fertilizing || '',
        };

        console.log('Submitting species update data:', speciesData);

        // Call the saveSpecies action
        if (actions.saveSpecies) {
          await actions.saveSpecies(speciesId, speciesData);
        }

        console.log('Species updated successfully:', speciesData);

        // Reset form on success
        setError('');
        setProcessing(false);
        onClose && onClose();
      } catch (err) {
        setError('Failed to update species. Please try again.');
        setProcessing(false);
      }
    }
  };

  // Get the species data for pre-filling the form
  const species = state.library.find(s => s.id === speciesId);

  return (
    <div className="modal-backdrop" onClick={(e) => {
        if (e.target === e.currentTarget) onClose && onClose()
      }}>
      <div className="modal">
        <div className="modal-head">
          <h3>Edit Species</h3>
          <button className="icon-btn" type="button" onClick={() => {
              onClose && onClose()
          }}>×</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-row">
              <label>Common Name *</label>
              <input
                type="text"
                name="common_name"
                placeholder="e.g. Snake Plant"
                defaultValue={species ? species.common_name : ''}
                disabled={processing}
              />
            </div>
            <div className="form-row">
              <label>Scientific Name *</label>
              <input
                type="text"
                name="scientific_name"
                placeholder="e.g. Sansevieria trifasciata"
                defaultValue={species ? species.scientific_name : ''}
                disabled={processing}
              />
            </div>
            <div className="form-row">
              <label>Light</label>
              <select
                name="light"
                defaultValue={species ? species.light : ''}
                disabled={processing}
              >
                <option value="">-- Select Light --</option>
                <option value="Low light">
                  Low light
                </option>
                <option value="Medium light">
                  Medium light
                </option>
                <option value="Partial shade">
                  Partial shade
                </option>
                <option value="Bright Indirect">
                  Bright Indirect
                </option>
                <option value="Full Sun">
                  Full Sun
                </option>
              </select>
            </div>
            <div className="form-row">
              <label>Watering</label>
              <select
                name="watering"
                defaultValue={species ? species.watering : ''}
                disabled={processing}
              >
                <option value="">-- Select Watering --</option>
                <option value="Every 3 Days">
                  Every 3 Days
                </option>
                <option value="Weekly">
                  Weekly
                </option>
                <option value="Every 10 Days">
                  Every 10 Days
                </option>
                <option value="Every 2 Weeks">
                  Every 2 Weeks
                </option>
              </select>
            </div>
            <div className="form-row">
              <label>Fertilizing</label>
              <select
                name="fertilizing"
                defaultValue={species ? species.fertilizing : ''}
                disabled={processing}
              >
                <option value="">-- Select Fertilizing --</option>
                <option value="Every 6 Weeks">
                  Every 6 Weeks
                </option>
                <option value="Monthly">
                  Monthly
                </option>
                <option value="Every 2 Weeks">
                  Every 2 Weeks
                </option>
                <option value="Seasonal">
                  Seasonal
                </option>
              </select>
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                  onClose && onClose()
              }}
              disabled={processing}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={processing}
            >
              {processing ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}