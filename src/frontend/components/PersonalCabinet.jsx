// src/frontend/components/PersonalCabinet.jsx
import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaKey, FaSave, FaTimes, FaPhone, FaSchool, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import '../styles/PersonalCabinet.css';

const PersonalCabinet = ({ userData, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очистка ошибки при изменении
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (isEditing && formData.newPassword) {
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Пароль должен быть не менее 6 символов';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Пароли не совпадают';
      }
    }
    
    if (formData.phone && !/^[\d\s\-+()]+$/.test(formData.phone)) {
      newErrors.phone = 'Неверный формат телефона';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const dataToSave = {
      ...formData,
      // Не отправляем пароли в открытом виде в реальном приложении
      id: userData.id
    };
    
    onSave(dataToSave);
    setIsEditing(false);
    
    // Очищаем поля паролей после сохранения
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  const getRoleInfo = () => {
    switch(userData.role) {
      case 'superadmin':
        return {
          title: 'Суперадминистратор',
          description: 'Полный доступ ко всем функциям системы',
          color: '#21435A'
        };
      case 'admin':
        return {
          title: 'Администратор',
          description: 'Управление расписанием и занятиями',
          color: '#2E5A87'
        };
      case 'teacher':
        return {
          title: 'Учитель',
          description: 'Просмотр расписания и классов',
          color: '#4A6FA5'
        };
      case 'class':
        return {
          title: 'Классный руководитель',
          description: 'Просмотр расписания класса',
          color: '#6B8CBC'
        };
      default:
        return {
          title: 'Пользователь',
          description: 'Базовый доступ',
          color: '#8A9CB2'
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="personal-cabinet-modal">
      <div className="personal-cabinet-content" onClick={(e) => e.stopPropagation()}>
        {/* Заголовок */}
        <div className="cabinet-header">
          <div className="cabinet-title">
            <FaUser className="cabinet-icon" />
            <h2>Личный кабинет</h2>
          </div>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="cabinet-body">
          {/* Информация о пользователе */}
          <div className="user-info-section">
            <div className="user-avatar-large">
              <img 
                src={userData.avatar || '/default-avatar.png'} 
                alt="Аватар" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-avatar.png';
                }}
              />
            </div>
            
            <div className="user-main-info">
              <div className="user-name">{userData.name || 'Не указано'}</div>
              <div className="user-role" style={{ color: roleInfo.color }}>
                <span className="role-badge">{roleInfo.title}</span>
              </div>
              <div className="user-description">{roleInfo.description}</div>
            </div>
          </div>

          {/* Ролевая информация */}
          <div className="role-stats">
            {userData.role === 'teacher' && (
              <>
                <div className="role-stat">
                  <FaUsers />
                  <span>Классы: {userData.classes || 3}</span>
                </div>
                <div className="role-stat">
                  <FaSchool />
                  <span>Предметы: {userData.subjects || 'Математика, Физика'}</span>
                </div>
              </>
            )}
            {userData.role === 'admin' && (
              <div className="role-stat">
                <FaCalendarAlt />
                <span>Управление расписанием</span>
              </div>
            )}
            {userData.role === 'superadmin' && (
              <div className="role-stat">
                <FaUsers />
                <span>Управление пользователями</span>
              </div>
            )}
          </div>

          {/* Форма редактирования */}
          <form onSubmit={handleSubmit} className="cabinet-form">
            <div className="form-section">
              <h3 className="section-title">Основная информация</h3>
              
              <div className="form-group">
                <label className="form-label">
                  <FaUser /> ФИО
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FaEnvelope /> Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FaPhone /> Телефон
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="form-input"
                  placeholder="+7 (___) ___-__-__"
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>
            </div>

            {isEditing && (
              <div className="form-section">
                <h3 className="section-title">Смена пароля</h3>
                
                <div className="form-group">
                  <label className="form-label">
                    <FaKey /> Текущий пароль
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FaKey /> Новый пароль
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="form-input"
                  />
                  {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FaKey /> Подтвердите пароль
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-input"
                  />
                  {errors.confirmPassword && (
                    <span className="error-message">{errors.confirmPassword}</span>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Футер с кнопками */}
        <div className="cabinet-footer">
          {!isEditing ? (
            <>
              <button 
                className="btn-secondary" 
                onClick={() => setIsEditing(true)}
              >
                Редактировать
              </button>
              <button className="btn-secondary" onClick={onClose}>
                Закрыть
              </button>
            </>
          ) : (
            <>
              <button 
                type="submit" 
                className="btn-primary"
                onClick={handleSubmit}
              >
                <FaSave /> Сохранить
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setIsEditing(false);
                  setErrors({});
                  // Восстанавливаем исходные данные
                  setFormData({
                    name: userData.name || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
              >
                Отмена
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalCabinet;