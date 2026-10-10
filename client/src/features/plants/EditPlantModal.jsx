import { useState } from 'react';
import { useGreenCare } from '../../shared/context/GreenCareContext.jsx';
import { todayISO } from '../../shared/utils/date.js';

export function EditPlantModal({ plantId, onClose }) {
  const { state, actions } = useGreenCare();
  const [photo, setPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [speciesId, setSpeciesId] = useState(null);
  const [location, setLocation] = useState('');
  const [light, setLight] = useState('');
  const [watering, setWatering] = useState('');
  const [fertilizing, setFertilizing] = useState('');
  const [notes, setNotes] = useState('');

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

        // Prepare data for submission (PATCH)
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
          name: data.name.trim(),
          speciesName: data.species.trim(),
          speciesId: speciesId,
          location: data.location || null,
          light: data.light || null,
          watering: data.watering || null,
          fertilizing: data.fertilizing || null,
          notes: data.notes || null,
          photo: photoUrl, // Include photo (either base64 for upload or preview URL)
        };

        // Remove null values to avoid overwriting with null
        const patch = Object.fromEntries(
          Object.entries(plantData).filter(([, v]) => v != null)
        );

        console.log('Submitting plant update data:', patch);

        // Call the updatePlant action
        if (actions.updatePlant) {
          await actions.updatePlant(plantId, patch);
        }

        console.log('Plant updated successfully:', patch);

        // Reset form on success
        setError('');
        setPhoto(null);
        setPhotoFile(null);
        setProcessing(false);
        onClose && onClose();
      } catch (err) {
        setError('Failed to update plant. Please try again.');
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

  // Get the plant data for pre-filling the form
  const plant = state.plants.find(p => p.id === plantId);

  return (
    <div className="modal-backdrop" onClick={(e) => {
        if (e.target === e.currentTarget) onClose && onClose()
      }}>
      <div className="modal">
        <div className="modal-head">
          <h3>Edit Plant</h3>
          <button className="icon-btn" type="button" onClick={() => {
              actions.closeModal()
              if (onClose) onClose()
          }}>×</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-row">
              <label>Plant Name *</label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Luna"
                defaultValue={plant ? plant.name : ''}
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
                defaultValue={plant ? plant.species_name : ''}
                disabled={processing}
              />
            </div>
            <div className="form-row">
              <label>Location</label>
              <input
                type="text"
                name="location"
                placeholder="e.g. Living Room Window"
                defaultValue={plant ? plant.location : ''}
                disabled={processing}
                required
              />
            </div>
            <div className="form-row">
              <label>Light Condition</label>
              <select
                name="light"
                defaultValue={plant ? plant.light : ''}
                disabled={processing}
                required
              >
                <option value="">-- Select Light Condition --</option>
                <option value="Bright Indirect">
                  Bright Indirect
                </option>
                <option value="Low light">
                  Low light
                </option>
                <option value="Full Sun">
                  Full Sun
                </option>
                <option value="Partial shade">
                  Partial shade
                </option>
                <option value="Medium light">
                  Medium light
                </option>
              </select>
            </div>
            <div className="form-row">
              <label>Watering Frequency</label>
              <select
                name="watering"
                defaultValue={plant ? plant.watering : ''}
                disabled={processing}
                required
              >
                <option value="">-- Select Watering Frequency --</option>
                <option value="Every 3 days">
                  Every 3 days
                </option>
                <option value="Weekly">
                  Weekly
                </option>
                <option value="Every 10 days">
                  Every 10 days
                </option>
                <option value="Every 2 weeks">
                  Every 2 weeks
                </option>
              </select>
            </div>
            <div className="form-row">
              <label>Fertilizing Frequency</label>
              <select
                name="fertilizing"
                defaultValue={plant ? plant.fertilizing : ''}
                disabled={processing}
                required
              >
                <option value="">-- Select Fertilizing Frequency --</option>
                <option value="Monthly">
                  Monthly
                </option>
                <option value="Every 2 Weeks">
                  Every 2 Weeks
                </option>
                <option value="Every 6 Weeks">
                  Every 6 Weeks
                </option>
                <option value="Seasonal">
                  Seasonal
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
              defaultValue={plant ? plant.notes : ''}
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
              onClick={() => {
                  actions.closeModal()
                  if (onClose) onClose()
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
              {processing ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}