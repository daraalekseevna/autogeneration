// Header.jsx
import React, { useEffect, useState } from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import PersonalCabinet from './PersonalCabinet';
import '../styles/header.css';
import logo from '../assets/logo.png';
import avatar from '../assets/avatar.png';

const Header = () => {
    const [currentDate, setCurrentDate] = useState('');
    const [showPersonalCabinet, setShowPersonalCabinet] = useState(false);
    const [userData, setUserData] = useState(null);
    
    useEffect(() => {
        updateCurrentDate();
        loadUserData();
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

    const loadUserData = () => {
        // В реальном приложении здесь был бы запрос к API
        // Сейчас используем данные из localStorage или дефолтные
        const savedData = localStorage.getItem('userData');
        if (savedData) {
            setUserData(JSON.parse(savedData));
        } else {
            // Дефолтные данные для примера
            const role = localStorage.getItem('userRole') || 'admin';
            const defaultData = {
                id: 1,
                name: 'Иванов Иван Иванович',
                email: 'admin@school20.ru',
                phone: '+7 (999) 123-45-67',
                role: role,
                avatar: avatar,
                classes: role === 'teacher' ? 3 : null,
                subjects: role === 'teacher' ? 'Математика, Физика' : null
            };
            setUserData(defaultData);
            localStorage.setItem('userData', JSON.stringify(defaultData));
        }
    };

    const handleSaveUserData = (updatedData) => {
        // Обновляем данные пользователя
        const newData = {
            ...userData,
            name: updatedData.name,
            email: updatedData.email,
            phone: updatedData.phone
        };
        
        setUserData(newData);
        localStorage.setItem('userData', JSON.stringify(newData));
        
        // Здесь в реальном приложении был бы запрос к API
        console.log('Данные сохранены:', updatedData);
    };

    const handleAvatarClick = () => {
        setShowPersonalCabinet(true);
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
                
                <div className="header-center">
                    {/* Можно добавить дату при необходимости */}
                    {/* <div className="current-date">
                        <FaCalendarAlt className="date-icon" />
                        <span>{currentDate}</span>
                    </div> */}
                </div>
                
                <div className="header-right">
                    <div className="admin-section">
                        <div 
                            className="admin-avatar-container"
                            onClick={handleAvatarClick}
                            style={{ cursor: 'pointer' }}
                        >
                            <img 
                                src={userData?.avatar || avatar}
                                alt="Аватар администратора" 
                                className="admin-avatar"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = avatar;
                                }}
                            />
                            <div className="avatar-overlay">
                                <FaCalendarAlt />
                            </div>
                        </div>
                        <div className="admin-info">
                            <div className="admin-name">{userData?.name?.split(' ')[0] || 'Админ'}</div>
                            <div className="admin-role">
                                {userData?.role === 'superadmin' && 'Суперадмин'}
                                {userData?.role === 'admin' && 'Администратор'}
                                {userData?.role === 'teacher' && 'Учитель'}
                                {userData?.role === 'class' && 'Классный руководитель'}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {showPersonalCabinet && userData && (
                <PersonalCabinet
                    userData={userData}
                    onClose={() => setShowPersonalCabinet(false)}
                    onSave={handleSaveUserData}
                />
            )}
        </>
    );
};

export default Header;