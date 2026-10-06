import { useState } from 'react';
import { AddPlantModal } from './AddPlantModal';

export function Modal({
  plantData,
  onClose,
  onAddPlant,
  showAddPlantButton = false
}) {
  // State for displaying plant data
  const [modalOpen, setModalOpen] = useState(!!plantData);
  const [modalPlantData, setModalPlantData] = useState(plantData || null);

  // State for add plant modal
  const [showAddPlantModal, setShowAddPlantModal] = useState(false);

  // Handle closing modal
  const handleClose = () => {
    setModalOpen(false);
    setModalPlantData(null);
    setShowAddPlantModal(false);
    onClose && onClose();
  };

  // Render plant display modal
  if (modalOpen && modalPlantData && !showAddPlantModal) {
    return (
      <div className="modal-backdrop" onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}>
        <div className="modal" style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', margin: 'auto' }}>
          <div className="modal-head">
            <h3>{modalPlantData.common_name || 'Unknown Plant'}</h3>
            <button className="icon-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            {modalPlantData.photo_url ? (
              <div className="species-image">
                <img src={modalPlantData.photo_url} alt={modalPlantData.common_name} />
              </div>
            ) : (
              <div className="species-icon" style={{ fontSize: 60, width: 80, height: 80 }}>
                🌱
              </div>
            )}
            <div className="species-info">
              <h2>{modalPlantData.common_name || 'Unknown'}</h2>
              <p className="species-scientific" style={{ fontStyle: 'italic', margin: '8px 0' }}>
                {modalPlantData.scientific_name || ''}
              </p>
              {modalPlantData.description && (
                <p className="species-description" style={{ margin: '16px 0', lineHeight: '1.5' }}>
                  {modalPlantData.description}
                </p>
              )}
              <div className="species-care-info" style={{ margin: '16px 0' }}>
                <div className="care-info-item">
                  <span className="care-icon">🌞</span>
                  <div>
                    <div className="care-label">Light</div>
                    <div className="care-value">{modalPlantData.light}</div>
                  </div>
                </div>
                <div className="care-info-item">
                  <span className="care-icon">💧</span>
                  <div>
                    <div className="care-label">Watering</div>
                    <div className="care-value">{modalPlantData.watering}</div>
                  </div>
                </div>
                <div className="care-info-item">
                  <span className="care-icon">🌿</span>
                  <div>
                    <div className="care-label">Fertilizing</div>
                    <div className="care-value">{modalPlantData.fertilizing}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-actions" style={{ marginTop: 'auto', padding: '16px' }}>
            {showAddPlantButton && onAddPlant && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowAddPlantModal(true);
                }}
              >
                Add Plant
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render add plant modal (using AddPlantModal component)
  if (showAddPlantModal) {
    return (
      <div className="modal-backdrop" onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}>
        <AddPlantModal
          onClose={handleClose}
          onAddPlant={onAddPlant}
          defaultSpecies={modalPlantData?.scientific_name || ''}
          defaultSpeciesId={modalPlantData?.id || null}
          defaultPhoto={modalPlantData?.photo_url || null}
          defaultLight={modalPlantData?.light || ''}
          defaultWatering={modalPlantData?.watering || ''}
          defaultFertilizing={modalPlantData?.fertilizing || ''}
        />
      </div>
    );
  }

  // Render nothing if neither state is active
  return null;
}