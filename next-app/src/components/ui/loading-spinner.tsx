import React, { useState, useEffect } from "react";

export default function LoadingSpinner() {
  const LOADING_WORDS = ["Loading", "Generating", "Creating", "Thinking"];
  const [loadingText, setLoadingText] = useState(LOADING_WORDS[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * LOADING_WORDS.length);
      setLoadingText(LOADING_WORDS[randomIndex]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col justify-center items-center space-y-2">
      <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-lg font-medium">{loadingText}...</p>
    </div>
  );
}
