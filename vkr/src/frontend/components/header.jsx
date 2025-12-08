// Header.jsx
import React, { useEffect, useState } from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import '../styles/header.css';
import logo from '../assets/logo.png';
import avatar from '../assets/avatar.png';

const Header = () => {
    const [currentDate, setCurrentDate] = useState('');
    
    useEffect(() => {
        updateCurrentDate();
    }, []);
    
    const updateCurrentDate = () => {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const dateString = now.toLocaleDateString('ru-RU', options);
        setCurrentDate(dateString);
    };

    return (
        <header className="admin-header">
            <div className="header-left">
                <img 
                    src={logo}
                    alt="Логотип школы" 
                    className="logo-image"
                />
                <div className="school-info">
                    <div className="school-name">
                      МАОУ МО Динской район СОШ № 20 имени Жукова В.А.
                    </div>
                    <div className="school-location">
                        П.Агроном
                    </div>
                </div>
            </div>
            
            <div className="header-center">
                
            {/* <div className="current-date">
                 <FaCalendarAlt className="date-icon" />
                  <span>{currentDate}</span>
                </div> */}
            </div>
            
            <div className="header-right">
                <div className="admin-section">
                   
                    <img 
                        src={avatar}
                        alt="Аватар администратора" 
                        className="admin-avatar"
                    />
                </div>
            </div>
        </header>
    );
};

export default Header;