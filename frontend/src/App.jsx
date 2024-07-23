// src/App.jsx
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Lobby from './pages/Lobby';
import CodeBlock from './pages/CodeBlock';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/codeblock/:id" element={<CodeBlock />} />
    </Routes>
  );
};

export default App;
