import React, { createContext, useContext, useState } from "react";
import FullScreenLoader from "../loaders/FullScreenLoader";

const ProcessContext = createContext();

export const ProcessProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("Procesando...");
  const [progress, setProgress] = useState(null);

  const startLoading = (message = "Procesando...") => {
    setText(message);
    setProgress(null);
    setLoading(true);
  };

  const stopLoading = () => {
    setLoading(false);
    setProgress(null);
  };

  const updateProgress = (value) => {
    setProgress(value);
  };

  return (
    <ProcessContext.Provider
      value={{ startLoading, stopLoading, updateProgress, loading }}
    >
      {children}
      <FullScreenLoader open={loading} text={text} progress={progress} />
    </ProcessContext.Provider>
  );
};

export const useGlobalLoader = () => useContext(ProcessContext);