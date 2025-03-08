import React, { useRef, useEffect, useState } from 'react';

interface SimpleJsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
}

const SimpleJsonEditor: React.FC<SimpleJsonEditorProps> = ({ value, onChange, height = '300px' }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  
  // Update line numbers whenever the value changes
  useEffect(() => {
    updateLineNumbers();
  }, [value]);

  const updateLineNumbers = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      const lines = value.split('\n').length;
      const lineNumbers = Array.from({ length: lines }, (_, i) => i + 1)
        .map(num => `<div class="line-number">${num}</div>`)
        .join('');
      lineNumbersRef.current.innerHTML = lineNumbers;
      
      // Synchronize scrolling between line numbers and textarea
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Add additional styling to ensure line numbers match up with text
  const editorStyles = {
    height,
  };

  const textareaStyles = {
    lineHeight: '1.5', // Match this with the CSS line-height
    fontFamily: '"Consolas", "Monaco", monospace',
    fontSize: '14px', // Match this with the CSS font-size
  };

  return (
    <div className="simple-json-editor-container" style={editorStyles}>
      <div className="editor-line-numbers" ref={lineNumbersRef}></div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        className="editor-textarea"
        spellCheck={false}
        style={textareaStyles}
      />
    </div>
  );
};

export default SimpleJsonEditor;

export {};
