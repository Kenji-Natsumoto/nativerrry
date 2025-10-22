import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Dashboard from '@/components/Dashboard';
import ProjectDetail from '@/components/ProjectDetail';

function App() {
  return (
    <div className="App min-h-screen bg-gray-50">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/project/:projectId" element={<ProjectDetail />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;