import React from 'react';

interface PathSelectorProps {
  paths: string[];
  selectedPaths: string[];
  onTogglePath: (path: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onRemove: () => void;
  isProcessing: boolean;
}

const PathSelector: React.FC<PathSelectorProps> = ({ 
  paths, 
  selectedPaths, 
  onTogglePath, 
  onSelectAll, 
  onClearSelection, 
  onRemove, 
  isProcessing 
}) => {
  return (
    <div className="section">
      <div className="section-header">
        <h2 className="text-xl font-semibold">Select Fields to Remove</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={onSelectAll}>Select All</button>
          <button className="btn-secondary" onClick={onClearSelection}>Clear</button>
        </div>
      </div>
      <div className="section-content">
        <div className="checkbox-container">
          {paths
            .filter(path => !path.includes("[].."))
            .map((path) => (
              <div key={path} className="custom-checkbox">
                <input
                  type="checkbox"
                  id={`path-${path}`}
                  checked={selectedPaths.includes(path)}
                  onChange={() => onTogglePath(path)}
                />
                <label htmlFor={`path-${path}`}>{path}</label>
              </div>
            ))}
        </div>
        
        {paths.length > 0 && (
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn-primary"
              onClick={onRemove}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : `View (Remove ${selectedPaths.length} Field(s))`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PathSelector;
