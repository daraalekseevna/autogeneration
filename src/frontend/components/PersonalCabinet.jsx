// src/frontend/components/PersonalCabinet.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FaUser, 
  FaEnvelope, 
  FaKey, 
  FaSave, 
  FaTimes, 
  FaPhone, 
  FaSchool, 
  FaUsers, 
  FaCalendarAlt,
  FaIdCard,
  FaGraduationCap,
  FaChartLine,
  FaStar,
  FaCheckCircle,
  FaEdit,
  FaCamera,
  FaLock
} from 'react-icons/fa';
import '../styles/PersonalCabinet.css';

// Константы для ролей
const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  TEACHER: 'teacher',
  CLASS: 'class'
};

const PersonalCabinet = ({ userData, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: null
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Инициализация данных
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        avatar: userData.avatar || null
      });
      setAvatarPreview(userData.avatar || null);
    }
  }, [userData]);

  // Авто-скрытие уведомления
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  // Получение информации о роли
  const getRoleInfo = useCallback(() => {
    const roleMap = {
      [ROLES.SUPERADMIN]: {
        title: 'Суперадминистратор',
        description: 'Полный доступ ко всем функциям системы',
        icon: <FaStar />,
        color: '#f59e0b'
      },
      [ROLES.ADMIN]: {
        title: 'Администратор',
        description: 'Управление расписанием и занятиями',
        icon: <FaUsers />,
        color: '#21435A'
      },
      [ROLES.TEACHER]: {
        title: 'Учитель',
        description: 'Просмотр расписания и управление оценками',
        icon: <FaGraduationCap />,
        color: '#10b981'
      },
      [ROLES.CLASS]: {
        title: 'Классный руководитель',
        description: 'Управление классом и расписанием',
        icon: <FaSchool />,
        color: '#8b5cf6'
      }
    };
    return roleMap[userData?.role] || {
      title: 'Пользователь',
      description: 'Базовый доступ',
      icon: <FaUser />,
      color: '#6c757d'
    };
  }, [userData?.role]);

  // Получение ролевой статистики
  const getRoleStats = useCallback(() => {
    const statsMap = {
      [ROLES.TEACHER]: [
        { icon: <FaUsers />, label: 'Классов', value: userData?.classes || 3 },
        { icon: <FaSchool />, label: 'Предметов', value: userData?.subjects || 4 },
        { icon: <FaChartLine />, label: 'Учеников', value: userData?.studentsCount || 87 }
      ],
      [ROLES.ADMIN]: [
        { icon: <FaCalendarAlt />, label: 'Активных занятий', value: userData?.activeActivities || 12 },
        { icon: <FaUsers />, label: 'Пользователей', value: userData?.usersCount || 156 }
      ],
      [ROLES.SUPERADMIN]: [
        { icon: <FaUsers />, label: 'Администраторов', value: userData?.adminsCount || 5 },
        { icon: <FaChartLine />, label: 'Всего занятий', value: userData?.totalActivities || 24 }
      ]
    };
    return statsMap[userData?.role] || [];
  }, [userData]);

  // Валидация формы
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (isEditing) {
      if (!formData.name?.trim()) {
        newErrors.name = 'Введите ФИО';
      }
      if (!formData.email?.trim()) {
        newErrors.email = 'Введите email';
      } else if (!/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Неверный формат email';
      }
      if (formData.phone && !/^[\d\s\-+()]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Неверный формат телефона';
      }
    }
    
    if (isChangingPassword) {
      if (!passwords.currentPassword) {
        newErrors.currentPassword = 'Введите текущий пароль';
      }
      if (passwords.newPassword && passwords.newPassword.length < 6) {
        newErrors.newPassword = 'Пароль должен быть не менее 6 символов';
      }
      if (passwords.newPassword !== passwords.confirmPassword) {
        newErrors.confirmPassword = 'Пароли не совпадают';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, passwords, isEditing, isChangingPassword]);

  // Обработчик изменения полей
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Обработчик изменения паролей
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Обработчик выбора аватарки
  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setFormData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setErrors(prev => ({ ...prev, avatar: 'Можно загрузить только JPG или PNG' }));
    }
  };

  // Сохранение данных
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const dataToSave = {
        ...formData,
        id: userData.id,
        role: userData.role,
        ...(isChangingPassword && passwords.newPassword && {
          newPassword: passwords.newPassword,
          currentPassword: passwords.currentPassword
        })
      };
      
      await onSave(dataToSave);
      setIsEditing(false);
      setIsChangingPassword(false);
      setSaveSuccess(true);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setErrors({ submit: error.message || 'Ошибка при сохранении' });
    } finally {
      setIsLoading(false);
    }
  };

  // Отмена редактирования
  const handleCancel = () => {
    setIsEditing(false);
    setIsChangingPassword(false);
    setErrors({});
    setFormData({
      name: userData.name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      avatar: userData.avatar || null
    });
    setAvatarPreview(userData.avatar || null);
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const roleInfo = getRoleInfo();
  const roleStats = getRoleStats();

  // Закрытие по клику на оверлей
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="personal-cabinet-modal" onClick={handleOverlayClick}>
      <div className="personal-cabinet-content">
        <div className="cabinet-header">
          <div className="cabinet-title">
            <FaIdCard className="cabinet-icon" />
            <h2>Личный кабинет</h2>
          </div>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="cabinet-body">
          {/* Аватар */}
          <div className="user-avatar-section">
            <div className="avatar-container" onClick={handleAvatarClick}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Аватар" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  <FaUser />
                </div>
              )}
              {isEditing && (
                <div className="avatar-overlay">
                  <FaCamera />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Информация о пользователе */}
          <div className="user-info">
            <div className="user-name">{formData.name || 'Не указано'}</div>
            <div className="role-badge">
              {roleInfo.icon} {roleInfo.title}
            </div>
            <div className="user-description">{roleInfo.description}</div>
          </div>

          {/* Статистика */}
          {roleStats.length > 0 && (
            <div className="role-stats">
              {roleStats.map((stat, index) => (
                <div key={index} className="role-stat">
                  {stat.icon} {stat.label}: {stat.value}
                </div>
              ))}
            </div>
          )}

          {/* Уведомление об успехе */}
          {saveSuccess && (
            <div className="success-toast">
              <FaCheckCircle /> Данные успешно сохранены
            </div>
          )}

          {/* Форма */}
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
                  placeholder="Введите ваше полное имя"
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
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
                  placeholder="example@mail.com"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
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

            {/* Смена пароля */}
            {(isEditing || isChangingPassword) && (
              <div className="form-section">
                <h3 className="section-title">
                  {isChangingPassword ? 'Смена пароля' : 'Изменить пароль'}
                </h3>
                
                {!isChangingPassword && isEditing && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsChangingPassword(true)}
                    style={{ marginBottom: '12px', width: 'auto' }}
                  >
                    <FaLock /> Сменить пароль
                  </button>
                )}
                
                {isChangingPassword && (
                  <>
                    <div className="form-group">
                      <label className="form-label">
                        <FaKey /> Текущий пароль
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwords.currentPassword}
                        onChange={handlePasswordChange}
                        className="form-input"
                        placeholder="Введите текущий пароль"
                      />
                      {errors.currentPassword && <span className="error-message">{errors.currentPassword}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        <FaKey /> Новый пароль
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwords.newPassword}
                        onChange={handlePasswordChange}
                        className="form-input"
                        placeholder="Введите новый пароль"
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
                        value={passwords.confirmPassword}
                        onChange={handlePasswordChange}
                        className="form-input"
                        placeholder="Повторите новый пароль"
                      />
                      {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    </div>
                  </>
                )}
              </div>
            )}

            {errors.submit && (
              <div className="error-message" style={{ marginTop: '12px' }}>
                {errors.submit}
              </div>
            )}
          </form>
        </div>

        <div className="cabinet-footer">
          {!isEditing ? (
            <>
              <button className="btn-primary" onClick={() => setIsEditing(true)}>
                <FaEdit /> Редактировать
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
                disabled={isLoading}
              >
                <FaSave /> {isLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button className="btn-secondary" onClick={handleCancel}>
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