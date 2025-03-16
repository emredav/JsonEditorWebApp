// Generate a basic JSON schema from any JSON input
export function generateSchema(value: any): any {
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
export function gatherPaths(data: any, currentPath = "", paths = new Set<string>()): Set<string> {
  if (Array.isArray(data)) {
    if (currentPath) {
      paths.add(currentPath);
    }
    
    if (data.length > 0) {
      // Array path'ini ekle
      const arrayPath = currentPath ? `${currentPath}[]` : "[]";
      paths.add(arrayPath);
      
      if (typeof data[0] === "object" && data[0] !== null) {
        for (const key in data[0]) {
          const newPath = `${arrayPath}.${key}`;
          paths.add(newPath);
          
          if (Array.isArray(data[0][key])) {
            paths.add(`${newPath}[]`);
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
      
      if (Array.isArray(data[key])) {
        paths.add(`${newPath}[]`);
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
export function gatherCounts(value: any, currentPath = "", counts = new Map<string, number>()): Map<string, number> {
  if (Array.isArray(value)) {
    if (currentPath) {
      counts.set(currentPath, 1);
      
      const arrayPath = `${currentPath}[]`;
      counts.set(arrayPath, value.length);
    }
    
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const indexPath = currentPath ? `${currentPath}[].${i}` : `[].${i}`;
      
      if (!counts.has(indexPath)) {
        counts.set(indexPath, 1);
      }
      
      if (item !== null && typeof item === "object") {
        gatherCounts(item, indexPath, counts);
      }
    }
  } 
  else if (value !== null && typeof value === "object") {
    if (currentPath) {
      counts.set(currentPath, 1);
    }
    for (const key in value) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      
      if (Array.isArray(value[key])) {
        if (!counts.has(newPath)) {
          counts.set(newPath, 1);
        }
        
        const arrayPath = `${newPath}[]`;
        counts.set(arrayPath, value[key].length);
      } 
      else if (value[key] !== null && typeof value[key] === "object") {
        if (!counts.has(newPath)) {
          counts.set(newPath, 1);
        }
      }
      else {
        if (!counts.has(newPath)) {
          counts.set(newPath, 1);
        }
      }
      
      if (value[key] !== null && typeof value[key] === "object") {
        gatherCounts(value[key], newPath, counts);
      }
    }
  } 
  else {
    if (currentPath && !counts.has(currentPath)) {
      counts.set(currentPath, 1);
    }
  }
  return counts;
}

// Remove selected paths from JSON
export function removeSelectedPaths(data: any, pathsToRemove: string[]): any {
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
  const arrayElementMatch = path.match(/^(.+)\[\]\.(\d+)$/);
  if (arrayElementMatch) {
    const arrayPath = arrayElementMatch[1];
    const index = parseInt(arrayElementMatch[2]);
    
    let parentObj = data;
    const parentPath = arrayPath.split('.');
    
    if (parentPath.length > 1) {
      for (let i = 0; i < parentPath.length - 1; i++) {
        if (parentObj[parentPath[i]] === undefined) return data;
        parentObj = parentObj[parentPath[i]];
      }
    }
    
    const lastKey = parentPath[parentPath.length - 1];
    
    if (parentObj[lastKey] && Array.isArray(parentObj[lastKey])) {
      if (index >= 0 && index < parentObj[lastKey].length) {
        const arrayClone = [...parentObj[lastKey]];
        arrayClone.splice(index, 1);
        
        if (parentObj === data && parentPath.length === 1 && lastKey === "0") {
          return arrayClone;
        }
        
        const parentObjClone = Array.isArray(parentObj) ? [...parentObj] : {...parentObj};
        parentObjClone[lastKey] = arrayClone;
        
        if (parentObj === data) {
          return parentObjClone;
        }
        
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
    return data;
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
    if (isNumericIndex) {
      const index = parseInt(token);
      
      if (index >= 0 && index < data.length) {
        if (tokens.length === 1) {
          return data.filter((_, i) => i !== index);
        } else {
          const result = [...data];
          result[index] = removePathHelper(result[index], tokens.slice(1));
          return result;
        }
      }
      return data;
    }
    
    return data.map(item => removePathHelper(item, tokens));
  } 
  else if (data && typeof data === "object") {
    const copy = { ...data };
    
    if (token in copy) {
      if (isArrayEmptying && Array.isArray(copy[token])) {
        if (tokens.length === 1) {
          copy[token] = [];
          return copy;
        } else {
          const nextToken = tokens[1];
          const isNextNumeric = !isNaN(parseInt(nextToken)) && String(parseInt(nextToken)) === nextToken;
          
          if (isNextNumeric && Array.isArray(copy[token])) {
            const index = parseInt(nextToken);
            copy[token] = copy[token].map((innerArray: any) => {
              if (Array.isArray(innerArray) && index >= 0 && index < innerArray.length) {
                return innerArray.filter((_, i) => i !== index);
              }
              return innerArray;
            });
            
            return removePathHelper(copy, tokens.slice(2));
          } else {
            if (Array.isArray(copy[token])) {
              copy[token] = copy[token].map((item: any) => {
                return removePathHelper(item, tokens.slice(1));
              });
              return copy;
            }
          }
        }
      } else if (tokens.length === 1) {
        delete copy[token];
        return copy;
      } else if (copy[token] !== null && (typeof copy[token] === "object" || Array.isArray(copy[token]))) {
        copy[token] = removePathHelper(copy[token], tokens.slice(1));
      }
    }
    return copy;
  }
  return data;
}
