import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  language = 'json',
  height = '300px',
}) => {
  // For Monaco editor v3.x.x
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  const handleEditorDidMount = (editor: any) => {
    // Additional editor setup if needed
    editor.focus();
  };

  return (
    <div className="monaco-editor-container">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          theme: 'vs-light',
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          }
        }}
      />
    </div>
  );
};

export default MonacoEditor;
