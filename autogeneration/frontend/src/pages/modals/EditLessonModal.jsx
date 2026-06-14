// modals/EditLessonModal.jsx - Полная версия модального окна редактирования урока

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  FaEdit, FaTimes, FaGraduationCap, FaChalkboardTeacher, 
  FaDoorOpen, FaSchool, FaSave, FaSpinner, FaExclamationTriangle 
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EditLessonModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  lesson, 
  subjects, 
  teachers, 
  rooms, 
  classId, 
  className, 
  editingCell 
}) => {
  const [formData, setFormData] = useState({ subject: '', teacher: '', room: '' });
  const [conflicts, setConflicts] = useState([]);
  const [checking, setChecking] = useState(false);
  
  // Состояния для приоритетных данных ПО КЛАССУ
  const [classTeachers, setClassTeachers] = useState([]);
  const [classRooms, setClassRooms] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [allTeachersList, setAllTeachersList] = useState([]);
  const [allRoomsList, setAllRoomsList] = useState([]);
  
  // Кэши для оптимизации
  const [classSubjectTeachersCache, setClassSubjectTeachersCache] = useState({});
  const [classSubjectTeacherRoomsCache, setClassSubjectTeacherRoomsCache] = useState({});

  // Инициализация списков
  useEffect(() => {
    if (teachers && teachers.length > 0) {
      setAllTeachersList(teachers);
    }
    if (rooms && rooms.length > 0) {
      setAllRoomsList(rooms);
    }
  }, [teachers, rooms]);

  // Инициализация формы при открытии
  useEffect(() => {
    if (lesson && isOpen) {
      setFormData({
        subject: lesson.subject || '',
        teacher: lesson.teacher || '',
        room: lesson.room || ''
      });
      setConflicts([]);
      
      if (lesson.subject && classId) {
        loadClassTeachers(lesson.subject);
        if (lesson.teacher) {
          loadClassRooms(lesson.subject, lesson.teacher);
        }
      }
    }
  }, [lesson, isOpen, classId]);

  // Загрузка учителей, которые ведут этот предмет В ЭТОМ КЛАССЕ
  const loadClassTeachers = useCallback(async (subjectName) => {
    const cacheKey = `${classId}_${subjectName}`;
    if (classSubjectTeachersCache[cacheKey]) {
      setClassTeachers(classSubjectTeachersCache[cacheKey]);
      return;
    }
    
    setLoadingData(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/schedule/class-teachers/${encodeURIComponent(subjectName)}?classId=${classId}&className=${encodeURIComponent(className || '')}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const teachersData = response.data || [];
      setClassSubjectTeachersCache(prev => ({ ...prev, [cacheKey]: teachersData }));
      setClassTeachers(teachersData);
    } catch (err) {
      console.error('Error loading class teachers:', err);
      setClassTeachers([]);
    } finally {
      setLoadingData(false);
    }
  }, [classId, className, classSubjectTeachersCache]);

  // Загрузка кабинетов для этого предмета, учителя и класса
  const loadClassRooms = useCallback(async (subjectName, teacherName) => {
    const cacheKey = `${classId}_${subjectName}_${teacherName}`;
    if (classSubjectTeacherRoomsCache[cacheKey]) {
      setClassRooms(classSubjectTeacherRoomsCache[cacheKey]);
      return;
    }
    
    setLoadingData(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/schedule/class-rooms/${encodeURIComponent(subjectName)}?classId=${classId}&className=${encodeURIComponent(className || '')}&teacher=${encodeURIComponent(teacherName)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const roomsData = response.data || [];
      setClassSubjectTeacherRoomsCache(prev => ({ ...prev, [cacheKey]: roomsData }));
      setClassRooms(roomsData);
    } catch (err) {
      console.error('Error loading class rooms:', err);
      setClassRooms([]);
    } finally {
      setLoadingData(false);
    }
  }, [classId, className, classSubjectTeacherRoomsCache]);

  // При изменении предмета
  const handleSubjectChange = useCallback(async (subjectName) => {
    setFormData({ subject: subjectName, teacher: '', room: '' });
    setClassRooms([]);
    
    if (subjectName && classId) {
      await loadClassTeachers(subjectName);
    } else {
      setClassTeachers([]);
    }
  }, [classId, loadClassTeachers]);

  // При изменении учителя
  const handleTeacherChange = useCallback(async (teacherName) => {
    setFormData(prev => ({ ...prev, teacher: teacherName, room: '' }));
    
    if (formData.subject && teacherName && classId) {
      await loadClassRooms(formData.subject, teacherName);
    }
  }, [formData.subject, classId, loadClassRooms]);

  // Получить список учителей (только те, кто ведет этот предмет в этом классе)
  const getFilteredTeachers = useCallback(() => {
    if (!formData.subject || !classId) return [];
    
    if (classTeachers.length > 0) {
      return classTeachers;
    }
    
    return allTeachersList.map(t => ({ ...t, not_confirmed: true }));
  }, [formData.subject, classId, classTeachers, allTeachersList]);

  // Получить список кабинетов
  const getFilteredRooms = useCallback(() => {
    if (!formData.subject || !formData.teacher || !classId) return [];
    
    if (classRooms.length > 0) {
      return classRooms;
    }
    
    return allRoomsList.map(r => ({ ...r, not_confirmed: true }));
  }, [formData.subject, formData.teacher, classId, classRooms, allRoomsList]);

  // Получить тип приоритета учителя
  const getTeacherBadge = useCallback((teacher) => {
    if (teacher.is_primary) return '👑 (основной учитель)';
    if (teacher.lesson_count > 1) return `📚 (${teacher.lesson_count} урока в неделю)`;
    if (teacher.not_confirmed) return '⚠️ (не подтверждено для этого класса)';
    return '✅ (ведет этот предмет)';
  }, []);

  // Получить тип приоритета кабинета
  const getRoomBadge = useCallback((room) => {
    if (room.is_primary) return '🏠 (основной кабинет)';
    if (room.is_class_room) return '🏫 (кабинет класса)';
    if (room.not_confirmed) return '⚠️ (не подтвержден)';
    if (room.lesson_count > 1) return `📖 (${room.lesson_count} уроков)`;
    return '✅ (рекомендуемый)';
  }, []);

  // Проверка конфликтов
  const checkConflictsAPI = useCallback(async () => {
    if (!formData.subject || !formData.teacher || !formData.room) return;
    
    setChecking(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/schedule/check-conflicts`, {
        className: className,
        dayOfWeek: editingCell?.day,
        lessonNumber: editingCell?.lessonNumber,
        lesson: formData,
        classId: classId
      }, { headers: { Authorization: `Bearer ${token}` } });
      setConflicts(response.data.conflicts || []);
    } catch (err) {
      console.error('Error checking conflicts:', err);
    } finally {
      setChecking(false);
    }
  }, [formData, className, editingCell, classId]);

  useEffect(() => {
    if (formData.subject && formData.teacher && formData.room && isOpen) {
      const timeout = setTimeout(checkConflictsAPI, 500);
      return () => clearTimeout(timeout);
    }
  }, [formData, isOpen, checkConflictsAPI]);

  const handleSave = useCallback(() => {
    if (!formData.subject || !formData.teacher || !formData.room) {
      alert('Заполните все поля');
      return;
    }
    onSave(formData);
    onClose();
  }, [formData, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><FaEdit /> {lesson ? 'Редактировать урок' : 'Добавить урок'}</h3>
          <button className="close-modal" onClick={onClose}><FaTimes /></button>
        </div>
        
        <div className="modal-content">
          {/* Информация о классе */}
          {className && (
            <div className="class-info-badge">
              <FaSchool /> Класс: <strong>{className}</strong>
              {classId && <span className="class-id-badge">ID: {classId}</span>}
            </div>
          )}

          {/* Выбор предмета */}
          <div className="form-group">
            <label><FaGraduationCap /> Предмет</label>
            <select 
              value={formData.subject} 
              onChange={(e) => handleSubjectChange(e.target.value)}
            >
              <option value="">Выберите предмет</option>
              {subjects && subjects.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name} {s.shortName && `(${s.shortName})`}
                </option>
              ))}
            </select>
          </div>

          {/* Выбор учителя */}
          <div className="form-group">
            <label><FaChalkboardTeacher /> Учитель</label>
            <select 
              value={formData.teacher} 
              onChange={(e) => handleTeacherChange(e.target.value)}
              disabled={!formData.subject || !classId}
            >
              <option value="">
                {!formData.subject ? 'Сначала выберите предмет' : 
                 !classId ? 'Класс не выбран' : 
                 'Выберите учителя'}
              </option>
              {getFilteredTeachers().map(t => {
                const badge = getTeacherBadge(t);
                return (
                  <option key={t.id} value={t.name || `${t.last_name} ${t.first_name}`}>
                    {t.name || `${t.last_name} ${t.first_name} ${t.middle_name || ''}`} {badge}
                  </option>
                );
              })}
            </select>
            
            {loadingData && (
              <div className="loading-priority">
                <FaSpinner className="spinner" /> Загрузка учителей для этого класса...
              </div>
            )}
            
            {formData.subject && classId && classTeachers.length === 0 && !loadingData && (
              <div className="info-hint warning">
                ⚠️ Нет данных о том, кто ведет этот предмет в {className} классе. 
                Выберите учителя из списка ниже (потребуется подтверждение).
              </div>
            )}
          </div>

          {/* Выбор кабинета */}
          <div className="form-group">
            <label><FaDoorOpen /> Кабинет</label>
            <select 
              value={formData.room} 
              onChange={(e) => setFormData({...formData, room: e.target.value})}
              disabled={!formData.subject || !formData.teacher || !classId}
            >
              <option value="">
                {!formData.subject ? 'Сначала выберите предмет' : 
                 !formData.teacher ? 'Сначала выберите учителя' : 
                 !classId ? 'Класс не выбран' :
                 'Выберите кабинет'}
              </option>
              {getFilteredRooms().map(r => {
                const badge = getRoomBadge(r);
                return (
                  <option key={r.id} value={r.number}>
                    Кабинет {r.number} {r.name && `(${r.name})`} {badge}
                  </option>
                );
              })}
            </select>
            
            {formData.subject && formData.teacher && classId && classRooms.length === 0 && !loadingData && (
              <div className="info-hint warning">
                ⚠️ Нет данных о кабинете для выбранного учителя в {className} классе.
                Выберите кабинет из списка ниже.
              </div>
            )}
          </div>
          
          {/* Предупреждения о конфликтах */}
          {conflicts.length > 0 && (
            <div className="conflicts-warning">
              <div className="conflicts-header">
                <FaExclamationTriangle /> Обнаружены конфликты:
              </div>
              <ul className="conflicts-list">
                {conflicts.map((c, i) => (
                  <li key={i} className={`conflict-${c.severity}`}>
                    {c.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Индикатор проверки конфликтов */}
          {checking && (
            <div className="conflicts-checking">
              <FaSpinner className="spinner" /> Проверка конфликтов...
            </div>
          )}
        </div>
        
        {/* Кнопки действий */}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Отмена
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSave} 
            disabled={checking || !formData.subject || !formData.teacher || !formData.room}
          >
            <FaSave /> Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

// Сравнение пропсов для оптимизации
const areEqual = (prevProps, nextProps) => {
  return prevProps.isOpen === nextProps.isOpen &&
         prevProps.lesson === nextProps.lesson &&
         prevProps.classId === nextProps.classId &&
         prevProps.className === nextProps.className &&
         prevProps.subjects === nextProps.subjects &&
         prevProps.teachers === nextProps.teachers &&
         prevProps.rooms === nextProps.rooms;
};

export default React.memo(EditLessonModal, areEqual);