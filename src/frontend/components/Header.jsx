// src/frontend/components/Header.jsx
import React, { useEffect, useState } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import PersonalCabinet from './PersonalCabinet';
import '../styles/header.css';
import logo from '../assets/logo.png';

const Header = () => {
    const [showPersonalCabinet, setShowPersonalCabinet] = useState(false);
    const [userData, setUserData] = useState(null);
    
    useEffect(() => {
        loadUserData();
    }, []);
    
    const loadUserData = () => {
        const savedData = localStorage.getItem('userData');
        if (savedData) {
            setUserData(JSON.parse(savedData));
        } else {
            const role = localStorage.getItem('userRole') || 'admin';
            const defaultData = {
                id: 1,
                name: 'Иванов Иван Иванович',
                email: 'admin@school20.ru',
                phone: '+7 (999) 123-45-67',
                role: role
            };
            setUserData(defaultData);
            localStorage.setItem('userData', JSON.stringify(defaultData));
        }
    };

    const handleSaveUserData = (updatedData) => {
        const newData = {
            ...userData,
            name: updatedData.name,
            email: updatedData.email,
            phone: updatedData.phone
        };
        
        setUserData(newData);
        localStorage.setItem('userData', JSON.stringify(newData));
    };

    const handleLogout = () => {
        localStorage.removeItem('userData');
        localStorage.removeItem('userRole');
        window.location.reload();
    };

    const handleAvatarClick = () => {
        setShowPersonalCabinet(true);
    };

    const getRoleDisplay = () => {
        const roles = {
            superadmin: 'Суперадмин',
            admin: 'Администратор',
            teacher: 'Учитель',
            class: 'Кл. руководитель'
        };
        return roles[userData?.role] || 'Пользователь';
    };

    const getLastName = () => {
        if (!userData?.name) return 'Администратор';
        const nameParts = userData.name.split(' ');
        return nameParts[0] || 'Администратор';
    };

    return (
        <>
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
                            п.Агроном
                        </div>
                    </div>
                </div>
                
                <div className="header-right">
                    <div 
                        className="admin-section"
                        onClick={handleAvatarClick}
                    >
                        <div className="admin-info">
                            <div className="admin-name">{getLastName()}</div>
                            <div className="admin-role">{getRoleDisplay()}</div>
                        </div>
                        <FaUserCircle className="admin-avatar-icon" />
                    </div>
                </div>
            </header>

            {showPersonalCabinet && userData && (
                <PersonalCabinet
                    userData={userData}
                    onClose={() => setShowPersonalCabinet(false)}
                    onSave={handleSaveUserData}
                    onLogout={handleLogout}
                />
            )}
        </>
    );
};

export default Header;