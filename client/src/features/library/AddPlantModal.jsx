import { useState, useEffect } from 'react';

export function AddPlantModal({ onClose, onAddPlant, defaultSpecies = '', defaultPhoto = null, defaultLight = '', defaultWatering = '', defaultFertilizing = '' }) {
  const [photo, setPhoto] = useState(defaultPhoto);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [species, setSpecies] = useState(defaultSpecies || '');
  const [light, setLight] = useState(defaultLight || '');
  const [watering, setWatering] = useState(defaultWatering || '');
  const [fertilizing, setFertilizing] = useState(defaultFertilizing || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!processing) {
      setProcessing(true);
      setError('');
      try {
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData);

        // Validate required fields
        if (!data.name.trim() || !data.species.trim()) {
          setError('Please give your plant a name and a species before saving.');
          setProcessing(false);
          return;
        }

        // Prepare data for submission
        const plantData = {
          name: data.name.trim(),
          speciesName: data.species.trim(),
          location: data.location || null,
          light: data.light || null,
          watering: data.watering || null,
          fertilizing: data.fertilizing || null,
          notes: data.notes || null,
          photo: photo || null, // Include photo (either uploaded or default)
        };

        // Call the onAddPlant callback with the plant data
        if (onAddPlant) {
          await onAddPlant(plantData);
        }

        // Reset form on success
        setError('');
        setPhoto(null);
        setProcessing(false);
        onClose && onClose();
      } catch (err) {
        setError('Failed to add plant. Please try again.');
        setProcessing(false);
      }
    }
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Set species from prop when it changes (but only if not already set by user)
  useEffect(() => {
    if (defaultSpecies && !species) {
      setSpecies(defaultSpecies);
    }
  }, [defaultSpecies, species]);

  // Set light from prop when it changes (but only if not already set by user)
  useEffect(() => {
    if (defaultLight && !light) {
      setLight(defaultLight);
    }
  }, [defaultLight, light]);

  // Set watering from prop when it changes (but only if not already set by user)
  useEffect(() => {
    if (defaultWatering && !watering) {
      setWatering(defaultWatering);
    }
  }, [defaultWatering, watering]);

  // Set fertilizing from prop when it changes (but only if not already set by user)
  useEffect(() => {
    if (defaultFertilizing && !fertilizing) {
      setFertilizing(defaultFertilizing);
    }
  }, [defaultFertilizing, fertilizing]);

  return (
    <div className="modal" style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', margin: 'auto' }}>
      <div className="modal-head">
        <h3>Add a Plant</h3>
        <button className="icon-btn" onClick={onClose}>×</button>
      </div>
      <div className="modal-body">
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-row">
              <label>Plant Name *</label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Luna"
                disabled={processing}
              />
            </div>
            <div className="form-row">
              <label>Species *</label>
              <input
                type="text"
                name="species"
                required
                placeholder="e.g. Monstera Deliciosa"
                list="speciesOptions"
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                disabled={processing}
              />
            </div>
            <div className="form-row">
              <label>Location</label>
              <input
                type="text"
                name="location"
                placeholder="e.g. Living Room Window"
                disabled={processing}
                required
              />
            </div>
            <div className="form-row">
              <label>Light Condition</label>
              <select
                name="light"
                value={light}
                onChange={(e) => setLight(e.target.value)}
                disabled={processing}
                required
              >
                <option value="">-- Select Light Condition --</option>
                <option value="Bright Indirect">Bright Indirect</option>
                <option value="Low Light">Low Light</option>
                <option value="Full Sun">Full Sun</option>
                <option value="Partial Shade">Partial Shade</option>
                <option value="Medium Light">Medium Light</option>
              </select>
            </div>
            <div className="form-row">
              <label>Watering Frequency</label>
              <select
                name="watering"
                value={watering}
                onChange={(e) => setWatering(e.target.value)}
                disabled={processing}
                required
              >
                <option value="">-- Select Watering Frequency --</option>
                <option value="Every 3 days">Every 3 days</option>
                <option value="Weekly">Weekly</option>
                <option value="Every 10 days">Every 10 days</option>
                <option value="Every 2 weeks">Every 2 weeks</option>
              </select>
            </div>
            <div className="form-row">
              <label>Fertilizing Frequency</label>
              <select
                name="fertilizing"
                value={fertilizing}
                onChange={(e) => setFertilizing(e.target.value)}
                disabled={processing}
                required
              >
                <option value="">-- Select Fertilizing Frequency --</option>
                <option value="Monthly">Monthly</option>
                <option value="Every 2 weeks">Every 2 weeks</option>
                <option value="Every 6 weeks">Every 6 weeks</option>
                <option value="Seasonal">Seasonal</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <label>Notes</label>
            <textarea
              name="notes"
              rows="2"
              placeholder="Anything worth remembering about this plant"
              disabled={processing}
            />
          </div>
          <div class="form-row">
            <label>Plant Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              disabled={processing}
            />
            {photo && (
              <div className="photo-preview">
                <img src={photo} alt="Preview" style={{ maxWidth: '100%', height: 'auto' }} />
              </div>
            )}
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
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
              disabled={processing}
            >
              {processing ? 'Adding...' : 'Add Plant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}