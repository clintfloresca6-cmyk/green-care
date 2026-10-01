import { useState } from 'react';

export function Modal({ plantData, onClose }) {
  if (!plantData) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal" style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', margin: 'auto' }}>
        <div className="modal-head">
          <h3>{plantData.common_name || 'Unknown Plant'}</h3>
          <button className="icon-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {plantData.photo_url ? (
            <div className="species-image">
              <img src={plantData.photo_url} alt={plantData.common_name} />
            </div>
          ) : (
            <div className="species-icon" style={{ fontSize: 60, width: 80, height: 80 }}>
              🌱
            </div>
          )}
          <div className="species-info">
            <h2>{plantData.common_name || 'Unknown'}</h2>
            <p className="species-scientific" style={{ fontStyle: 'italic', margin: '8px 0' }}>
              {plantData.scientific_name || ''}
            </p>
            {plantData.description && (
              <p className="species-description" style={{ margin: '16px 0', lineHeight: '1.5' }}>
                {plantData.description}
              </p>
            )}
            <div className="species-care-info" style={{ margin: '16px 0' }}>
              <div className="care-info-item">
                <span className="care-icon">🌞</span>
                <div>
                  <div className="care-label">Light</div>
                  <div className="care-value">{plantData.light}</div>
                </div>
              </div>
              <div className="care-info-item">
                <span className="care-icon">💧</span>
                <div>
                  <div className="care-label">Watering</div>
                  <div className="care-value">{plantData.watering}</div>
                </div>
              </div>
              <div className="care-info-item">
                <span className="care-icon">🌿</span>
                <div>
                  <div className="care-label">Fertilizing</div>
                  <div className="care-value">{plantData.fertilizing}</div>
                </div>
              </div>
              <div className="care-info-item">
                <span className="care-icon">📈</span>
                <div>
                  <div className="care-label">Difficulty</div>
                  <div className="care-value">{plantData.difficulty}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}