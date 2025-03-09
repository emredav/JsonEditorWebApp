import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "./styles.css";
import JsonTree from "./components/JsonTree";
import SimpleJsonEditor from "./components/SimpleJsonEditor";
import { useState, useRef } from "react";

// Dosyayı JSON olarak indirme fonksiyonu
function downloadJson(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = href;
  link.download = filename || 'data.json';
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
}

ReactDOM.render(
  <React.StrictMode>
    <Home />
  </React.StrictMode>,
  document.getElementById("root")
);

// Generate a basic JSON schema from any JSON input
function generateSchema(value: any): any {
  if (Array.isArray(value)) {
    return {
      type: "array",
      items: value.length > 0 ? generateSchema(value[0]) : {}
    };
  } else if (value && typeof value === "object") {
    const properties: Record<string, any> = {};
    for (const key in value) {
      properties[key] = generateSchema(value[key]);
    }
    return {
      type: "object",
      properties
    };
  } else if (typeof value === "string") {
    return { type: "string" };
  } else if (typeof value === "number") {
    return { type: "number" };
  } else if (typeof value === "boolean") {
    return { type: "boolean" };
  } else {
    return { type: "null" };
  }
}

// Recursively collect unique paths from JSON
function gatherPaths(data: any, currentPath = "", paths = new Set<string>()): Set<string> {
  if (Array.isArray(data)) {
    if (currentPath) {
      paths.add(currentPath);
    }
    
    // Sadece array içindekilerle ilgili pathleri ekleyelim
    if (data.length > 0) {
      // Array path'ini ekle
      const arrayPath = currentPath ? `${currentPath}[]` : "[]";
      paths.add(arrayPath); // Array'in kendisini boşaltma seçeneği
      
      // Array'in ilk elemanı için yapı çıkarma
      if (typeof data[0] === "object" && data[0] !== null) {
        for (const key in data[0]) {
          const newPath = `${arrayPath}.${key}`;
          paths.add(newPath);
          
          // Eğer bu property bir array ise, onun için de [] seçeneği ekle
          if (Array.isArray(data[0][key])) {
            paths.add(`${newPath}[]`); // İç array'i boşaltma seçeneği
          }
          
          gatherPaths(data[0][key], newPath, paths);
        }
      }
    }
  } else if (data !== null && typeof data === "object") {
    if (currentPath) {
      paths.add(currentPath);
    }
    for (const key in data) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      paths.add(newPath);
      
      // Eğer bu property bir array ise, onun için de [] seçeneği ekle
      if (Array.isArray(data[key])) {
        paths.add(`${newPath}[]`); // İç array'i boşaltma seçeneği
      }
      
      gatherPaths(data[key], newPath, paths);
    }
  } else {
    if (currentPath) {
      paths.add(currentPath);
    }
  }
  return paths;
}

// Recursively count array/object paths and items
function gatherCounts(value: any, currentPath = "", counts = new Map<string, number>()): Map<string, number> {
  if (Array.isArray(value)) {
    if (currentPath) {
      // Array'in kendisini say
      counts.set(currentPath, 1); // Her array 1 kez sayılır
      
      // Array içindeki elemanların sayısını belirle
      const arrayPath = `${currentPath}[]`;
      counts.set(arrayPath, value.length);
    }
    
    // Her bir array elemanı için işlem yap
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const indexPath = currentPath ? `${currentPath}[].${i}` : `[].${i}`;
      
      // Her bir indeks için sadece bir kez sayaç ekle
      // BUG FIX: Burada önceki değeri kontrol ediyoruz, çift sayımları önlemek için
      if (!counts.has(indexPath)) {
        counts.set(indexPath, 1);
      }
      
      // İç içe array veya obje ise, içeriğini de analiz et
      if (item !== null && typeof item === "object") {
        gatherCounts(item, indexPath, counts);
      }
    }
    
    // BUG FIX: Eski kod tamamen kaldırıldı
    // Önceki versiyonda burada ilk eleman için tekrar işlem yapıyorduk
    // Bu da çift sayıma neden oluyordu (özellikle nested arraylerde)
  } 
  else if (value !== null && typeof value === "object") {
    if (currentPath) {
      counts.set(currentPath, 1); // Her obje 1 kez sayılır
    }
    for (const key in value) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      
      // Alt öğe bir array mi diye kontrol et
      if (Array.isArray(value[key])) {
        if (!counts.has(newPath)) {
          counts.set(newPath, 1);
        }
        
        // Array elemanlarının sayısını ekle
        const arrayPath = `${newPath}[]`;
        counts.set(arrayPath, value[key].length);
      } 
      // Alt öğe başka bir obje mi?
      else if (value[key] !== null && typeof value[key] === "object") {
        if (!counts.has(newPath)) {
          counts.set(newPath, 1);
        }
      }
      // Basit değer mi?
      else {
        if (!counts.has(newPath)) {
          counts.set(newPath, 1);
        }
      }
      
      // Alt öğenin içeriğini analiz et (recursive)
      if (value[key] !== null && typeof value[key] === "object") {
        gatherCounts(value[key], newPath, counts);
      }
    }
  } 
  else {
    // Primitive değerler için (string, number, boolean, null)
    if (currentPath && !counts.has(currentPath)) {
      counts.set(currentPath, 1);
    }
  }
  return counts;
}

// Remove selected paths from JSON
function removeSelectedPaths(data: any, pathsToRemove: string[]): any {
  let result = data;
  for (const path of pathsToRemove) {
    result = removePath(result, path);
  }
  return result;
}

function removePath(data: any, path: string): any {
  // Path'deki çift noktaları temizle
  path = path.replace(/\.{2,}/g, '.');
  
  // Path'i tokenlara ayır
  const tokens = path.split(".");
  
  // Path'de "[]" içeren bir parça varsa özel işle
  if (path.includes("[]")) {
    // Örn: arkadas_listesi[].yas -> ["arkadas_listesi[]", "yas"] 
    // şeklinde tokenlara ayrılacak
    return removePathHelper(data, tokens);
  }
  
  return removePathHelper(data, tokens);
}

function removePathHelper(data: any, tokens: string[]): any {
  // Eğer token kalmadıysa işlem yapma
  if (!tokens.length) return data;

  let token = tokens[0];
  let isArrayEmptying = false;
  
  // "[]" ile biten token kontrolü (örn: arkadas_listesi[])
  if (token.endsWith("[]")) {
    isArrayEmptying = true;
    token = token.slice(0, -2); // "[]" kısmını kaldır
  }

  if (Array.isArray(data)) {
    // Eğer data bir array ise:
    
    // 1. "arkadas_listesi[].yas" gibi bir durumda tokens = ["yas"] kalır
    // 2. Bu durumda array'in her elemanında bu token'ı işlemeliyiz
    return data.map(item => removePathHelper(item, tokens));
  } 
  else if (data && typeof data === "object") {
    // Data bir obje ise
    const copy = { ...data }; // Objenin kopyasını al
    
    if (token in copy) {
      // Token objede var ise
      
      if (isArrayEmptying && Array.isArray(copy[token])) {
        // Eğer token bir array ve "[]" ile işaretlenmişse içeriğini boşalt
        if (tokens.length === 1) {
          // Bu son token ise array'i boşalt
          copy[token] = [];
          return copy;
        } else {
          // Örn: arkadas_listesi[].yas için buraya geliyoruz ve tokens.slice(1) = ["yas"]
          // Her arkadaş için yas özelliğini silmemiz gerekiyor
          if (Array.isArray(copy[token])) {
            // Array içindeki her elemana yeni tokens'ları uygula
            copy[token] = copy[token].map((item: any) => {
              // Array içindeki her elemana kalan tokenleri uygula
              return removePathHelper(item, tokens.slice(1));
            });
            return copy;
          }
        }
      } else if (tokens.length === 1) {
        // Son token ise ve array boşaltma değilse, özelliği sil
        delete copy[token];
        return copy;
      } else if (copy[token] !== null && (typeof copy[token] === "object" || Array.isArray(copy[token]))) {
        // Daha fazla token var ve içeri girebiliyorsak, recursive devam et
        copy[token] = removePathHelper(copy[token], tokens.slice(1));
      }
    }
    return copy;
  }
  return data;
}

// Copy utility
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
    .then(() => {
      // Show success notification
      const notification = document.createElement('div');
      notification.textContent = '✓ Copied to clipboard';
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 10px 16px;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: fadeIn 0.3s, fadeOut 0.5s 1.5s forwards;
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 2000);
    })
    .catch(() => {
      alert("Failed to copy to clipboard.");
    });
}

function Home() {
  const [jsonInput, setJsonInput] = useState("");
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [generatedSchema, setGeneratedSchema] = useState<any>(null);
  const [allPaths, setAllPaths] = useState<string[]>([]);
  const [selectedRemovalPaths, setSelectedRemovalPaths] = useState<string[]>([]);
  const [itemCounts, setItemCounts] = useState<Map<string, number>>(new Map());
  const [modifiedJson, setModifiedJson] = useState<any>(null);

  const [showSchema, setShowSchema] = useState(false);
  const [showItemCounts, setShowItemCounts] = useState(false);
  const [showParsedTree, setShowParsedTree] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Dosya yükleme için ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Input temizleme fonksiyonu
  const clearJsonInput = () => {
    // Onay popup'ı göster
    if (window.confirm("Are you sure you want to clear the JSON input? This action cannot be undone.")) {
      setJsonInput("");
      setParsedJson(null);
      setGeneratedSchema(null);
      setAllPaths([]);
      setSelectedRemovalPaths([]);
      setItemCounts(new Map());
      setModifiedJson(null);
    }
  };

  const handleContinue = () => {
    if (!jsonInput.trim()) {
      alert("Please enter JSON data first");
      return;
    }
    
    setIsProcessing(true);
    
    setTimeout(() => {
      try {
        const data = JSON.parse(jsonInput);
        setParsedJson(data);
        setModifiedJson(null);
  
        const schema = generateSchema(data);
        setGeneratedSchema(schema);
  
        const pathSet = gatherPaths(data);
        // Path'leri temizle - çift nokta içerenleri düzelt
        const cleanedPaths = Array.from(pathSet)
          .map(path => path.replace(/\.{2,}/g, '.')) // Çift noktaları tek noktaya çevir
          .sort();
        setAllPaths(cleanedPaths);
  
        const countsMap = gatherCounts(data);
        setItemCounts(countsMap);
  
        setSelectedRemovalPaths([]);
      } catch (error) {
        alert("Invalid JSON: " + (error instanceof Error ? error.message : String(error)));
      } finally {
        setIsProcessing(false);
      }
    }, 100); // Small delay for better UX
  };

  const togglePath = (path: string) => {
    if (selectedRemovalPaths.includes(path)) {
      setSelectedRemovalPaths(selectedRemovalPaths.filter((p) => p !== path));
    } else {
      setSelectedRemovalPaths([...selectedRemovalPaths, path]);
    }
  };

  const selectAllPaths = () => {
    setSelectedRemovalPaths([...allPaths]);
  };

  const clearSelectedPaths = () => {
    setSelectedRemovalPaths([]);
  };

  const handleRemove = () => {
    if (!parsedJson) return;
    setIsProcessing(true);
    
    setTimeout(() => {
      try {
        const newJson = removeSelectedPaths(parsedJson, selectedRemovalPaths);
        setModifiedJson(newJson);
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  const loadSampleJson = () => {
    const sample = JSON.stringify({
      "name": "JSON Editor",
      "version": 1.0,
      "features": ["Parse JSON", "Edit JSON", "Visualize JSON"],
      "settings": {
        "theme": "light",
        "autoSave": true,
        "notifications": {
          "enabled": true,
          "types": ["error", "warning", "info"]
        }
      },
      "stats": {
        "users": 1000,
        "rating": 4.8
      }
    }, null, 2);
    
    setJsonInput(sample);
  };

  // Dosya yükleme fonksiyonu
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Type-safe approach without using type assertion syntax
        if (e.target && typeof e.target.result === 'string') {
          const content = e.target.result;
          setJsonInput(content);
          
          // Auto-parse JSON after loading
          if (content.trim()) {
            const data = JSON.parse(content);
            setParsedJson(data);
            setModifiedJson(null);
      
            const schema = generateSchema(data);
            setGeneratedSchema(schema);
      
            const pathSet = gatherPaths(data);
            // Path'leri temizle
            const cleanedPaths = Array.from(pathSet)
              .map(path => path.replace(/\.{2,}/g, '.')) // Çift noktaları temizle
              .sort();
            setAllPaths(cleanedPaths);
      
            const countsMap = gatherCounts(data);
            setItemCounts(countsMap);
      
            setSelectedRemovalPaths([]);
          }
        }
      } catch (error) {
        alert("Invalid JSON file: " + (error instanceof Error ? error.message : String(error)));
      }
    };
    reader.readAsText(file);
    
    // Reset the file input so the same file can be selected again
    event.target.value = '';
  };
  
  // JSON indirme fonksiyonu
  const downloadModifiedJson = () => {
    if (!modifiedJson) return;
    downloadJson(modifiedJson, 'modified.json');
  };
  
  // Satır sayılarını yaratmak için - Artık kullanılmıyor, Monaco bu işi yapacak
  // const lineNumbers = jsonInput.split('\n').map((_, i) => i + 1).join('\n');

  return (
    <div className="container min-h-screen">
      <h1 className="editor-title">JSON Editor</h1>

      <div className="toggle-container">
        <div className="toggle-item">
          <label className="toggle">
            <input
              type="checkbox"
              checked={showSchema}
              onChange={() => setShowSchema(!showSchema)}
            />
            <span className="toggle-slider"></span>
          </label>
          <span>JSON Schema</span>
        </div>

        <div className="toggle-item">
          <label className="toggle">
            <input
              type="checkbox"
              checked={showItemCounts}
              onChange={() => setShowItemCounts(!showItemCounts)}
            />
            <span className="toggle-slider"></span>
          </label>
          <span>Item Counts</span>
        </div>

        <div className="toggle-item">
          <label className="toggle">
            <input
              type="checkbox"
              checked={showParsedTree}
              onChange={() => setShowParsedTree(!showParsedTree)}
            />
            <span className="toggle-slider"></span>
          </label>
          <span>JSON Tree</span>
        </div>
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
              onClick={handleContinue}
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
            <div className="section">
              <div className="section-header">
                <h2 className="text-xl font-semibold">JSON Schema</h2>
              </div>
              <div className="section-content">
                <div className="relative">
                  <pre>{JSON.stringify(generatedSchema, null, 2)}</pre>
                  <button
                    className="btn-copy"
                    onClick={() => copyToClipboard(JSON.stringify(generatedSchema, null, 2))}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
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

          <div className="section">
            <div className="section-header">
              <h2 className="text-xl font-semibold">Select Fields to Remove</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" onClick={selectAllPaths}>Select All</button>
                <button className="btn-secondary" onClick={clearSelectedPaths}>Clear</button>
              </div>
            </div>
            <div className="section-content">
              <div className="checkbox-container">
                {allPaths
                  .filter(path => !path.includes("[]..")) // Çift noktalar içeren path'leri filtrele
                  .map((path) => (
                    <div key={path} className="custom-checkbox">
                      <input
                        type="checkbox"
                        id={`path-${path}`}
                        checked={selectedRemovalPaths.includes(path)}
                        onChange={() => togglePath(path)}
                      />
                      <label htmlFor={`path-${path}`}>{path}</label>
                    </div>
                  ))}
              </div>
              
              {allPaths.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn-primary"
                    onClick={handleRemove}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : `View (Remove ${selectedRemovalPaths.length} Field(s))`}
                  </button>
                </div>
              )}
            </div>
          </div>

          {modifiedJson && (
            <div className="section fade-in">
              <div className="section-header">
                <h2 className="text-xl font-semibold">Modified JSON</h2>
                <button
                  className="btn-download"
                  onClick={downloadModifiedJson}
                >
                  <i className="icon-download"></i>
                  Download JSON
                </button>
              </div>
              <div className="section-content">
                <div className="relative">
                  <pre>{JSON.stringify(modifiedJson, null, 2)}</pre>
                  <button
                    className="btn-copy"
                    onClick={() => copyToClipboard(JSON.stringify(modifiedJson, null, 2))}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Home;