import React, { useRef, useState } from 'react';
import JsonTree from './json-visualization/JsonTree';
import SimpleJsonEditor from './editors/SimpleJsonEditor';
import ToggleSwitch from './ui/ToggleSwitch';
import JsonSection from './ui/JsonSection';
import PathSelector from './ui/PathSelector';
import { useJsonOperations } from '../hooks/useJsonOperations';
import { downloadJson, copyToClipboard } from '../utils/fileUtils';

const Home: React.FC = () => {
  const {
    jsonInput,
    setJsonInput,
    parsedJson,
    generatedSchema,
    allPaths,
    selectedRemovalPaths,
    itemCounts,
    modifiedJson,
    isProcessing,
    parseJson,
    processJsonFromFile,
    togglePath,
    selectAllPaths,
    clearSelectedPaths,
    handleRemove,
    loadSampleJson,
    clearJsonInput
  } = useJsonOperations();

  const [showSchema, setShowSchema] = useState(false);
  const [showItemCounts, setShowItemCounts] = useState(false);
  const [showParsedTree, setShowParsedTree] = useState(true);
  
  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        const content = e.target.result;
        setJsonInput(content);
        processJsonFromFile(content);
      }
    };
    reader.readAsText(file);
    
    // Reset the file input
    event.target.value = '';
  };
  
  // JSON download handler
  const downloadModifiedJson = () => {
    if (!modifiedJson) return;
    downloadJson(modifiedJson, 'modified.json');
  };

  return (
    <div className="container min-h-screen">
      <div className="header-container">
        <h1 className="editor-title">JSON Tools</h1>
        <h2 className="editor-subtitle">JSON Path Analyzer & Remover</h2>
        <a href="https://github.com/emredav/JsonEditorWebApp" target="_blank" rel="noopener noreferrer" className="github-link">
          <svg className="github-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      </div>

      <div className="toggle-container">
        <ToggleSwitch 
          label="JSON Schema" 
          checked={showSchema} 
          onChange={() => setShowSchema(!showSchema)} 
        />
        <ToggleSwitch 
          label="Item Counts" 
          checked={showItemCounts} 
          onChange={() => setShowItemCounts(!showItemCounts)} 
        />
        <ToggleSwitch 
          label="JSON Tree" 
          checked={showParsedTree} 
          onChange={() => setShowParsedTree(!showParsedTree)} 
        />
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="text-xl font-semibold">Input JSON</h2>
          <div className="button-group responsive-button-group">
            <button 
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="icon-upload"></i>
              <span className="button-text">Upload</span>
            </button>
            <button 
              className="btn-secondary"
              onClick={loadSampleJson}
            >
              <i className="icon-sample"></i>
              <span className="button-text">Sample</span>
            </button>
          </div>
        </div>
        <div className="section-content">
          <div className="editor-wrapper">
            <SimpleJsonEditor 
              value={jsonInput} 
              onChange={setJsonInput} 
              height="300px"
            />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".json" 
            style={{ display: 'none' }} 
          />
          <div className="editor-actions">
            <button
              className="btn-danger"
              onClick={clearJsonInput}
              disabled={!jsonInput.trim()}
            >
              <i className="icon-clear"></i>
              Clear
            </button>
            <button
              className="btn-primary"
              onClick={parseJson}
              disabled={isProcessing || !jsonInput.trim()}
            >
              {isProcessing ? 'Processing...' : 'Parse JSON'}
            </button>
          </div>
        </div>
      </div>

      {parsedJson && (
        <div className="fade-in">
          {showSchema && (
            <JsonSection 
              title="JSON Schema" 
              data={generatedSchema} 
            />
          )}

          {showItemCounts && (
            <div className="section">
              <div className="section-header">
                <h2 className="text-xl font-semibold">Item Counts</h2>
              </div>
              <div className="section-content">
                <div className="checkbox-container">
                  {Array.from(itemCounts.entries()).map(([path, count]) => (
                    <div key={path} className="mb-1">
                      <span className="font-medium">{path}:</span> {count}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showParsedTree && (
            <div className="section">
              <div className="section-header">
                <h2 className="text-xl font-semibold">JSON Tree</h2>
              </div>
              <div className="section-content tree-container">
                <JsonTree data={parsedJson} name="root" />
              </div>
            </div>
          )}

          <PathSelector 
            paths={allPaths}
            selectedPaths={selectedRemovalPaths}
            onTogglePath={togglePath}
            onSelectAll={selectAllPaths}
            onClearSelection={clearSelectedPaths}
            onRemove={handleRemove}
            isProcessing={isProcessing}
          />

          {modifiedJson && (
            <JsonSection 
              title="Modified JSON" 
              data={modifiedJson}
              actionButton={
                <button
                  className="btn-download"
                  onClick={downloadModifiedJson}
                >
                  <i className="icon-download"></i>
                  Download JSON
                </button>
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
