// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
//import Header from './frontend/components/Header';  // ← если App.jsx в src/
//import Footer from '../src/frontend/components/Footer';  // ← если App.jsx в src/
import MainContent from '../src/frontend/pages/MainContent';
import ExcelGenerator from '../src/frontend/pages/ExcelGenerator';
import './App.css';

function App() {
    return (
        <Router>
            <div className="app">
                
                <main className="main-wrapper">
                    <Routes>
                        <Route path="/" element={<MainContent />} />
                        <Route path="/generate" element={<ExcelGenerator />} />
                    </Routes>
                </main>
                
            </div>
        </Router>
    );
}

export default App;