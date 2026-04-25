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
  FaMoon,
  FaBook,
  FaChalkboardTeacher,
  FaUserTag
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

  // Получаем актуальные данные пользователя из localStorage
  const getUserData = () => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return userData;
      }
    }
    return userData;
  };

  const currentUser = getUserData();

  const getRoleIcon = () => {
    const icons = {
      superadmin: <FaStar />,
      admin: <FaUsers />,
      teacher: <FaGraduationCap />,
      class: <FaSchool />
    };
    return icons[currentUser?.role] || <FaUser />;
  };

  const getRoleTitle = () => {
    const titles = {
      superadmin: 'Суперадминистратор',
      admin: 'Администратор',
      teacher: 'Учитель',
      class: 'Классный руководитель'
    };
    return titles[currentUser?.role] || 'Пользователь';
  };

  // Получаем отображаемое имя пользователя (ПОЛНОЕ)
  const getUserDisplayName = () => {
    if (currentUser?.role === 'class') {
      // Для класса: "1П класс"
      if (currentUser.gradeNumber && currentUser.gradeLetter) {
        return `${currentUser.gradeNumber}${currentUser.gradeLetter} класс`;
      }
      if (currentUser.name) {
        return currentUser.name;
      }
      return currentUser.login || 'Класс';
    }
    
    // Для учителя: полное ФИО "Иванов Иван Иванович"
    if (currentUser?.role === 'teacher') {
      if (currentUser.lastName && currentUser.firstName) {
        const middle = currentUser.middleName ? ` ${currentUser.middleName}` : '';
        return `${currentUser.lastName} ${currentUser.firstName}${middle}`;
      }
      return currentUser.name || currentUser.login || 'Учитель';
    }
    
    // Для админа: полное имя
    if (currentUser?.role === 'admin') {
      if (currentUser.lastName && currentUser.firstName) {
        const middle = currentUser.middleName ? ` ${currentUser.middleName}` : '';
        return `${currentUser.lastName} ${currentUser.firstName}${middle}`;
      }
      return currentUser.name || currentUser.login || 'Администратор';
    }
    
    // Для суперадмина
    if (currentUser?.role === 'superadmin') {
      return 'Суперадминистратор';
    }
    
    return currentUser?.name || currentUser?.login || 'Пользователь';
  };

  // Получаем краткое имя для дополнительной информации
  const getShortName = () => {
    if (currentUser?.role === 'teacher') {
      if (currentUser.lastName && currentUser.firstName) {
        const firstNameInitial = currentUser.firstName.charAt(0);
        const middleNameInitial = currentUser.middleName ? currentUser.middleName.charAt(0) : '';
        return `${currentUser.lastName} ${firstNameInitial}.${middleNameInitial ? middleNameInitial + '.' : ''}`;
      }
    }
    if (currentUser?.role === 'admin' && currentUser.lastName && currentUser.firstName) {
      const firstNameInitial = currentUser.firstName.charAt(0);
      return `${currentUser.lastName} ${firstNameInitial}.`;
    }
    return null;
  };

  // Получаем дополнительную информацию
  const getAdditionalInfo = () => {
    const info = [];
    
    if (currentUser?.role === 'class') {
      if (currentUser.gradeNumber && currentUser.gradeLetter) {
        info.push({ label: 'Номер класса', value: currentUser.gradeNumber, icon: <FaBook /> });
        info.push({ label: 'Буква класса', value: currentUser.gradeLetter, icon: <FaChalkboardTeacher /> });
      }
    }
    
    if (currentUser?.role === 'teacher') {
      if (currentUser.subjects && currentUser.subjects.length > 0) {
        info.push({ label: 'Преподаваемые предметы', value: currentUser.subjects.join(', '), icon: <FaGraduationCap /> });
      }
    }
    
    return info;
  };

  // Выход из системы
  const handleLogout = () => {
    // Очищаем все данные из localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    localStorage.removeItem('theme');
    
    // Закрываем модальное окно
    if (onClose) {
      onClose();
    }
    
    // Вызываем колбэк если есть
    if (onLogout) {
      onLogout();
    }
    
    // Перенаправляем на страницу входа
    window.location.href = '/login';
  };

  const additionalInfo = getAdditionalInfo();
  const shortName = getShortName();

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
            <div className="user-name">{getUserDisplayName()}</div>
            <div className="user-role">
              {getRoleIcon()} {getRoleTitle()}
            </div>
            {shortName && (
              <div className="user-shortname">
                <FaUserTag /> {shortName}
              </div>
            )}
          </div>

          {/* Дополнительная информация для класса или учителя */}
          {additionalInfo.length > 0 && (
            <div className="additional-info-card">
              {additionalInfo.map((info, index) => (
                <div className="info-detail" key={index}>
                  <div className="info-icon">{info.icon}</div>
                  <div className="info-text">
                    <span className="info-label">{info.label}:</span>
                    <span className="info-value">{info.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="details-list">
            <div className="detail-row">
              <div className="detail-icon">
                <FaEnvelope />
              </div>
              <div className="detail-info">
                <div className="detail-label">Логин</div>
                <div className="detail-value">{currentUser?.login || 'не указан'}</div>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-icon">
                <FaPhone />
              </div>
              <div className="detail-info">
                <div className="detail-label">Роль</div>
                <div className="detail-value">{getRoleTitle()}</div>
              </div>
            </div>
            {currentUser?.email && (
              <div className="detail-row">
                <div className="detail-icon">
                  <FaEnvelope />
                </div>
                <div className="detail-info">
                  <div className="detail-label">Email</div>
                  <div className="detail-value">{currentUser.email}</div>
                </div>
              </div>
            )}
            {currentUser?.phone && (
              <div className="detail-row">
                <div className="detail-icon">
                  <FaPhone />
                </div>
                <div className="detail-info">
                  <div className="detail-label">Телефон</div>
                  <div className="detail-value">{currentUser.phone}</div>
                </div>
              </div>
            )}
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Выйти из системы
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