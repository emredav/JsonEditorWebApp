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
  
  // Dizi elemanı özel durumunu kontrol et (örn: matris[].0)
  //"matris": [
  //  [1, 2, 3],
  //  [4, 5, 6],
  //  [7, 8, 9]
  // ]
  // Bu, matris dizisinin 0. elemanını silme işlemi için gerekli
  const arrayElementMatch = path.match(/^(.+)\[\]\.(\d+)$/);
  if (arrayElementMatch) {
    const arrayPath = arrayElementMatch[1]; // "matris"
    const index = parseInt(arrayElementMatch[2]); // 0
    
    // Önce array'i bul
    let parentObj = data;
    const parentPath = arrayPath.split('.');
    
    // Eğer '.' içeriyorsa önceki objeleri bulmak için path'i takip et
    if (parentPath.length > 1) {
      for (let i = 0; i < parentPath.length - 1; i++) {
        if (parentObj[parentPath[i]] === undefined) return data;
        parentObj = parentObj[parentPath[i]];
      }
    }
    
    const lastKey = parentPath[parentPath.length - 1];
    
    // Array'in kendisi var mı ve gerçekten bir array mi?
    if (parentObj[lastKey] && Array.isArray(parentObj[lastKey])) {
      // İndeks geçerli mi kontrol et
      if (index >= 0 && index < parentObj[lastKey].length) {
        // Dizi kopyası oluştur ve belirli indeksi kaldır
        const arrayClone = [...parentObj[lastKey]];
        arrayClone.splice(index, 1);
        
        // Eğer ana obje aynıysa (data doğrudan array'se)
        if (parentObj === data && parentPath.length === 1 && lastKey === "0") {
          return arrayClone;
        }
        
        // Ana objenin kopyasını oluştur
        const parentObjClone = Array.isArray(parentObj) ? [...parentObj] : {...parentObj};
        parentObjClone[lastKey] = arrayClone;
        
        // En dıştaki objeyi oluştur
        if (parentObj === data) {
          return parentObjClone;
        }
        
        // Üst obje path'i ile tekrar çağır
        let result = {...data};
        let current = result;
        for (let i = 0; i < parentPath.length - 1; i++) {
          const key = parentPath[i];
          current[key] = i === parentPath.length - 2 ? parentObjClone : {...current[key]};
          current = current[key];
        }
        
        return result;
      }
    }
    return data; // Eğer array yoksa veya indeks geçersizse değişiklik yapma
  }
  
  // Path'i tokenlara ayır
  const tokens = path.split(".");
  
  // Normal path işleme - diğer durumlar için
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

  // İç içe dizi yapısı için özel durum kontrolü (örn: matris[].0)
  // Bu token sayısal bir indeks mi kontrol et
  const isNumericIndex = !isNaN(parseInt(token)) && String(parseInt(token)) === token;

  if (Array.isArray(data)) {
    // Eğer data bir array ve önceki token []'li bir token idi ise
    // ve şu anki token bir sayı ise (örn: matris[].0)
    if (isNumericIndex) {
      // Bu durumda, token'ın belirttiği indeksteki elemanı kaldırmalıyız
      const index = parseInt(token);
      
      // İndeks, array sınırları içinde mi kontrol et
      if (index >= 0 && index < data.length) {
        // Eğer bu son token ise, array'den bu elemanı çıkar
        if (tokens.length === 1) {
          // Belirtilen indeksteki elemanı kaldır
          return data.filter((_, i) => i !== index);
        } else {
          // Eğer başka tokenlar da varsa, bu elemanın içine devam et
          const result = [...data];
          result[index] = removePathHelper(result[index], tokens.slice(1));
          return result;
        }
      }
      return data; // Geçersiz indeks ise data'yı değiştirmeden döndür
    }
    
    // Diğer durumlarda, array içindeki her elemana token'ları uygula
    // Bu, "arkadas_listesi[].yas" gibi durumlarda çalışır
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
          // Özel durum: sonraki token sayısal indeks ise (örn: matris[].0)
          const nextToken = tokens[1];
          const isNextNumeric = !isNaN(parseInt(nextToken)) && String(parseInt(nextToken)) === nextToken;
          
          if (isNextNumeric && Array.isArray(copy[token])) {
            // Bu durumda her bir iç diziden belirli bir indeksteki elemanı kaldırmalıyız
            const index = parseInt(nextToken);
            // Her bir iç dizi için indeksteki elemanı kaldır
            copy[token] = copy[token].map((innerArray: any) => {
              if (Array.isArray(innerArray) && index >= 0 && index < innerArray.length) {
                // İndeksteki elemanı kaldır
                return innerArray.filter((_, i) => i !== index);
              }
              return innerArray; // Diziyse ve indeks geçerliyse değişiklik yap, değilse aynen döndür
            });
            
            // İşlem yapıldığı için bir sonraki token olan indeksi atla
            return removePathHelper(copy, tokens.slice(2));
          } else {
            // Normal durum: array içindeki her elemana tokens'ları uygula
            if (Array.isArray(copy[token])) {
              copy[token] = copy[token].map((item: any) => {
                return removePathHelper(item, tokens.slice(1));
              });
              return copy;
            }
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

// Kopyalama işlemi için geliştirilmiş mobil uyumlu fonksiyon
function copyToClipboard(text: string) {
  // Bildirim gösterme fonksiyonu - kopyalama sonrası kullanıcıya bilgi verir
  const showNotification = (success: boolean) => {
    const notification = document.createElement('div');
    notification.textContent = success ? '✓ Copied' : '✗ Copy failed';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${success ? '#10b981' : '#ef4444'};
      color: white;
      padding: 10px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 1000;
      opacity: 1;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(notification);
    
    // Notification'ı temiz şekilde kaldır (animasyon sorunu düzeltildi)
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 1700);
  };

  // Modern Clipboard API ile deneme
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => {
        showNotification(true);
      })
      .catch((err) => {
        console.error("Clipboard API error:", err);
        // Modern API başarısız olursa yedek yöntemi dene
        fallbackCopyToClipboard(text, showNotification);
      });
  } else {
    // Clipboard API desteklenmiyorsa yedek yöntemi kullan
    fallbackCopyToClipboard(text, showNotification);
  }
}

// Eski tarayıcılar ve mobil için yedek kopyalama metodu
function fallbackCopyToClipboard(text: string, callback: (success: boolean) => void) {
  try {
    // Geçici textarea elementi oluştur
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Mobil ve masaüstünde çalışması için stil ayarları
    textArea.style.position = 'fixed';
    textArea.style.left = '0';
    textArea.style.top = '0';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    textArea.style.zIndex = '-1';
    
    document.body.appendChild(textArea);
    
    // Metin alanını seç ve kopyala
    textArea.focus();
    textArea.select();
    
    // Kopyalama komutu çalıştır
    const successful = document.execCommand('copy');
    
    // Geçici elementi temizle
    document.body.removeChild(textArea);
    
    // Sonucu bildir
    callback(successful);
  } catch (err) {
    console.error("Copying text failed:", err);
    callback(false);
  }
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
  
  // Geliştirilmiş kopyalama fonksiyonu - kolay çağrı için
  const handleCopyToClipboard = (text: string) => {
    // Mobil cihazlarda gereksiz işlemler yapmayalım
    // JSON içeriği büyükse, bunu stringe çevirmek gecikmeye neden olur
    // Bu işlemi önceden yapıp saklayarak performansı artırabiliriz
    copyToClipboard(text);
  };

  return (
    <div className="container min-h-screen">
      <div className="header-container">
        <h1 className="editor-title">JSON Tools</h1>
        <h2 className="editor-subtitle">JSON Path Analyzer & Remover</h2>
        <a href="https://github.com/emredav/JsonEditor" target="_blank" rel="noopener noreferrer" className="github-link">
          <svg className="github-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      </div>

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
                    onClick={() => handleCopyToClipboard(JSON.stringify(generatedSchema, null, 2))}
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
                    onClick={() => handleCopyToClipboard(JSON.stringify(modifiedJson, null, 2))}
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