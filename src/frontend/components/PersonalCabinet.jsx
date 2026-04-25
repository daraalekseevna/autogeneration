// src/frontend/components/PersonalCabinet.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaTimes,
  FaIdCard,
  FaSignOutAlt,
  FaStar,
  FaUsers,
  FaGraduationCap,
  FaSchool,
  FaSun,
  FaMoon
} from 'react-icons/fa';
import '../styles/PersonalCabinet.css';

const PersonalCabinet = ({ userData, onClose, onLogout }) => {
  // ТЕМНАЯ ТЕМА
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkTheme]);

  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    if (newTheme) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  };

  const getRoleIcon = () => {
    const icons = {
      superadmin: <FaStar />,
      admin: <FaUsers />,
      teacher: <FaGraduationCap />,
      class: <FaSchool />
    };
    return icons[userData?.role] || <FaUser />;
  };

  const getRoleTitle = () => {
    const titles = {
      superadmin: 'Суперадмин',
      admin: 'Администратор',
      teacher: 'Учитель',
      class: 'Кл. руководитель'
    };
    return titles[userData?.role] || 'Пользователь';
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    onClose();
  };

  return (
    <div className={`personal-cabinet-modal ${isDarkTheme ? 'dark-theme' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="personal-cabinet-content">
        <div className="cabinet-header">
          <div className="cabinet-title">
            <FaIdCard className="cabinet-icon" />
            <h2>Личный кабинет</h2>
          </div>
          <div className="cabinet-header-actions">
            <button className="theme-toggle-cabinet" onClick={toggleTheme}>
              {isDarkTheme ? <FaSun /> : <FaMoon />}
            </button>
            <button className="close-button" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="cabinet-body">
          <div className="avatar-section">
            <div className="avatar">
              <FaUser />
            </div>
          </div>

          <div className="info-card">
            <div className="user-name">{userData?.name || 'Пользователь'}</div>
            <div className="user-role">
              {getRoleIcon()} {getRoleTitle()}
            </div>
          </div>

          <div className="details-list">
            <div className="detail-row">
              <div className="detail-icon">
                <FaEnvelope />
              </div>
              <div className="detail-info">
                <div className="detail-label">Email</div>
                <div className="detail-value">{userData?.email || 'не указан'}</div>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-icon">
                <FaPhone />
              </div>
              <div className="detail-info">
                <div className="detail-label">Телефон</div>
                <div className="detail-value">{userData?.phone || 'не указан'}</div>
              </div>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Выйти
          </button>
        </div>

        <div className="cabinet-footer">
          <button className="close-btn" onClick={onClose}>
            <FaTimes /> Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalCabinet;