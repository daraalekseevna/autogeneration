import React from 'react';
import Header from '../src/frontend/components/header';
import MainContent from './frontend/pages/MainContent';
import Footer from '../src/frontend/components/Footer';
import './App.css';

function App() {
    return (
        <div className="app">
            <Header />
            <MainContent />
            <Footer />
        </div>
    );
}

export default App;