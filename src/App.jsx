// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainContent from '../src/frontend/pages/MainContent';
import ExcelGenerator from '../src/frontend/pages/ExcelGenerator';
import ScheduleViewer from '../src/frontend/pages/ScheduleViewer'; // Добавляем новый компонент
import './App.css';

function App() {
    return (
        <Router>
            <div className="app">
                <main className="main-wrapper">
                    <Routes>
                        <Route path="/" element={<MainContent />} />
                        <Route path="/generate" element={<ExcelGenerator />} />
                        <Route path="/schedule" element={<ScheduleViewer />} /> {/* Новый маршрут */}
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;