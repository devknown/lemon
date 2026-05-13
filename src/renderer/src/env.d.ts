/// <reference types="vite/client" />

interface Window {
  api: {
    lte: any; // Using any for brevity as existing types are complex
    window: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    };
  };
}
