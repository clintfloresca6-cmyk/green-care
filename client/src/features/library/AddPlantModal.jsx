import { useState, useEffect } from 'react';

export function AddPlantModal({ onClose, onAddPlant, defaultSpecies = '', defaultSpeciesId = null, defaultPhoto = null, defaultLight = '', defaultWatering = '', defaultFertilizing = '' }) {
  const [photo, setPhoto] = useState(defaultPhoto);
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [species, setSpecies] = useState(defaultSpecies || '');
  const [speciesId, setSpeciesId] = useState(defaultSpeciesId ?? null);
  const [light, setLight] = useState(defaultLight || '');
  const [watering, setWatering] = useState(defaultWatering || '');
  const [fertilizing, setFertilizing] = useState(defaultFertilizing || '');
  const [originalLight, setOriginalLight] = useState(defaultLight || '');
  const [originalWatering, setOriginalWatering] = useState(defaultWatering || '');
  const [originalFertilizing, setOriginalFertilizing] = useState(defaultFertilizing || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!processing) {
      setProcessing(true);
      setError('');
      try {
        // Get form values manually to properly handle file input
        const form = e.currentTarget;
        const name = form.elements.name.value.trim();
        const species = form.elements.species.value.trim();
        const location = form.elements.location.value.trim() || null;
        const light = form.elements.light.value || null;
        const watering = form.elements.watering.value || null;
        const fertilizing = form.elements.fertilizing.value || null;
        const notes = form.elements.notes.value.trim() || null;

        // Validate required fields
        if (!name || !species) {
          setError('Please give your plant a name and a species before saving.');
          setProcessing(false);
          return;
        }

        // Prepare data for submission
        let photoUrl = photo || null; // Default to the preview URL or null

        // If we have a selected file, convert it to base64 for upload
        if (photoFile) {
          try {
            const base64Image = await fileToBase64(photoFile);
            photoUrl = base64Image; // Send base64 to backend for ImgBB upload
          } catch (error) {
            console.error('Error converting image to base64:', error);
            // Fall back to using the preview URL if base64 conversion fails
            photoUrl = photo || null;
          }
        }

        const plantData = {
          name,
          speciesName: species,
          speciesId,
          location,
          light,
          watering,
          fertilizing,
          notes,
          photo: photoUrl, // Include photo (either base64 for upload or preview URL)
        };

        console.log('Submitting plant data:', plantData);

        // Call the onAddPlant callback with the plant data
        if (onAddPlant) {
          await onAddPlant(plantData);
        }

        console.log('Plant added successfully:', plantData);

        // Reset form on success
        setError('');
        setPhoto(null);
        setPhotoFile(null);
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
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhoto(URL.createObjectURL(file));
    }
  };

  // Convert File to base64 string
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data URL prefix (e.g., 'data:image/jpeg;base64,')
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Set species from prop when it changes (but only if not already set by user)
  useEffect(() => {
    if (defaultSpecies && !species) {
      setSpecies(defaultSpecies);
    }
  }, [defaultSpecies, species]);

  // Set speciesId from prop when it changes (but only if not already set by user)
  useEffect(() => {
    if (defaultSpeciesId !== null && speciesId === null) {
      setSpeciesId(defaultSpeciesId);
    }
  }, [defaultSpeciesId, speciesId]);

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

  // Set original light from prop (the recommended value from data)
  useEffect(() => {
    if (defaultLight) {
      setOriginalLight(defaultLight);
    }
  }, [defaultLight]);

  // Set original watering from prop (the recommended value from data)
  useEffect(() => {
    if (defaultWatering) {
      setOriginalWatering(defaultWatering);
    }
  }, [defaultWatering]);

  // Set original fertilizing from prop (the recommended value from data)
  useEffect(() => {
    if (defaultFertilizing) {
      setOriginalFertilizing(defaultFertilizing);
    }
  }, [defaultFertilizing]);

  return (
    <div className="modal" style={{ display: 'flex', flexDirection: 'column', margin: 'auto', overflow: 'auto', maxHeight: '90vh', scrollbarWidth: 'none' }}>
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
                <option value="Bright Indirect">
                  Bright Indirect{originalLight !== '—' && light === originalLight && originalLight === 'Bright Indirect' ? ' (Recommended)' : ''}
                </option>
                <option value="Low light">
                  Low light{originalLight !== '—' && light === originalLight && originalLight === 'Low light' ? ' (Recommended)' : ''}
                </option>
                <option value="Full Sun">
                  Full Sun{originalLight !== '—' && light === originalLight && originalLight === 'Full Sun' ? ' (Recommended)' : ''}
                </option>
                <option value="Partial shade">
                  Partial shade{originalLight !== '—' && light === originalLight && originalLight === 'Partial shade' ? ' (Recommended)' : ''}
                </option>
                <option value="Medium light">
                  Medium light{originalLight !== '—' && light === originalLight && originalLight === 'Medium light' ? ' (Recommended)' : ''}
                </option>
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
                <option value="Every 3 days">
                  Every 3 days{originalWatering !== '—' && watering === originalWatering && originalWatering === 'Every 3 days' ? ' (Recommended)' : ''}
                </option>
                <option value="Weekly">
                  Weekly{originalWatering !== '—' && watering === originalWatering && originalWatering === 'Weekly' ? ' (Recommended)' : ''}
                </option>
                <option value="Every 10 days">
                  Every 10 days{originalWatering !== '—' && watering === originalWatering && originalWatering === 'Every 10 days' ? ' (Recommended)' : ''}
                </option>
                <option value="Every 2 weeks">
                  Every 2 weeks{originalWatering !== '—' && watering === originalWatering && originalWatering === 'Every 2 weeks' ? ' (Recommended)' : ''}
                </option>
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
                <option value="Monthly">
                  Monthly{originalFertilizing !== '—' && fertilizing === originalFertilizing && originalFertilizing === 'Monthly' ? ' (Recommended)' : ''}
                </option>
                <option value="Every 2 Weeks">
                  Every 2 Weeks{originalFertilizing !== '—' && fertilizing === originalFertilizing && originalFertilizing === 'Every 2 Weeks' ? ' (Recommended)' : ''}
                </option>
                <option value="Every 6 Weeks">
                  Every 6 Weeks{originalFertilizing !== '—' && fertilizing === originalFertilizing && originalFertilizing === 'Every 6 Weeks' ? ' (Recommended)' : ''}
                </option>
                <option value="Seasonal">
                  Seasonal{originalFertilizing !== '—' && fertilizing === originalFertilizing && originalFertilizing === 'Seasonal' ? ' (Recommended)' : ''}
                </option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <label>Notes</label>
            <textarea
              name="notes"
              rows="2"
              placeholder="Anything worth remembering about this plant"
              disabled={processing}
            />
          </div>
          <div className="form-row">
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