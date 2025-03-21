import React, { useState } from 'react';
import SimpleJsonEditor from './editors/SimpleJsonEditor';
import JsonSection from './ui/JsonSection';
import { validateJsonAgainstSchema } from '../utils/jsonUtils';

const SchemaValidator: React.FC = () => {
  const [schema, setSchema] = useState<string>('{\n  "type": "object",\n  "properties": {\n    "name": { "type": "string" },\n    "age": { "type": "number" }\n  },\n  "required": ["name"]\n}');
  const [jsonInput, setJsonInput] = useState<string>('{\n  "name": "Emre",\n  "age": 26\n}');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const validateJson = () => {
    if (!schema.trim() || !jsonInput.trim()) {
      alert("Please enter both JSON schema and JSON data");
      return;
    }
    
    setIsProcessing(true);
    
    setTimeout(() => {
      try {
        const schemaObj = JSON.parse(schema);
        const jsonObj = JSON.parse(jsonInput);
        
        const result = validateJsonAgainstSchema(jsonObj, schemaObj);
        setValidationResult(result);
      } catch (error) {
        alert("Invalid JSON: " + (error instanceof Error ? error.message : String(error)));
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  return (
    <div className="container">
      <h1 className="editor-title">JSON Schema Validator</h1>
      <p className="validator-description">
        Validate your JSON against a JSON Schema to ensure it conforms to the expected structure.
      </p>

      <div className="validator-grid">
        <div className="section">
          <div className="section-header">
            <h2 className="text-xl font-semibold">JSON Schema</h2>
          </div>
          <div className="section-content">
            <SimpleJsonEditor 
              value={schema} 
              onChange={setSchema} 
              height="300px"
            />
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <h2 className="text-xl font-semibold">JSON Input</h2>
          </div>
          <div className="section-content">
            <SimpleJsonEditor 
              value={jsonInput} 
              onChange={setJsonInput} 
              height="300px"
            />
          </div>
        </div>
      </div>

      <div className="editor-actions">
        <button
          className="btn-primary"
          onClick={validateJson}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Validate JSON'}
        </button>
      </div>

      {validationResult && (
        <div className="fade-in">
          <JsonSection 
            title="Validation Result" 
            data={validationResult} 
          />
        </div>
      )}
    </div>
  );
};

export default SchemaValidator;
