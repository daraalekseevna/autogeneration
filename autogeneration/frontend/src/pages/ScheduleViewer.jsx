// ScheduleViewer.jsx - полная версия с поддержкой приоритетных кабинетов и быстрым drag-and-drop
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  FaEdit, FaTrash, FaPlus, FaSearch, FaFileExcel, FaPrint, FaGripVertical, FaTimes,
  FaArrowLeft, FaClock, FaUserGraduate, FaMapMarkerAlt, FaCopy,
  FaExclamationTriangle, FaCheckCircle, FaBell, FaHandPaper,
  FaGraduationCap, FaChalkboardTeacher, FaDoorOpen, FaChevronDown,
  FaChevronUp, FaInfoCircle, FaRegBell, FaRegBellSlash, FaExchangeAlt,
  FaSchool, FaBuilding, FaSpinner
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import BackButton from '../components/BackButton';
import '../styles/global-theme.css';
import '../styles/ScheduleViewer.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Константы
const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const FULL_DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

// Расписание для 1 смены
const FIRST_SHIFT_SCHEDULE = [
  { number: 1, start: '08:00', end: '08:40' },
  { number: 2, start: '08:50', end: '09:30' },
  { number: 3, start: '09:50', end: '10:30' },
  { number: 4, start: '10:50', end: '11:30' },
  { number: 5, start: '11:50', end: '12:30' },
  { number: 6, start: '12:50', end: '13:30' },
  { number: 7, start: '13:40', end: '14:20' }
];

// Расписание для 2 смены
const SECOND_SHIFT_SCHEDULE = [
  { number: 1, start: '14:00', end: '14:40' },
  { number: 2, start: '14:50', end: '15:30' },
  { number: 3, start: '15:50', end: '16:30' },
  { number: 4, start: '16:40', end: '17:20' },
  { number: 5, start: '17:30', end: '18:10' },
  { number: 6, start: '18:20', end: '19:00' }
];

// Функция для получения цвета урока
const getSubjectColor = (lesson) => {
    if (!lesson) return '#9E9E9E';
    if (lesson?.color) return lesson.color;
    if (lesson?.subjectColor) return lesson.subjectColor;
    if (lesson?.subject) {
        let hash = 0;
        for (let i = 0; i < lesson.subject.length; i++) {
            hash = lesson.subject.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 70%, 60%)`;
    }
    return '#9E9E9E';
};

// Функция проверки конфликтов
const checkConflicts = (schedules, newLesson, targetClass, targetDay, targetLessonNumber) => {
  const conflicts = [];

  if (!newLesson?.subject || !newLesson?.teacher || !newLesson?.room) return conflicts;

  for (const className of Object.keys(schedules)) {
    if (className === targetClass) continue;
    
    const lesson = schedules[className]?.[targetDay]?.[targetLessonNumber];
    if (lesson) {
      if (lesson.room === newLesson.room && newLesson.room) {
        conflicts.push({
          type: 'room',
          message: `Кабинет ${newLesson.room} уже занят у ${className} класса`,
          className,
          day: FULL_DAYS[DAYS.indexOf(targetDay)],
          lessonNumber: targetLessonNumber,
          severity: 'error',
          conflictingLesson: lesson,
          conflictValue: newLesson.room
        });
      }
      if (lesson.teacher === newLesson.teacher) {
        conflicts.push({
          type: 'teacher',
          message: `Преподаватель ${newLesson.teacher} уже ведет урок у ${className} класса`,
          className,
          day: FULL_DAYS[DAYS.indexOf(targetDay)],
          lessonNumber: targetLessonNumber,
          severity: 'error',
          conflictingLesson: lesson,
          conflictValue: newLesson.teacher
        });
      }
    }
  }

  return conflicts;
};

// Компонент уведомления
const ToastNotification = ({ message, type, onClose, conflict, onFix }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch(type) {
      case 'success': return <FaCheckCircle />;
      case 'error': return <FaExclamationTriangle />;
      case 'warning': return <FaExclamationTriangle />;
      default: return <FaBell />;
    }
  };

  const getTitle = () => {
    switch(type) {
      case 'success': return 'Успешно';
      case 'error': return 'Конфликт';
      case 'warning': return 'Предупреждение';
      default: return 'Информация';
    }
  };

  return (
    <div className={`toast-notification ${type}`}>
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-content">
        <div className="toast-title">{getTitle()}</div>
        <div className="toast-message">{message}</div>
        {conflict && (
          <div className="toast-conflict-details">
            <div className="toast-conflict-type">
              {conflict.type === 'room' ? <FaDoorOpen /> : <FaUserGraduate />}
              <span>{conflict.type === 'room' ? 'Кабинет' : 'Учитель'}: {conflict.conflictValue}</span>
            </div>
            <div className="toast-conflict-location">
              <FaSchool /> {conflict.className}, {conflict.day}, {conflict.lessonNumber} урок
            </div>
          </div>
        )}
      </div>
      {onFix && (
        <button className="toast-action-btn" onClick={onFix}>
          <FaExchangeAlt /> Исправить
        </button>
      )}
      <button className="toast-close" onClick={onClose}>
        <FaTimes />
      </button>
    </div>
  );
};

// Компонент колокольчика с уведомлениями
const NotificationBell = ({ conflicts, onOpenPanel, onFixConflict }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showBadge, setShowBadge] = useState(conflicts.length > 0);
  
  useEffect(() => {
    setShowBadge(conflicts.length > 0);
  }, [conflicts.length]);

  const handleClick = () => {
    setIsOpen(!isOpen);
    onOpenPanel();
  };

  return (
    <div className="notification-bell-wrapper">
      <button 
        className={`notification-bell ${showBadge ? 'has-notifications' : ''}`}
        onClick={handleClick}
        title="Уведомления о конфликтах"
      >
        <FaBell />
        {showBadge && <span className="notification-badge">{conflicts.length}</span>}
      </button>
      
      {isOpen && conflicts.length > 0 && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <FaExclamationTriangle />
            <span>Конфликты в расписании ({conflicts.length})</span>
          </div>
          <div className="notification-dropdown-list">
            {conflicts.slice(0, 5).map((conflict, idx) => (
              <div key={idx} className="notification-dropdown-item" onClick={() => onFixConflict(conflict)}>
                <div className="notification-dropdown-item-icon">
                  {conflict.type === 'room' ? <FaDoorOpen /> : <FaUserGraduate />}
                </div>
                <div className="notification-dropdown-item-content">
                  <div className="notification-dropdown-item-message">{conflict.message}</div>
                  <div className="notification-dropdown-item-location">
                    {conflict.className}, {conflict.day}, {conflict.lessonNumber} урок
                  </div>
                </div>
                <button className="notification-dropdown-item-fix">
                  <FaExchangeAlt />
                </button>
              </div>
            ))}
            {conflicts.length > 5 && (
              <div className="notification-dropdown-more">
                и еще {conflicts.length - 5} конфликт(ов)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Компонент панели конфликтов
const ConflictsPanel = ({ conflicts, onFixConflict, onNavigateToConflict }) => {
  const [expandedConflict, setExpandedConflict] = useState(null);

  if (conflicts.length === 0) {
    return (
      <div className="conflicts-panel-empty">
        <FaCheckCircle />
        <span>Конфликтов не обнаружено</span>
      </div>
    );
  }

  return (
    <div className="conflicts-panel">
      <div className="conflicts-panel-title">
        <FaExclamationTriangle />
        <span>Конфликты в расписании ({conflicts.length})</span>
      </div>
      <div className="conflicts-list">
        {conflicts.map((conflict, idx) => (
          <div key={idx} className={`conflict-item ${conflict.severity}`}>
            <div className="conflict-item-header">
              <div className="conflict-item-type">
                {conflict.type === 'room' ? <FaDoorOpen /> : <FaUserGraduate />}
                <span className="conflict-item-value">{conflict.conflictValue}</span>
              </div>
              <div className="conflict-item-location">
                <FaSchool /> {conflict.className}, {conflict.day}, {conflict.lessonNumber} урок
              </div>
              <div className="conflict-item-actions">
                <button 
                  className="conflict-item-fix"
                  onClick={() => onFixConflict(conflict)}
                  title="Исправить конфликт"
                >
                  <FaExchangeAlt /> Исправить
                </button>
                <button 
                  className="conflict-item-goto"
                  onClick={() => onNavigateToConflict(conflict)}
                  title="Перейти к уроку"
                >
                  <FaArrowLeft /> Перейти
                </button>
              </div>
            </div>
            <div className="conflict-item-message">{conflict.message}</div>
            {expandedConflict === idx && conflict.conflictingLesson && (
              <div className="conflict-item-details">
                <div className="conflict-details-title">Конфликтующий урок:</div>
                <div className="conflict-details-lesson">
                  <div><FaChalkboardTeacher /> {conflict.conflictingLesson.subject}</div>
                  <div><FaUserGraduate /> {conflict.conflictingLesson.teacher}</div>
                  <div><FaDoorOpen /> {conflict.conflictingLesson.room}</div>
                </div>
              </div>
            )}
            {conflict.conflictingLesson && (
              <button 
                className="conflict-item-expand"
                onClick={() => setExpandedConflict(expandedConflict === idx ? null : idx)}
              >
                {expandedConflict === idx ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const LessonCard = ({ lesson, onDragStart, onDragEnd, onEdit, onDelete, isDraggable, conflicts = [], lessonNumber, className, day, isMoving }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  if (!lesson) return null;
  
  const hasConflicts = conflicts.length > 0;
  
  if (!isDraggable) {
    return (
      <div
        className={`lesson-card view-mode ${hasConflicts ? 'has-conflicts' : ''}`}
        style={{ borderLeftColor: getSubjectColor(lesson) }}
        title={hasConflicts ? conflicts.map(c => c.message).join('\n') : ''}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {hasConflicts && <div className="conflict-indicator"><FaExclamationTriangle /></div>}
        <div className="lesson-subject">{lesson.subject}</div>
        <div className="lesson-teacher">
          <FaUserGraduate /> {lesson.teacher}
        </div>
        <div className="lesson-room">
          <FaDoorOpen /> {lesson.room}
        </div>
      </div>
    );
  }
  
  return (
    <div
      className={`lesson-card edit-mode draggable ${hasConflicts ? 'has-conflicts' : ''} ${isMoving ? 'moving' : ''}`}
      draggable={!isMoving}
      onDragStart={(e) => {
        if (isMoving) {
          e.preventDefault();
          return false;
        }
        const dragData = {
          lesson,
          sourceLessonNumber: lessonNumber,
          sourceClass: className,
          sourceDay: day
        };
        e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        e.dataTransfer.effectAllowed = 'move';
        onDragStart && onDragStart(e, dragData);
      }}
      onDragEnd={onDragEnd}
      style={{ borderLeftColor: getSubjectColor(lesson) }}
      title={hasConflicts ? conflicts.map(c => c.message).join('\n') : ''}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {hasConflicts && <div className="conflict-indicator"><FaExclamationTriangle /></div>}
      <div className="drag-icon"><FaGripVertical /></div>
      <div className="lesson-subject">{lesson.subject}</div>
      <div className="lesson-teacher">
        <FaUserGraduate /> {lesson.teacher}
      </div>
      <div className="lesson-room">
        <FaDoorOpen /> {lesson.room}
      </div>
      {isHovered && (
        <div className="lesson-actions">
          <button className="lesson-action-btn edit" onClick={(e) => { e.stopPropagation(); onEdit(lesson); }}>
            <FaEdit />
          </button>
          <button className="lesson-action-btn delete" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <FaTrash />
          </button>
        </div>
      )}
    </div>
  );
};

// Модальное окно редактирования с поддержкой приоритетных кабинетов
const EditModal = ({ lesson, onSave, onClose, schedules, currentClass, currentDay, currentLessonNumber, showToast }) => {
  const [formData, setFormData] = useState({
    subject: lesson?.subject || '',
    teacher: lesson?.teacher || '',
    room: lesson?.room || ''
  });
  const [conflicts, setConflicts] = useState([]);
  const [showConflicts, setShowConflicts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [recommendedRooms, setRecommendedRooms] = useState([]);
  
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    const loadData = async () => {
      setLoadingRooms(true);
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [roomsRes, lessonsRes, teachersRes] = await Promise.all([
          axios.get(`${API_URL}/schedule/rooms`, config),
          axios.get(`${API_URL}/schedule/lessons`, config),
          axios.get(`${API_URL}/schedule/teachers`, config)
        ]);
        
        const roomsData = Array.isArray(roomsRes.data) ? roomsRes.data : [];
        const lessonsData = Array.isArray(lessonsRes.data) ? lessonsRes.data : [];
        const teachersData = Array.isArray(teachersRes.data) ? teachersRes.data : [];
        
        setRooms(roomsData);
        setLessons(lessonsData);
        setTeachers(teachersData);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoadingRooms(false);
      }
    };
    
    loadData();
  }, [token]);
  
  useEffect(() => {
    if (!rooms.length) return;
    
    const busyRooms = new Set();
    const busyTeachers = new Set();
    
    for (const className of Object.keys(schedules)) {
      const lessonAtTime = schedules[className]?.[currentDay]?.[currentLessonNumber];
      if (lessonAtTime) {
        if (lessonAtTime.room && lessonAtTime.room !== formData.room) {
          busyRooms.add(lessonAtTime.room);
        }
        if (lessonAtTime.teacher && lessonAtTime.teacher !== formData.teacher) {
          busyTeachers.add(lessonAtTime.teacher);
        }
      }
    }
    
    if (formData.subject) {
      const selectedLesson = lessons.find(l => l.name === formData.subject);
      if (selectedLesson) {
        const prioritized = rooms.filter(room => 
          room.lesson_priorities?.some(lp => 
            lp.lesson_id === selectedLesson.id || lp.lesson_name === formData.subject
          )
        );
        setRecommendedRooms(prioritized);
        
        const availablePrioritized = prioritized.filter(r => !busyRooms.has(r.number));
        const availableOther = rooms.filter(r => 
          !busyRooms.has(r.number) && !prioritized.includes(r)
        );
        setAvailableRooms([...availablePrioritized, ...availableOther]);
      } else {
        setAvailableRooms(rooms.filter(r => !busyRooms.has(r.number)));
        setRecommendedRooms([]);
      }
    } else {
      setAvailableRooms(rooms.filter(r => !busyRooms.has(r.number)));
      setRecommendedRooms([]);
    }
    
    setAvailableTeachers(teachers.filter(t => !busyTeachers.has(t.name)));
    
  }, [formData.subject, formData.room, formData.teacher, rooms, teachers, schedules, currentDay, currentLessonNumber, lessons]);
  
  useEffect(() => {
    if (formData.subject && formData.teacher && formData.room) {
      const newConflicts = checkConflicts(
        schedules,
        formData,
        currentClass,
        currentDay,
        currentLessonNumber
      );
      setConflicts(newConflicts);
    } else {
      setConflicts([]);
    }
  }, [formData, schedules, currentClass, currentDay, currentLessonNumber]);
  
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = () => {
    if (!formData.subject || !formData.teacher || !formData.room) {
      showToast('Заполните все поля', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    if (conflicts.length > 0) {
      showToast(`Невозможно сохранить: ${conflicts[0].message}`, 'error');
      setIsSubmitting(false);
      return;
    }
    
    onSave(formData);
    showToast(`Урок "${formData.subject}" ${lesson ? 'изменен' : 'добавлен'}`, 'success');
    setIsSubmitting(false);
    onClose();
  };
  
  const handleQuickFix = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleModalClick = (e) => {
    e.stopPropagation();
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-modal" onClick={handleModalClick}>
        <div className="modal-header">
          <div className="modal-header-icon">
            {lesson ? <FaEdit /> : <FaPlus />}
          </div>
          <h3>{lesson ? 'Редактирование урока' : 'Новый урок'}</h3>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="form-info">
            <div className="info-item">
              <FaGraduationCap /> {currentClass} класс
            </div>
            <div className="info-item">
              <FaClock /> {FULL_DAYS[DAYS.indexOf(currentDay)]}, {currentLessonNumber} урок
            </div>
          </div>
          
          <div className="form-group">
            <label><FaChalkboardTeacher /> Предмет</label>
            <select 
              value={formData.subject} 
              onChange={(e) => handleFieldChange('subject', e.target.value)}
            >
              <option value="">Выберите предмет</option>
              {lessons.map(l => (
                <option key={l.id} value={l.name}>{l.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label><FaUserGraduate /> Учитель</label>
            <select 
              value={formData.teacher} 
              onChange={(e) => handleFieldChange('teacher', e.target.value)}
            >
              <option value="">Выберите учителя</option>
              {availableTeachers.map(teacher => (
                <option key={teacher.id} value={teacher.name}>{teacher.name}</option>
              ))}
            </select>
            {conflicts.some(c => c.type === 'teacher') && availableTeachers.length > 0 && (
              <div className="quick-fix-suggestions">
                <span className="suggestion-label">Свободные учителя:</span>
                <div className="suggestion-buttons">
                  {availableTeachers.slice(0, 3).map(t => (
                    <button key={t.name} className="suggestion-btn" onClick={() => handleQuickFix('teacher', t.name)}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label><FaDoorOpen /> Кабинет</label>
            {loadingRooms ? (
              <div className="loading-spinner-small">
                <FaSpinner className="spinner" /> Загрузка кабинетов...
              </div>
            ) : (
              <select 
                value={formData.room} 
                onChange={(e) => handleFieldChange('room', e.target.value)}
                className={recommendedRooms.length > 0 ? 'has-recommendations' : ''}
              >
                <option value="">Выберите кабинет</option>
                {recommendedRooms.length > 0 && (
                  <optgroup label="⭐ Рекомендуемые (приоритетные)">
                    {recommendedRooms.map(room => (
                      <option key={room.id} value={room.number}>
                        {room.number} {room.name ? `- ${room.name}` : ''} 
                        ({room.lesson_priorities?.map(lp => lp.lesson_name).join(', ')})
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Другие кабинеты">
                  {availableRooms.filter(r => !recommendedRooms.includes(r)).map(room => (
                    <option key={room.id} value={room.number}>
                      {room.number} {room.name ? `- ${room.name}` : ''}
                    </option>
                  ))}
                </optgroup>
              </select>
            )}
            {recommendedRooms.length === 0 && formData.subject && !loadingRooms && rooms.length > 0 && (
              <div className="info-message">
                <FaInfoCircle />
                <span>Для предмета "{formData.subject}" нет приоритетных кабинетов. Вы можете выбрать любой кабинет из списка.</span>
              </div>
            )}
            {recommendedRooms.length === 1 && formData.subject && !loadingRooms && (
              <div className="success-message">
                <FaCheckCircle />
                <span>Для предмета "{formData.subject}" рекомендован кабинет {recommendedRooms[0].number}</span>
              </div>
            )}
          </div>
          
          {conflicts.length > 0 && (
            <div className={`conflicts-preview ${showConflicts ? 'expanded' : ''}`}>
              <div className="conflicts-preview-header" onClick={() => setShowConflicts(!showConflicts)}>
                <FaExclamationTriangle />
                <span>Конфликтов: {conflicts.length}</span>
                <button className="toggle-btn">
                  {showConflicts ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
              {showConflicts && (
                <div className="conflicts-preview-list">
                  {conflicts.map((conflict, idx) => (
                    <div key={idx} className={`conflict-preview-item ${conflict.severity}`}>
                      <div className="conflict-preview-type">
                        {conflict.type === 'room' ? <FaDoorOpen /> : <FaUserGraduate />}
                      </div>
                      <div className="conflict-preview-text">{conflict.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Отмена</button>
          <button 
            className="btn-save" 
            onClick={handleSubmit} 
            disabled={isSubmitting || conflicts.length > 0 || loadingRooms}
          >
            {isSubmitting ? 'Сохранение...' : (lesson ? 'Сохранить' : 'Добавить')}
          </button>
        </div>
      </div>
    </div>
  );
};

const QuickFixModal = ({ conflict, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    subject: conflict?.lesson?.subject || '',
    teacher: conflict?.lesson?.teacher || '',
    room: conflict?.lesson?.room || ''
  });

  const handleFix = () => {
    onSave(formData);
    onClose();
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content quick-fix-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-icon">
            <FaExchangeAlt />
          </div>
          <h3>Исправление конфликта</h3>
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="conflict-description">
            <FaExclamationTriangle className="conflict-icon" />
            <div className="conflict-description-text">
              <div className="conflict-description-message">{conflict?.message}</div>
              <div className="conflict-description-location">
                <FaSchool /> {conflict?.className}, {conflict?.day}, {conflict?.lessonNumber} урок
              </div>
            </div>
          </div>
          
          <div className="form-group">
            <label><FaChalkboardTeacher /> Предмет</label>
            <input type="text" value={formData.subject} disabled />
          </div>
          
          <div className="form-group">
            <label><FaUserGraduate /> Учитель</label>
            <input 
              type="text" 
              value={formData.teacher} 
              onChange={(e) => handleFieldChange('teacher', e.target.value)} 
            />
          </div>
          
          <div className="form-group">
            <label><FaDoorOpen /> Кабинет</label>
            <input 
              type="text" 
              value={formData.room} 
              onChange={(e) => handleFieldChange('room', e.target.value)} 
              placeholder="Например: 201"
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Отмена</button>
          <button className="btn-save" onClick={handleFix}>
            <FaCheckCircle /> Исправить
          </button>
        </div>
      </div>
    </div>
  );
};

const ScheduleViewer = () => {
  const navigate = useNavigate();
  const tableWrapperRef = useRef(null);
  const [isDraggingTable, setIsDraggingTable] = useState(false);
  const [tableDragStart, setTableDragStart] = useState({ x: 0, scrollLeft: 0 });
  const [toasts, setToasts] = useState([]);
  const [showConflictsPanel, setShowConflictsPanel] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [quickFixConflict, setQuickFixConflict] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);
  const [classGroup, setClassGroup] = useState('all');
  const [isEditMode, setIsEditMode] = useState(false);
  const [conflictsMap, setConflictsMap] = useState({});
  const [globalConflicts, setGlobalConflicts] = useState([]);
  
  const [allClasses, setAllClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const showToast = useCallback((message, type = 'info', conflict = null, onFix = null) => {
    if (!notificationsEnabled && type !== 'error') return;
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, conflict, onFix }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, [notificationsEnabled]);

  const loadClassesFromDB = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/schedule/viewer/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let classes = [];
      if (Array.isArray(response.data)) {
        classes = response.data;
      } else if (response.data.rows && Array.isArray(response.data.rows)) {
        classes = response.data.rows;
      } else if (response.data.classes && Array.isArray(response.data.classes)) {
        classes = response.data.classes;
      }
      
      setAllClasses(classes);
      return classes;
    } catch (error) {
      console.error('Error loading classes:', error);
      setAllClasses([]);
      return [];
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  const loadSchedulesFromDB = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/schedule/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedules(response.data.schedules || {});
      return response.data.schedules;
    } catch (error) {
      console.error('Error loading schedules:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await loadClassesFromDB();
      await loadSchedulesFromDB();
      setLoading(false);
    };
    
    loadAllData();
  }, [loadClassesFromDB, loadSchedulesFromDB]);

  useEffect(() => {
    localStorage.setItem('notifications_enabled', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    const newConflictsMap = {};
    const newGlobalConflicts = [];
    
    for (const className of Object.keys(schedules)) {
      for (const day of DAYS) {
        for (let lessonNum = 1; lessonNum <= 7; lessonNum++) {
          const lesson = schedules[className]?.[day]?.[lessonNum];
          if (lesson) {
            const conflicts = checkConflicts(schedules, lesson, className, day, lessonNum);
            if (conflicts.length > 0) {
              const key = `${className}|${day}|${lessonNum}`;
              newConflictsMap[key] = conflicts;
              newGlobalConflicts.push({
                ...conflicts[0],
                className,
                day: FULL_DAYS[DAYS.indexOf(day)],
                dayKey: day,
                lessonNumber: lessonNum,
                lesson
              });
            }
          }
        }
      }
    }
    
    setConflictsMap(newConflictsMap);
    setGlobalConflicts(newGlobalConflicts);
    
    if (isEditMode && newGlobalConflicts.length > 0 && notificationsEnabled) {
      showToast(
        `Обнаружено ${newGlobalConflicts.length} конфликт(ов) в расписании`,
        'warning',
        null,
        () => setShowConflictsPanel(true)
      );
    }
  }, [schedules, isEditMode, notificationsEnabled, showToast]);

  const filteredClasses = useMemo(() => {
    let filtered = [...allClasses];
    
    if (classGroup === '1-4-first') {
      filtered = filtered.filter(c => {
        const number = parseInt(c.number) || parseInt(c.name);
        return number >= 1 && number <= 4 && c.shift === 1;
      });
    } else if (classGroup === '1-4-second') {
      filtered = filtered.filter(c => {
        const number = parseInt(c.number) || parseInt(c.name);
        return number >= 1 && number <= 4 && c.shift === 2;
      });
    } else if (classGroup === '5-11-first') {
      filtered = filtered.filter(c => {
        const number = parseInt(c.number) || parseInt(c.name);
        return number >= 5 && number <= 11 && c.shift === 1;
      });
    } else if (classGroup === 'all') {
      filtered = [...allClasses];
    }
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    filtered.sort((a, b) => {
      const numA = parseInt(a.number) || parseInt(a.name);
      const numB = parseInt(b.number) || parseInt(b.name);
      if (numA !== numB) return numA - numB;
      const letterA = a.letter || a.name?.slice(-1) || '';
      const letterB = b.letter || b.name?.slice(-1) || '';
      return letterA.localeCompare(letterB);
    });
    
    return filtered;
  }, [allClasses, classGroup, searchTerm]);

  const currentSchedule = useMemo(() => {
    if (classGroup === '1-4-second') {
      return SECOND_SHIFT_SCHEDULE;
    }
    return FIRST_SHIFT_SCHEDULE;
  }, [classGroup]);

  const handleTableMouseDown = useCallback((e) => {
    if (e.target.closest('.lesson-card') || e.target.closest('.empty-slot-add')) return;
    if (!tableWrapperRef.current) return;
    
    setIsDraggingTable(true);
    setTableDragStart({
      x: e.pageX - tableWrapperRef.current.offsetLeft,
      scrollLeft: tableWrapperRef.current.scrollLeft,
      startX: e.pageX
    });
    tableWrapperRef.current.style.cursor = 'grabbing';
    tableWrapperRef.current.classList.add('dragging');
  }, []);

  const handleTableMouseMove = useCallback((e) => {
    if (!isDraggingTable || !tableWrapperRef.current) return;
    e.preventDefault();
    
    const x = e.pageX - tableWrapperRef.current.offsetLeft;
    const dx = x - tableDragStart.x;
    const walk = dx * 1.2;
    
    tableWrapperRef.current.scrollLeft = tableDragStart.scrollLeft - walk;
  }, [isDraggingTable, tableDragStart]);

  const handleTableMouseUp = useCallback(() => {
    setIsDraggingTable(false);
    if (tableWrapperRef.current) {
      tableWrapperRef.current.style.cursor = '';
      tableWrapperRef.current.classList.remove('dragging');
    }
  }, []);

  useEffect(() => {
    if (isDraggingTable) {
      window.addEventListener('mousemove', handleTableMouseMove);
      window.addEventListener('mouseup', handleTableMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleTableMouseMove);
        window.removeEventListener('mouseup', handleTableMouseUp);
      };
    }
  }, [isDraggingTable, handleTableMouseMove, handleTableMouseUp]);

  const updateLesson = useCallback(async (className, day, lessonNumber, lesson) => {
    if (!lesson || !lesson.subject || !lesson.teacher || !lesson.room) {
      setSchedules(prev => {
        const newSchedules = JSON.parse(JSON.stringify(prev));
        if (newSchedules[className]?.[day]?.[lessonNumber]) {
          delete newSchedules[className][day][lessonNumber];
        }
        return newSchedules;
      });
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        className: className.trim(),
        dayOfWeek: day.trim(),
        lessonNumber: parseInt(lessonNumber),
        lesson: {
          subject: lesson.subject.trim(),
          teacher: lesson.teacher.trim(),
          room: lesson.room.trim()
        }
      };
      
      const response = await axios.put(`${API_URL}/schedule/lesson`, payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setSchedules(prev => {
          const newSchedules = JSON.parse(JSON.stringify(prev));
          if (!newSchedules[className]) newSchedules[className] = {};
          if (!newSchedules[className][day]) newSchedules[className][day] = {};
          newSchedules[className][day][lessonNumber] = lesson;
          return newSchedules;
        });
        showToast(`Урок "${lesson.subject}" сохранен`, 'success');
      }
    } catch (error) {
      console.error('Error updating lesson:', error);
      showToast(error.response?.data?.message || 'Ошибка сохранения', 'error');
    }
  }, [showToast]);

  const showConflictNotification = useCallback((conflict) => {
    if (!notificationsEnabled) return;
    
    showToast(
      conflict.message,
      'error',
      conflict,
      () => setQuickFixConflict(conflict)
    );
  }, [notificationsEnabled, showToast]);

  const handleDragStart = useCallback((e, dragData) => {
    if (!isEditMode || isMoving) {
      e.preventDefault();
      return false;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  }, [isEditMode, isMoving]);

  const handleDragEnd = useCallback(() => {
    setDragOverCell(null);
  }, []);

  const handleDragOver = useCallback((e) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, [isEditMode]);

  const handleDragEnter = useCallback((e, className, day, lessonNumber) => {
    if (!isEditMode) return;
    e.preventDefault();
    setDragOverCell(`${className}|${day}|${lessonNumber}`);
  }, [isEditMode]);

  const handleDragLeave = useCallback(() => {
    if (!isEditMode) return;
    setDragOverCell(null);
  }, [isEditMode]);

  const handleDrop = useCallback(async (e, targetClass, targetDay, targetLessonNumber) => {
    if (!isEditMode || isMoving) return;
    e.preventDefault();
    setDragOverCell(null);
    
    let dragData;
    try {
      dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
    } catch {
      return;
    }
    
    if (!dragData?.lesson) return;
    
    const { lesson, sourceLessonNumber, sourceClass, sourceDay } = dragData;
    
    // Проверка на ту же ячейку
    if (sourceClass === targetClass && sourceDay === targetDay && sourceLessonNumber === targetLessonNumber) {
      return;
    }
    
    // Проверка конфликтов
    const conflicts = checkConflicts(schedules, lesson, targetClass, targetDay, targetLessonNumber);
    if (conflicts.length > 0) {
      showConflictNotification({
        ...conflicts[0],
        lesson,
        className: targetClass,
        day: FULL_DAYS[DAYS.indexOf(targetDay)],
        lessonNumber: targetLessonNumber
      });
      return;
    }
    
    setIsMoving(true);
    const oldSchedules = JSON.parse(JSON.stringify(schedules));
    
    // МГНОВЕННОЕ ОБНОВЛЕНИЕ UI
    setSchedules(prev => {
      const newSchedules = JSON.parse(JSON.stringify(prev));
      const movingLesson = newSchedules[sourceClass]?.[sourceDay]?.[sourceLessonNumber];
      if (!movingLesson) return prev;
      
      const targetLessonData = newSchedules[targetClass]?.[targetDay]?.[targetLessonNumber];
      
      delete newSchedules[sourceClass][sourceDay][sourceLessonNumber];
      
      if (targetLessonData) {
        delete newSchedules[targetClass][targetDay][targetLessonNumber];
        if (!newSchedules[sourceClass]) newSchedules[sourceClass] = {};
        if (!newSchedules[sourceClass][sourceDay]) newSchedules[sourceClass][sourceDay] = {};
        newSchedules[sourceClass][sourceDay][sourceLessonNumber] = targetLessonData;
      }
      
      if (!newSchedules[targetClass]) newSchedules[targetClass] = {};
      if (!newSchedules[targetClass][targetDay]) newSchedules[targetClass][targetDay] = {};
      newSchedules[targetClass][targetDay][targetLessonNumber] = movingLesson;
      
      return newSchedules;
    });
    
    // АСИНХРОННЫЙ ЗАПРОС К СЕРВЕРУ (не блокирует UI)
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/schedule/move-lesson`, {
        sourceClass,
        sourceDay,
        sourceLessonNumber,
        targetClass,
        targetDay,
        targetLessonNumber
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      showToast(`"${lesson.subject}"`, 'success');
    } catch (error) {
      setSchedules(oldSchedules);
      showToast('Ошибка', 'error');
    } finally {
      setIsMoving(false);
    }
  }, [isEditMode, schedules, showConflictNotification, showToast, isMoving]);

  const handleEdit = useCallback((className, day, lessonNumber, lesson) => {
    if (!isEditMode) return;
    setEditingCell({ className, day, lessonNumber, lesson });
  }, [isEditMode]);

  const handleSave = useCallback((formData) => {
    if (editingCell) {
      updateLesson(editingCell.className, editingCell.day, editingCell.lessonNumber, formData);
      setEditingCell(null);
    }
  }, [editingCell, updateLesson]);

  const handleDelete = useCallback((className, day, lessonNumber) => {
    if (!isEditMode) return;
    const lesson = schedules[className]?.[day]?.[lessonNumber];
    updateLesson(className, day, lessonNumber, null);
    showToast(`Урок "${lesson?.subject}" удален`, 'warning');
  }, [isEditMode, schedules, updateLesson, showToast]);

  const handleAdd = useCallback((className, day, lessonNumber) => {
    if (!isEditMode) return;
    setEditingCell({ className, day, lessonNumber, lesson: null });
  }, [isEditMode]);

  const clearAllClassesDay = useCallback(async (day) => {
    if (!isEditMode) return;
    const dayName = FULL_DAYS[DAYS.indexOf(day)];
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/schedule/clear-day/${day}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await loadSchedulesFromDB();
      showToast(`Расписание на ${dayName} очищено`, 'warning');
    } catch (error) {
      console.error('Error clearing day:', error);
      showToast('Ошибка очистки', 'error');
    }
  }, [isEditMode, showToast, loadSchedulesFromDB]);

  const exportToExcel = useCallback(() => {
    const data = [];
    DAYS.forEach(day => {
      currentSchedule.forEach(slot => {
        filteredClasses.forEach(classItem => {
          const className = classItem.name;
          const lesson = schedules[className]?.[day]?.[slot.number];
          if (lesson) {
            data.push({
              'Смена': classItem.shift === 1 ? '1 смена' : '2 смена',
              'День недели': FULL_DAYS[DAYS.indexOf(day)],
              'Номер урока': slot.number,
              'Время': `${slot.start}-${slot.end}`,
              'Класс': className,
              'Предмет': lesson.subject,
              'Учитель': lesson.teacher,
              'Кабинет': lesson.room
            });
          }
        });
      });
    });
    
    if (data.length === 0) {
      showToast('Нет данных для экспорта', 'error');
      return;
    }
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Расписание');
    XLSX.writeFile(wb, `raspisanie.xlsx`);
    showToast(`Экспорт завершен`, 'success');
  }, [schedules, currentSchedule, showToast, filteredClasses]);

  const getCellConflicts = useCallback((className, day, lessonNumber) => {
    const key = `${className}|${day}|${lessonNumber}`;
    return conflictsMap[key] || [];
  }, [conflictsMap]);

  const navigateToConflict = useCallback((conflict) => {
    if (!tableWrapperRef.current) return;
    const dayIndex = FULL_DAYS.indexOf(conflict.day);
    const dayKey = DAYS[dayIndex];
    const cell = document.querySelector(`[data-class="${conflict.className}"][data-day="${dayKey}"][data-lesson="${conflict.lessonNumber}"]`);
    if (cell) {
      cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cell.classList.add('highlight-conflict');
      setTimeout(() => cell.classList.remove('highlight-conflict'), 2000);
    }
    setShowConflictsPanel(false);
  }, []);

  const handleFixConflict = useCallback((conflict) => {
    setQuickFixConflict(conflict);
    setShowConflictsPanel(false);
  }, []);

  const handleQuickFixSave = useCallback((formData) => {
    if (quickFixConflict) {
      updateLesson(quickFixConflict.className, quickFixConflict.dayKey, quickFixConflict.lessonNumber, formData);
      showToast(`Конфликт исправлен! Урок "${formData.subject}" обновлен`, 'success');
      setQuickFixConflict(null);
    }
  }, [quickFixConflict, updateLesson, showToast]);

  const toggleNotifications = useCallback(() => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    showToast(
      newState ? 'Уведомления включены' : 'Уведомления выключены',
      'info'
    );
  }, [notificationsEnabled, showToast]);

  if (loading || loadingClasses) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Загрузка расписания...</p>
    </div>
  );

  return (
    <div className={`schedule-viewer-page ${isEditMode ? 'edit-mode-active' : ''}`}>
      {!isEditMode && <ThemeToggle />}
      {!isEditMode && <BackButton />}
      
      {/* <div className="animated-bg">
        {[...Array(6)].map((_, i) => <div key={i} className="glass-circle"></div>)}
      </div>
       */}
      {!isEditMode && <Header />}
      
      <div className={`schedule-viewer-container ${isEditMode ? 'fullscreen' : ''}`}>
        <div className="top-controls-panel">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${classGroup === 'all' ? 'active' : ''}`} 
              onClick={() => setClassGroup('all')}
            >
              Все классы
            </button>
            <button 
              className={`filter-btn ${classGroup === '1-4-first' ? 'active' : ''}`} 
              onClick={() => setClassGroup('1-4-first')}
            >
              1-4 класс (1 смена)
            </button>
            <button 
              className={`filter-btn ${classGroup === '1-4-second' ? 'active' : ''}`} 
              onClick={() => setClassGroup('1-4-second')}
            >
              1-4 класс (2 смена)
            </button>
            <button 
              className={`filter-btn ${classGroup === '5-11-first' ? 'active' : ''}`} 
              onClick={() => setClassGroup('5-11-first')}
            >
              5-11 класс (1 смена)
            </button>
            <button 
              className={`edit-mode-btn ${isEditMode ? 'active' : ''}`} 
              onClick={() => setIsEditMode(!isEditMode)}
            >
              <FaEdit /> {isEditMode ? 'Выйти из редактирования' : 'Режим редактирования'}
            </button>
          </div>
          
          <div className="action-buttons">
            <div className="search-wrapper">
              <FaSearch />
              <input type="text" placeholder="Поиск класса..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            
            <NotificationBell 
              conflicts={globalConflicts} 
              onOpenPanel={() => setShowConflictsPanel(!showConflictsPanel)}
              onFixConflict={handleFixConflict}
            />
            
            <button 
              className={`action-btn notification-toggle ${notificationsEnabled ? 'active' : ''}`}
              onClick={toggleNotifications}
              title={notificationsEnabled ? 'Выключить уведомления' : 'Включить уведомления'}
            >
              {notificationsEnabled ? <FaBell /> : <FaRegBellSlash />}
            </button>
            
            <button className="action-btn" onClick={exportToExcel}>
              <FaFileExcel /> Экспорт
            </button>
            <button className="action-btn" onClick={() => window.print()}>
              <FaPrint /> Печать
            </button>
          </div>
        </div>
        
        {showConflictsPanel && (
          <ConflictsPanel 
            conflicts={globalConflicts} 
            onFixConflict={handleFixConflict}
            onNavigateToConflict={navigateToConflict}
          />
        )}
        
        {filteredClasses.length === 0 ? (
          <div className="no-classes-message">
            <FaSchool />
            <p>Нет классов для отображения</p>
            <small>
              {allClasses.length === 0 
                ? 'Классы не найдены. Проверьте, что классы созданы в панели суперадминистратора.'
                : `Найдено ${allClasses.length} классов, но они не соответствуют выбранному фильтру. Попробуйте выбрать "Все классы".`}
            </small>
          </div>
        ) : (
          <div 
            ref={tableWrapperRef}
            className="schedule-table-wrapper draggable-scroll"
            onMouseDown={handleTableMouseDown}
          >
            <table className="unified-schedule-table">
              <thead>
                <tr>
                  <th className="day-col-header">День недели</th>
                  <th className="lesson-num-header">№ урока</th>
                  <th className="time-col-header">Время</th>
                  {filteredClasses.map(classItem => (
                    <th key={classItem.name || classItem.id} className="class-col">
                      {classItem.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, dayIndex) => (
                  currentSchedule.map((slot, slotIndex) => {
                    const isFirstRowOfDay = slotIndex === 0;
                    return (
                      <tr key={`${day}-${slot.number}`}>
                        {isFirstRowOfDay && (
                          <td className="day-cell" rowSpan={currentSchedule.length}>
                            <div className="day-name-wrapper">
                              <span className="day-full-name">{FULL_DAYS[dayIndex]}</span>
                              <span className="day-short-name">{day}</span>
                              {isEditMode && (
                                <button className="clear-day-all-btn" onClick={() => clearAllClassesDay(day)}>
                                  <FaTrash /> Очистить день
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="lesson-number-cell">
                          <span className="lesson-number">{slot.number}</span>
                        </td>
                        <td className="lesson-time-cell">
                          <span className="lesson-time">{slot.start}–{slot.end}</span>
                        </td>
                        {filteredClasses.map(classItem => {
                          const className = classItem.name;
                          const lesson = schedules[className]?.[day]?.[slot.number];
                          const conflicts = getCellConflicts(className, day, slot.number);
                          const isDragOver = dragOverCell === `${className}|${day}|${slot.number}`;
                          return (
                            <td 
                              key={`${className}-${day}-${slot.number}`} 
                              className={`lesson-cell ${isDragOver ? 'drag-over' : ''}`}
                              data-class={className}
                              data-day={day}
                              data-lesson={slot.number}
                              onDragOver={handleDragOver} 
                              onDragEnter={(e) => handleDragEnter(e, className, day, slot.number)} 
                              onDragLeave={handleDragLeave} 
                              onDrop={(e) => handleDrop(e, className, day, slot.number)}
                            >
                              {lesson ? (
                                <LessonCard 
                                  lesson={lesson} 
                                  onDragStart={handleDragStart}
                                  onDragEnd={handleDragEnd} 
                                  onEdit={() => handleEdit(className, day, slot.number, lesson)} 
                                  onDelete={() => handleDelete(className, day, slot.number)} 
                                  isDraggable={isEditMode} 
                                  conflicts={conflicts}
                                  lessonNumber={slot.number}
                                  className={className}
                                  day={day}
                                  isMoving={isMoving}
                                />
                              ) : (
                                <div className={`empty-slot-add ${!isEditMode ? 'disabled' : ''}`} onClick={() => handleAdd(className, day, slot.number)}>
                                  {isEditMode && <FaPlus />}
                                  {!isEditMode && <span className="empty-indicator">—</span>}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {isEditMode && filteredClasses.length > 0 && (
          <div className="copy-panel">
            <span className="copy-label"><FaCopy /> Копировать день:</span>
            <select onChange={async (e) => {
              const [day, sourceClass, targetClass] = e.target.value.split('|');
              if (sourceClass && targetClass && day) {
                try {
                  const token = localStorage.getItem('token');
                  await axios.post(`${API_URL}/schedule/copy-day`, {
                    sourceClass,
                    targetClass,
                    dayOfWeek: day
                  }, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  
                  await loadSchedulesFromDB();
                  showToast(`День скопирован: ${sourceClass} → ${targetClass}, ${FULL_DAYS[DAYS.indexOf(day)]}`, 'success');
                } catch (error) {
                  console.error('Error copying day:', error);
                  showToast(error.response?.data?.message || 'Ошибка копирования', 'error');
                }
              }
              e.target.value = '';
            }} defaultValue="">
              <option value="">Выберите действие</option>
              {DAYS.map(day => (
                <optgroup key={day} label={`${FULL_DAYS[DAYS.indexOf(day)]}`}>
                  {filteredClasses.map(sourceClass => (
                    filteredClasses.filter(c => c.name !== sourceClass.name).map(targetClass => (
                      <option key={`${day}|${sourceClass.name}|${targetClass.name}`} value={`${day}|${sourceClass.name}|${targetClass.name}`}>
                        {sourceClass.name} → {targetClass.name}
                      </option>
                    ))
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}
        
        <div className="tips-footer">
          {isEditMode ? (
            <>
              <div className="tip"><FaGripVertical /> Перетащите карточку для перемещения урока</div>
              <div className="tip"><FaHandPaper /> Зажмите мышку для прокрутки таблицы</div>
              <div className="tip"><FaEdit /> Нажмите на иконку редактирования</div>
              <div className="tip"><FaTrash /> Удалите ненужные уроки</div>
              <div className="tip"><FaPlus /> Добавьте урок в пустую ячейку</div>
              <div className="tip conflict-tip"><FaExclamationTriangle /> Красная карточка = конфликт</div>
              <div className="tip"><FaDoorOpen /> Кабинеты с приоритетными предметами отмечены звездочкой ⭐</div>
            </>
          ) : (
            <div className="tip"><FaInfoCircle /> Включите режим редактирования для изменения расписания</div>
          )}
        </div>
      </div>
      
      {editingCell && (
        <EditModal
          lesson={editingCell.lesson}
          onSave={handleSave}
          onClose={() => setEditingCell(null)}
          schedules={schedules}
          currentClass={editingCell.className}
          currentDay={editingCell.day}
          currentLessonNumber={editingCell.lessonNumber}
          showToast={showToast}
        />
      )}
      
      {quickFixConflict && (
        <QuickFixModal
          conflict={quickFixConflict}
          onSave={handleQuickFixSave}
          onClose={() => setQuickFixConflict(null)}
        />
      )}
      
      {!isEditMode && <Footer />}
      
      <div className="toast-container">
        {toasts.map(toast => (
          <ToastNotification
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            conflict={toast.conflict}
            onFix={toast.onFix}
          />
        ))}
      </div>
    </div>
  );
};

export default ScheduleViewer;