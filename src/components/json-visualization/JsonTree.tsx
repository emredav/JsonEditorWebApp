import { useState } from "react";

function JsonTree({ data, name }: { data: any; name?: string }) {
  const [expanded, setExpanded] = useState(true);

  const getValueClassName = (value: any) => {
    if (value === null || value === undefined) return "json-tree-value-null";
    if (typeof value === "string") return "json-tree-value-string";
    if (typeof value === "number") return "json-tree-value-number";
    if (typeof value === "boolean") return "json-tree-value-boolean";
    return "json-tree-value";
  };

  if (data === null || data === undefined) {
    return (
      <div className="json-tree-item">
        <div className="json-tree-item-content">
          {name && <span className="json-tree-key">{name}:</span>}
          <span className="json-tree-value-null">null</span>
        </div>
      </div>
    );
  }

  if (typeof data !== "object") {
    return (
      <div className="json-tree-item">
        <div className="json-tree-item-content">
          {name && <span className="json-tree-key">{name}:</span>}
          <span className={getValueClassName(data)}>
            {typeof data === "string" ? `"${data}"` : String(data)}
          </span>
        </div>
      </div>
    );
  }

  const isArray = Array.isArray(data);
  const keys = isArray ? data.map((_: any, i: number) => i) : Object.keys(data);
  const isEmpty = keys.length === 0;
  const summary = isArray ? "Array" : "Object";
  const bracketType = isArray ? "[]" : "{}";

  return (
    <div className="json-tree-item">
      <div className="json-tree-item-content" onClick={() => !isEmpty && setExpanded(!expanded)}>
        <div className="json-tree-expand-icon">
          {!isEmpty && (expanded ? "−" : "+")}
        </div>
        
        {name && <span className="json-tree-key">{name}:</span>}
        
        <span className="json-tree-value">
          {bracketType[0]}
          {isEmpty ? bracketType[1] : expanded ? "" : ` ${summary}(${keys.length}) `}
          {!expanded && bracketType[1]}
        </span>
      </div>
      
      {!isEmpty && expanded && (
        <div className="json-tree-children fade-in">
          {keys.map((key: any) => (
            <JsonTree
              key={key}
              data={data[key]}
              name={isArray ? `${key}` : key}
            />
          ))}
          <div className="json-tree-item-content">
            <span className="json-tree-value">{bracketType[1]}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default JsonTree;