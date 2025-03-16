import React from 'react';
import { copyToClipboard } from '../../utils/fileUtils';

interface JsonSectionProps {
  title: string;
  data: any;
  actionButton?: React.ReactNode;
}

const JsonSection: React.FC<JsonSectionProps> = ({ title, data, actionButton }) => {
  const jsonString = JSON.stringify(data, null, 2);
  
  const handleCopy = () => {
    copyToClipboard(jsonString);
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="text-xl font-semibold">{title}</h2>
        {actionButton}
      </div>
      <div className="section-content">
        <div className="relative">
          <pre>{jsonString}</pre>
          <button
            className="btn-copy"
            onClick={handleCopy}
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
};

export default JsonSection;
