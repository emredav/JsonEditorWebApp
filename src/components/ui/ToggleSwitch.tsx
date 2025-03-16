import React from 'react';

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, checked, onChange }) => {
  return (
    <div className="toggle-item">
      <label className="toggle">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
        />
        <span className="toggle-slider"></span>
      </label>
      <span>{label}</span>
    </div>
  );
};

export default ToggleSwitch;
