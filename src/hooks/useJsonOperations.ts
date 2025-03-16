import { useState } from 'react';
import { generateSchema, gatherPaths, gatherCounts, removeSelectedPaths } from '../utils/jsonUtils';

export const useJsonOperations = () => {
  const [jsonInput, setJsonInput] = useState<string>("");
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [generatedSchema, setGeneratedSchema] = useState<any>(null);
  const [allPaths, setAllPaths] = useState<string[]>([]);
  const [selectedRemovalPaths, setSelectedRemovalPaths] = useState<string[]>([]);
  const [itemCounts, setItemCounts] = useState<Map<string, number>>(new Map());
  const [modifiedJson, setModifiedJson] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const parseJson = () => {
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
        // Clean paths - fix double dots
        const cleanedPaths = Array.from(pathSet)
          .map(path => path.replace(/\.{2,}/g, '.'))
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
    }, 100);
  };

  const processJsonFromFile = (content: string) => {
    try {
      if (content.trim()) {
        const data = JSON.parse(content);
        setParsedJson(data);
        setModifiedJson(null);
  
        const schema = generateSchema(data);
        setGeneratedSchema(schema);
  
        const pathSet = gatherPaths(data);
        const cleanedPaths = Array.from(pathSet)
          .map(path => path.replace(/\.{2,}/g, '.'))
          .sort();
        setAllPaths(cleanedPaths);
  
        const countsMap = gatherCounts(data);
        setItemCounts(countsMap);
  
        setSelectedRemovalPaths([]);
      }
    } catch (error) {
      alert("Invalid JSON file: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const togglePath = (path: string) => {
    setSelectedRemovalPaths(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path) 
        : [...prev, path]
    );
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

  const clearJsonInput = () => {
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

  return {
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
  };
};
