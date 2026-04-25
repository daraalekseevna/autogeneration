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
        // Получаем данные из localStorage (от бэкенда)
        let userFromBackend = localStorage.getItem('user');
        
        if (userFromBackend) {
            try {
                const parsedUser = JSON.parse(userFromBackend);
                console.log('Header - user from backend:', parsedUser);
                
                // Формируем отображаемые имена
                let displayName = '';      // Для шапки (Фамилия + инициалы или номер+буква)
                let fullName = '';         // Для ЛК (полное ФИО или класс)
                
                if (parsedUser.role === 'class') {
                    // Для класса: в шапке "1П", в ЛК "1П класс"
                    if (parsedUser.gradeNumber && parsedUser.gradeLetter) {
                        displayName = `${parsedUser.gradeNumber}${parsedUser.gradeLetter}`;
                        fullName = `${parsedUser.gradeNumber}${parsedUser.gradeLetter} класс`;
                    } else if (parsedUser.name) {
                        displayName = parsedUser.name.replace(' класс', '');
                        fullName = parsedUser.name;
                    } else {
                        displayName = parsedUser.login || 'Класс';
                        fullName = parsedUser.login || 'Класс';
                    }
                } 
                else if (parsedUser.role === 'teacher') {
                    // Для учителя: в шапке "Иванов И.И.", в ЛК "Иванов Иван Иванович"
                    if (parsedUser.lastName && parsedUser.firstName) {
                        // Формируем фамилию с инициалами для шапки
                        const firstNameInitial = parsedUser.firstName.charAt(0);
                        const middleNameInitial = parsedUser.middleName ? parsedUser.middleName.charAt(0) : '';
                        displayName = `${parsedUser.lastName} ${firstNameInitial}.${middleNameInitial ? middleNameInitial + '.' : ''}`;
                        
                        // Полное ФИО для ЛК
                        fullName = `${parsedUser.lastName} ${parsedUser.firstName} ${parsedUser.middleName || ''}`.trim();
                    } else if (parsedUser.name) {
                        // Если пришло готовое имя
                        const nameParts = parsedUser.name.split(' ');
                        if (nameParts.length >= 2) {
                            displayName = `${nameParts[0]} ${nameParts[1].charAt(0)}.`;
                            if (nameParts[2]) {
                                displayName += `${nameParts[2].charAt(0)}.`;
                            }
                        } else {
                            displayName = parsedUser.name;
                        }
                        fullName = parsedUser.name;
                    } else {
                        displayName = parsedUser.login || 'Учитель';
                        fullName = parsedUser.login || 'Учитель';
                    }
                }
                else {
                    // Для админов и суперадминов
                    if (parsedUser.name) {
                        const nameParts = parsedUser.name.split(' ');
                        if (nameParts.length >= 2) {
                            displayName = `${nameParts[0]} ${nameParts[1].charAt(0)}.`;
                            if (nameParts[2]) {
                                displayName += `${nameParts[2].charAt(0)}.`;
                            }
                        } else {
                            displayName = parsedUser.name;
                        }
                        fullName = parsedUser.name;
                    } else {
                        displayName = parsedUser.login || 'Пользователь';
                        fullName = parsedUser.login || 'Пользователь';
                    }
                }
                
                const formattedUser = {
                    id: parsedUser.id,
                    name: fullName,           // Полное имя для ЛК
                    shortName: displayName,   // Короткое имя для шапки
                    login: parsedUser.login,
                    email: parsedUser.email || 'не указан',
                    phone: parsedUser.phone || 'не указан',
                    role: parsedUser.role,
                    gradeNumber: parsedUser.gradeNumber,
                    gradeLetter: parsedUser.gradeLetter,
                    // Для учителя
                    lastName: parsedUser.lastName,
                    firstName: parsedUser.firstName,
                    middleName: parsedUser.middleName
                };
                
                setUserData(formattedUser);
                return;
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        
        // Fallback
        const role = localStorage.getItem('userRole') || 'admin';
        const defaultData = {
            id: 1,
            name: 'Администратор',
            shortName: 'Администратор',
            email: 'admin@school20.ru',
            phone: '+7 (999) 123-45-67',
            role: role
        };
        setUserData(defaultData);
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
        
        const mainUser = JSON.parse(localStorage.getItem('user') || '{}');
        mainUser.name = updatedData.name;
        mainUser.email = updatedData.email;
        mainUser.phone = updatedData.phone;
        localStorage.setItem('user', JSON.stringify(mainUser));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userData');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
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

    if (!userData) {
        return (
            <header className="admin-header">
                <div className="header-left">
                    <img src={logo} alt="Логотип школы" className="logo-image" />
                    <div className="school-info">
                        <div className="school-name">
                            МАОУ МО Динской район СОШ № 20 имени Жукова В.А.
                        </div>
                        <div className="school-location">п.Агроном</div>
                    </div>
                </div>
                <div className="header-right">
                    <div className="admin-section">
                        <div className="admin-info">
                            <div className="admin-name">Загрузка...</div>
                            <div className="admin-role"></div>
                        </div>
                        <FaUserCircle className="admin-avatar-icon" />
                    </div>
                </div>
            </header>
        );
    }

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
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="admin-info">
                            <div className="admin-name">{userData.shortName || userData.name}</div>
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
                    onLogout={handleLogout}
                />
            )}
        </>
    );
};

export default Header;