import React, { useRef, useEffect } from 'react';

interface SimpleJsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
}

const SimpleJsonEditor: React.FC<SimpleJsonEditorProps> = ({ value, onChange, height = '300px' }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (lineNumbersRef.current && textareaRef.current) {
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (textarea) {
        textarea.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const lineNumbers = value.split('\n').map((_, index) => (
    <div key={index} className="line-number">
      {index + 1}
    </div>
  ));

  return (
    <div className="editor-wrapper" style={{ height }}>
      <div className="simple-json-editor-container">
        <div className="editor-line-numbers" ref={lineNumbersRef}>
          {lineNumbers}
        </div>
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={value}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default SimpleJsonEditor;