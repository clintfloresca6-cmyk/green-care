import { useState, useEffect } from 'react';

// Define the exact values used in the HTML options
const LIGHT_OPTIONS = ["Bright Indirect", "Low light", "Full Sun", "Partial shade", "Medium light"];
const WATERING_OPTIONS = ["Every 3 days", "Weekly", "Every 10 days", "Every 2 weeks"];
const FERTILIZING_OPTIONS = ["Monthly", "Every 2 Weeks", "Every 6 Weeks", "Seasonal"];

export function AddPlantModal({ onClose, onAddPlant, defaultSpecies = '', defaultSpeciesId = null, defaultPhoto = null, defaultLight = '', defaultWatering = '', defaultFertilizing = '' }) {
  const [photo, setPhoto] = useState(defaultPhoto);
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [species, setSpecies] = useState(defaultSpecies || '');
  const [speciesId, setSpeciesId] = useState(defaultSpeciesId ?? null);
  
  // State for form inputs
  const [light, setLight] = useState('');
  const [watering, setWatering] = useState('');
  const [fertilizing, setFertilizing] = useState('');
  
  // State to hold the recommended (original) values
  const [originalLight, setOriginalLight] = useState('');
  const [originalWatering, setOriginalWatering] = useState('');
  const [originalFertilizing, setOriginalFertilizing] = useState('');

  // Helper: Forces the Trefle string to match our exact HTML option casing.
  // If no match or '—', returns empty string so the placeholder shows correctly.
  const normalizeValue = (val, options) => {
    if (!val || val === '—') return '';
    const match = options.find(o => o.toLowerCase() === val.toLowerCase());
    return match || ''; 
  };

  // Helper to handle case-insensitive comparisons for the "(Recommended)" label
  const isRecommended = (currentVal, originalVal) => {
    if (!currentVal || !originalVal) return false;
    return currentVal.toLowerCase() === originalVal.toLowerCase();
  };

  // Auto-resize textarea
  const handleAutoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  // Set initial values and original values
  useEffect(() => {
    const normLight = normalizeValue(defaultLight, LIGHT_OPTIONS);
    const normWatering = normalizeValue(defaultWatering, WATERING_OPTIONS);
    const normFertilizing = normalizeValue(defaultFertilizing, FERTILIZING_OPTIONS);

    setLight(normLight);
    setOriginalLight(normLight);

    setWatering(normWatering);
    setOriginalWatering(normWatering);

    setFertilizing(normFertilizing);
    setOriginalFertilizing(normFertilizing);

    if (defaultSpecies) setSpecies(defaultSpecies);
    if (defaultSpeciesId !== null) setSpeciesId(defaultSpeciesId);
  }, [defaultLight, defaultWatering, defaultFertilizing, defaultSpecies, defaultSpeciesId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!processing) {
      setProcessing(true);
      setError('');
      try {
        const form = e.currentTarget;
        const name = form.elements.name.value.trim();
        const species = form.elements.species.value.trim();
        const location = form.elements.location.value.trim() || null;
        const light = form.elements.light.value || null;
        const watering = form.elements.watering.value || null;
        const fertilizing = form.elements.fertilizing.value || null;
        const notes = form.elements.notes.value.trim() || null;

        if (!name || !species) {
          setError('Please give your plant a name and a species before saving.');
          setProcessing(false);
          return;
        }

        let photoUrl = photo || null;

        if (photoFile) {
          try {
            const base64Image = await fileToBase64(photoFile);
            photoUrl = base64Image;
          } catch (error) {
            console.error('Error converting image to base64:', error);
            photoUrl = photo || null;
          }
        }

        const plantData = {
          name,
          species_name: species,
          species_id: speciesId,
          location,
          light,
          watering,
          fertilizing,
          notes,
          photo: photoUrl,
        };

        if (onAddPlant) {
          await onAddPlant(plantData);
        }

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

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

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
              <input type="text" name="name" required placeholder="e.g. Luna" disabled={processing} />
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
              <input type="text" name="location" placeholder="e.g. Living Room Window" disabled={processing} required />
            </div>
            <div className="form-row">
              <label>Light Condition</label>
              <select name="light" value={light} onChange={(e) => setLight(e.target.value)} disabled={processing} required>
                <option value="">-- Select Light Condition --</option>
                <option value="Bright Indirect">
                  Bright Indirect{isRecommended('Bright Indirect', originalLight) ? ' (Recommended)' : ''}
                </option>
                <option value="Low light">
                  Low light{isRecommended('Low light', originalLight) ? ' (Recommended)' : ''}
                </option>
                <option value="Full Sun">
                  Full Sun{isRecommended('Full Sun', originalLight) ? ' (Recommended)' : ''}
                </option>
                <option value="Partial shade">
                  Partial shade{isRecommended('Partial shade', originalLight) ? ' (Recommended)' : ''}
                </option>
                <option value="Medium light">
                  Medium light{isRecommended('Medium light', originalLight) ? ' (Recommended)' : ''}
                </option>
              </select>
            </div>
            <div className="form-row">
              <label>Watering Frequency</label>
              <select name="watering" value={watering} onChange={(e) => setWatering(e.target.value)} disabled={processing} required>
                <option value="">-- Select Watering Frequency --</option>
                <option value="Every 3 days">
                  Every 3 days{isRecommended('Every 3 days', originalWatering) ? ' (Recommended)' : ''}
                </option>
                <option value="Weekly">
                  Weekly{isRecommended('Weekly', originalWatering) ? ' (Recommended)' : ''}
                </option>
                <option value="Every 10 days">
                  Every 10 days{isRecommended('Every 10 days', originalWatering) ? ' (Recommended)' : ''}
                </option>
                <option value="Every 2 weeks">
                  Every 2 weeks{isRecommended('Every 2 weeks', originalWatering) ? ' (Recommended)' : ''}
                </option>
              </select>
            </div>
            <div className="form-row">
              <label>Fertilizing Frequency</label>
              <select name="fertilizing" value={fertilizing} onChange={(e) => setFertilizing(e.target.value)} disabled={processing} required>
                <option value="">-- Select Fertilizing Frequency --</option>
                <option value="Monthly">
                  Monthly{isRecommended('Monthly', originalFertilizing) ? ' (Recommended)' : ''}
                </option>
                <option value="Every 2 Weeks">
                  Every 2 Weeks{isRecommended('Every 2 Weeks', originalFertilizing) ? ' (Recommended)' : ''}
                </option>
                <option value="Every 6 Weeks">
                  Every 6 Weeks{isRecommended('Every 6 Weeks', originalFertilizing) ? ' (Recommended)' : ''}
                </option>
                <option value="Seasonal">
                  Seasonal{isRecommended('Seasonal', originalFertilizing) ? ' (Recommended)' : ''}
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
              onInput={handleAutoResize}
              style={{ resize: 'none', overflowY: 'hidden', minHeight: '60px' }}
            />
          </div>
          <div className="form-row">
            <label>Plant Photo</label>
            <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={processing} />
            {photo && (
              <div className="photo-preview">
                <img src={photo} alt="Preview" style={{ maxWidth: '100%', height: '100%' }} />
              </div>
            )}
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={onClose} disabled={processing}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={processing}>
              {processing ? 'Adding...' : 'Add Plant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}