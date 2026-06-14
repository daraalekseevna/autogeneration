// ScheduleViewer.jsx - ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ (БЕЗ ПОДСВЕТКИ КОНФЛИКТОВ)
import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { 
  FaEdit, FaTrash, FaPlus, FaSearch, FaFileExcel, FaPrint, FaGripVertical, FaTimes,
  FaUserGraduate, FaDoorOpen, FaCopy, FaPaste,
  FaExclamationTriangle, FaCheckCircle,
  FaSave, FaEye, FaGraduationCap, FaChalkboardTeacher, FaChevronDown,
  FaChevronUp, FaInfoCircle, FaCloudUploadAlt, FaHistory,
  FaSpinner
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
const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const FULL_DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

// Карта преобразования дней недели
const DAY_MAP_FULL_TO_SHORT = {
  'Понедельник': 'ПН',
  'Вторник': 'ВТ',
  'Среда': 'СР',
  'Четверг': 'ЧТ',
  'Пятница': 'ПТ',
  'Суббота': 'СБ'
};

// Кэш для данных
let lessonsCache = null;
let teachersCache = null;
let roomsCache = null;
let scheduleSettingsCache = null;

// Функция для расчета времени урока
const calculateLessonTimes = (settings, shift = 1) => {
  if (!settings) return {};
  
  const lessonDuration = shift === 2 && settings.secondShift 
    ? settings.secondShiftLessonDuration 
    : settings.lessonDuration;
  
  const startTime = shift === 2 && settings.secondShift 
    ? settings.secondShiftStart 
    : settings.startTime;
  
  const breaks = shift === 2 && settings.secondShift 
    ? settings.secondShiftBreaks 
    : settings.breaks;
  
  const shortBreakDuration = shift === 2 && settings.secondShift 
    ? settings.secondShiftShortBreakDuration 
    : settings.shortBreakDuration;
  
  const maxLessons = shift === 2 && settings.secondShift 
    ? settings.secondShiftMaxLessonsPerDay 
    : settings.maxLessonsPerDay;
  
  const times = {};
  let currentTime = startTime;
  
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };
  
  for (let lessonNum = 1; lessonNum <= maxLessons; lessonNum++) {
    const startMinutes = parseTime(currentTime);
    const endMinutes = startMinutes + lessonDuration;
    const endTime = formatTime(endMinutes);
    
    times[lessonNum] = {
      start: currentTime,
      end: endTime,
      duration: lessonDuration,
      lessonNumber: lessonNum
    };
    
    const breakConfig = breaks.find(b => b.afterLesson === lessonNum);
    let breakDuration = shortBreakDuration;
    if (breakConfig) {
      breakDuration = breakConfig.duration;
    }
    
    currentTime = formatTime(endMinutes + breakDuration);
  }
  
  return times;
};

const convertScheduleDays = (schedules) => {
  if (!schedules || Object.keys(schedules).length === 0) return {};
  
  const converted = {};
  for (const [className, days] of Object.entries(schedules)) {
    converted[className] = {};
    for (const [fullDayName, lessons] of Object.entries(days)) {
      const shortDayName = DAY_MAP_FULL_TO_SHORT[fullDayName];
      if (shortDayName) {
        converted[className][shortDayName] = {};
        for (const [lessonNum, lesson] of Object.entries(lessons)) {
          converted[className][shortDayName][lessonNum] = {
            subject: lesson.subject,
            teacher: lesson.teacher,
            room: lesson.room,
            teacherColor: lesson.teacherColor || lesson.teacher_color
          };
        }
      }
    }
  }
  return converted;
};

// Компонент LessonCard (БЕЗ ПОДСВЕТКИ КОНФЛИКТОВ)
const LessonCard = memo(({ lesson, teacherColor, onEdit, onDelete, isDraggable, onDragStart, onDragEnd, lessonNumber, className, day, onCopy, onPaste, canPaste }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  if (!lesson) return null;
  
  const getTeacherInitials = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 1) {
      const lastName = parts[0];
      const lastNameShort = lastName.length > 3 ? lastName.substring(0, 3) : lastName;
      if (parts.length >= 2) {
        const firstNameInitial = parts[1] ? parts[1].charAt(0).toUpperCase() + '.' : '';
        const middleNameInitial = parts[2] ? parts[2].charAt(0).toUpperCase() + '.' : '';
        return `${lastNameShort}. ${firstNameInitial}${middleNameInitial}`;
      }
      return `${lastNameShort}.`;
    }
    return fullName;
  };
  
  const teacherInitials = getTeacherInitials(lesson.teacher);
  const shortSubject = lesson.subject?.length > 8 ? lesson.subject.substring(0, 8) + '…' : lesson.subject;
  const cardColor = teacherColor || '#3b82f6';
  
  const handleDragStart = useCallback((e) => {
    if (!isDraggable) {
      e.preventDefault();
      return false;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify({ lesson, lessonNumber, className, day }));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(e);
  }, [isDraggable, lesson, lessonNumber, className, day, onDragStart]);
  
  return (
    <div 
      className={`lesson-card ${isDraggable ? 'edit-mode draggable' : 'view-mode'}`}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      style={{ borderLeftColor: cardColor, backgroundColor: `${cardColor}10` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isDraggable && <div className="drag-icon"><FaGripVertical /></div>}
      <div className="lesson-subject" title={lesson.subject}>{shortSubject}</div>
      <div className="lesson-teacher"><FaUserGraduate /> {teacherInitials}</div>
      <div className="lesson-room"><FaDoorOpen /> {lesson.room}</div>
      {isHovered && isDraggable && (
        <div className="lesson-actions">
          <button className="lesson-action-btn edit" onClick={() => onEdit(lesson)}><FaEdit /></button>
          <button className="lesson-action-btn delete" onClick={() => onDelete()}><FaTrash /></button>
          <button className="lesson-action-btn copy" onClick={() => onCopy(lesson)}><FaCopy /></button>
          {canPaste && <button className="lesson-action-btn paste" onClick={() => onPaste()}><FaPaste /></button>}
        </div>
      )}
    </div>
  );
});

LessonCard.displayName = 'LessonCard';

// Toast уведомление
const ToastNotification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast-notification ${type}`}>
      <div className="toast-icon">{type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}</div>
      <div className="toast-content">
        <div className="toast-title">{type === 'success' ? 'Успешно' : 'Ошибка'}</div>
        <div className="toast-message">{message}</div>
      </div>
      <button className="toast-close" onClick={onClose}><FaTimes /></button>
    </div>
  );
};

// Панель конфликтов (скрыта полностью)
const ConflictsPanel = ({ conflicts, isEditMode, isOpen, onToggle }) => {
  // Полностью скрываем панель конфликтов
  return null;
};

// Модальное окно редактирования
const EditLessonModal = ({ isOpen, onClose, onSave, lesson, subjects, teachers, rooms }) => {
  const [formData, setFormData] = useState({ subject: '', teacher: '', room: '' });

  useEffect(() => {
    if (lesson && isOpen) {
      setFormData({
        subject: lesson.subject || '',
        teacher: lesson.teacher || '',
        room: lesson.room || ''
      });
    }
  }, [lesson, isOpen]);

  const handleSave = () => {
    if (!formData.subject || !formData.teacher || !formData.room) {
      alert('Заполните все поля');
      return;
    }
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><FaEdit /> {lesson ? 'Редактировать урок' : 'Добавить урок'}</h3>
          <button className="close-modal" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="modal-content">
          <div className="form-group">
            <label><FaGraduationCap /> Предмет</label>
            <select value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}>
              <option value="">Выберите предмет</option>
              {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label><FaChalkboardTeacher /> Учитель</label>
            <select value={formData.teacher} onChange={e => setFormData({...formData, teacher: e.target.value})}>
              <option value="">Выберите учителя</option>
              {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label><FaDoorOpen /> Кабинет</label>
            <select value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})}>
              <option value="">Выберите кабинет</option>
              {rooms.map(r => <option key={r.id} value={r.number}>Кабинет {r.number}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn-primary" onClick={handleSave}><FaSave /> Сохранить</button>
        </div>
      </div>
    </div>
  );
};

// История версий
const VersionHistoryModal = ({ isOpen, onClose, versions, onLoadVersion, onPublishVersion, currentVersionId }) => {
  if (!isOpen) return null;

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('ru-RU');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="version-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><FaHistory /> История версий расписания</h3>
          <button className="close-modal" onClick={onClose}><FaTimes /></button>
        </div>
        <div className="modal-content">
          <table className="versions-table">
            <thead>
              <tr>
                <th>Версия</th>
                <th>Название</th>
                <th>Дата</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id} className={currentVersionId === v.id ? 'current-version' : ''}>
                  <td>{`v${v.version_number}`}</td>
                  <td>{v.name || `Черновик ${new Date(v.created_at).toLocaleDateString()}`}</td>
                  <td>{formatDate(v.created_at)}</td>
                  <td>{v.status === 'published' ? 'Опубликовано' : 'Черновик'}</td>
                  <td className="actions">
                    <button onClick={() => onLoadVersion(v)} className="version-btn load" title="Загрузить">
                      <FaEye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
};

// ГЛАВНЫЙ КОМПОНЕНТ
const ScheduleViewer = () => {
  const navigate = useNavigate();
  const tableWrapperRef = useRef(null);
  
  // Все useState
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [classGroup, setClassGroup] = useState('all');
  const [isEditMode, setIsEditMode] = useState(false);
  const [allClasses, setAllClasses] = useState([]);
  const [teacherColors, setTeacherColors] = useState({});
  const [copiedLesson, setCopiedLesson] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [versions, setVersions] = useState([]);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [currentVersionId, setCurrentVersionId] = useState(null);
  const [isDraft, setIsDraft] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduleSettings, setScheduleSettings] = useState(null);
  const [classShifts, setClassShifts] = useState({});
  const [timeCache, setTimeCache] = useState({});
  const [shiftStartLesson, setShiftStartLesson] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [conflictsPanelOpen, setConflictsPanelOpen] = useState(true);

  const token = localStorage.getItem('token');

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  // Обновление урока
  const updateLesson = useCallback((className, day, lessonNumber, lesson) => {
    setSchedules(prev => {
      const newSchedules = { ...prev };
      if (!newSchedules[className]) newSchedules[className] = {};
      if (!newSchedules[className][day]) newSchedules[className][day] = {};
      if (lesson) newSchedules[className][day][lessonNumber] = lesson;
      else delete newSchedules[className][day][lessonNumber];
      setHasUnsavedChanges(true);
      return newSchedules;
    });
    showToast(lesson ? `Урок "${lesson.subject}" сохранён` : 'Урок удалён', 'success');
  }, [showToast]);

  // Drag & Drop обработчики
  const handleDragStart = useCallback((e, dragData) => {
    if (!isEditMode) {
      e.preventDefault();
      return false;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  }, [isEditMode]);

  const handleDrop = useCallback(async (e, targetClass, targetDay, targetLessonNumber) => {
    if (!isEditMode) return;
    e.preventDefault();
    setDragOverCell(null);
    
    let dragData;
    try { dragData = JSON.parse(e.dataTransfer.getData('text/plain')); } catch { return; }
    if (!dragData?.lesson) return;
    
    const { lesson, lessonNumber: sourceLessonNumber, className: sourceClass, day: sourceDay } = dragData;
    if (sourceClass === targetClass && sourceDay === targetDay && sourceLessonNumber === targetLessonNumber) return;
    
    setSchedules(prev => {
      const newSchedules = { ...prev };
      const movingLesson = newSchedules[sourceClass]?.[sourceDay]?.[sourceLessonNumber];
      if (!movingLesson) return prev;
      
      const targetLessonData = newSchedules[targetClass]?.[targetDay]?.[targetLessonNumber];
      
      if (newSchedules[sourceClass]?.[sourceDay]) {
        delete newSchedules[sourceClass][sourceDay][sourceLessonNumber];
      }
      
      if (targetLessonData) {
        if (!newSchedules[sourceClass]) newSchedules[sourceClass] = {};
        if (!newSchedules[sourceClass][sourceDay]) newSchedules[sourceClass][sourceDay] = {};
        newSchedules[sourceClass][sourceDay][sourceLessonNumber] = targetLessonData;
      }
      
      if (!newSchedules[targetClass]) newSchedules[targetClass] = {};
      if (!newSchedules[targetClass][targetDay]) newSchedules[targetClass][targetDay] = {};
      newSchedules[targetClass][targetDay][targetLessonNumber] = movingLesson;
      
      setHasUnsavedChanges(true);
      return newSchedules;
    });
  }, [isEditMode]);

  const handleDragOver = useCallback((e) => {
    if (isEditMode) e.preventDefault();
  }, [isEditMode]);

  const handleDragEnter = useCallback((e, className, day, lessonNumber) => {
    if (isEditMode) {
      e.preventDefault();
      setDragOverCell(`${className}|${day}|${lessonNumber}`);
    }
  }, [isEditMode]);

  const handleDragLeave = useCallback(() => setDragOverCell(null), []);

  // Копирование/вставка
  const handleCopyLesson = useCallback((lesson) => {
    setCopiedLesson(lesson);
    showToast(`Скопирован урок: ${lesson.subject}`, 'info');
  }, [showToast]);

  const handlePasteLesson = useCallback((targetClass, targetDay, targetLessonNumber) => {
    if (!copiedLesson) {
      showToast('Нет скопированного урока', 'error');
      return;
    }
    updateLesson(targetClass, targetDay, targetLessonNumber, copiedLesson);
    showToast(`Вставлен урок: ${copiedLesson.subject}`, 'success');
  }, [copiedLesson, updateLesson, showToast]);

  // Удаление урока
  const handleDeleteLesson = useCallback((className, day, lessonNumber) => {
    if (window.confirm('Удалить урок?')) {
      updateLesson(className, day, lessonNumber, null);
    }
  }, [updateLesson]);

  // Редактирование урока
  const handleEditLesson = useCallback((className, day, lessonNumber, lesson) => {
    setEditingCell({ className, day, lessonNumber });
    setEditingLesson(lesson);
    setEditModalOpen(true);
  }, []);

  const handleSaveLesson = useCallback((formData) => {
    if (editingCell) {
      updateLesson(editingCell.className, editingCell.day, editingCell.lessonNumber, formData);
    }
  }, [editingCell, updateLesson]);

  // Получение урока для ячейки
  const getLessonForCell = useCallback((className, day, lessonNumber) => {
    return schedules[className]?.[day]?.[lessonNumber] || null;
  }, [schedules]);

  // Проверка показывать ли урок для класса
  const shouldShowLessonForClass = useCallback((className, lessonNumber) => {
    const shift = classShifts[className] || 1;
    const startOffset = shiftStartLesson[shift] || 1;
    const maxLessons = shift === 2 
      ? (scheduleSettings?.secondShiftMaxLessonsPerDay || 6)
      : (scheduleSettings?.maxLessonsPerDay || 7);
    return lessonNumber >= startOffset && lessonNumber < startOffset + maxLessons;
  }, [classShifts, shiftStartLesson, scheduleSettings]);

  // Получение времени урока
  const getClassLessonTime = useCallback((className, lessonNumber) => {
    const shift = classShifts[className] || 1;
    const times = timeCache[shift];
    const startOffset = shiftStartLesson[shift] || 1;
    const actualLessonNumber = lessonNumber - startOffset + 1;
    if (times && times[actualLessonNumber]) {
      return times[actualLessonNumber].start;
    }
    return shift === 2 ? "14:00" : "08:00";
  }, [classShifts, timeCache, shiftStartLesson]);

  // Фильтрация классов
  const filteredClasses = useMemo(() => {
    let filtered = [...allClasses];
    
    if (classGroup === '1-4-first') {
      filtered = filtered.filter(c => parseInt(c.number) >= 1 && parseInt(c.number) <= 4 && (classShifts[c.name] === 1 || !classShifts[c.name]));
    } else if (classGroup === '1-4-second') {
      filtered = filtered.filter(c => parseInt(c.number) >= 1 && parseInt(c.number) <= 4 && classShifts[c.name] === 2);
    } else if (classGroup === '5-11-first') {
      filtered = filtered.filter(c => parseInt(c.number) >= 5 && parseInt(c.number) <= 11 && (classShifts[c.name] === 1 || !classShifts[c.name]));
    }
    
    if (searchTerm) {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    filtered.sort((a, b) => {
      const numA = parseInt(a.number);
      const numB = parseInt(b.number);
      if (numA !== numB) return numA - numB;
      return (a.letter || '').localeCompare(b.letter || '');
    });
    
    return filtered;
  }, [allClasses, classGroup, searchTerm, classShifts]);

  // Экспорт в Excel
  const exportToExcel = useCallback(() => {
    const data = [];
    const daysList = DAYS;
    
    for (const classItem of filteredClasses) {
      const className = classItem.name;
      const classSchedule = schedules[className] || {};
      for (const day of daysList) {
        const dayLessons = classSchedule[day] || {};
        for (const [lessonNum, lesson] of Object.entries(dayLessons)) {
          data.push({
            'Класс': className,
            'День недели': day,
            'Номер урока': lessonNum,
            'Предмет': lesson.subject,
            'Учитель': lesson.teacher,
            'Кабинет': lesson.room
          });
        }
      }
    }
    
    if (data.length === 0) {
      showToast('Нет данных для экспорта', 'error');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Расписание');
    XLSX.writeFile(wb, `raspisanie_${new Date().toLocaleDateString()}.xlsx`);
    showToast('Экспорт завершен', 'success');
  }, [schedules, filteredClasses, showToast]);

  // Печать
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Сохранение черновика
  const saveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_URL}/schedule/save-draft`, { schedule: schedules }, config);
      showToast('Черновик сохранён', 'success');
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error saving draft:', err);
      showToast('Ошибка сохранения черновика', 'error');
    } finally {
      setSaving(false);
    }
  }, [schedules, token, showToast]);

  // Публикация расписания
  const publishSchedule = useCallback(async () => {
    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_URL}/schedule/publish`, { schedule: schedules }, config);
      showToast('Расписание опубликовано', 'success');
      setIsDraft(false);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Error publishing:', err);
      showToast('Ошибка публикации', 'error');
    } finally {
      setSaving(false);
    }
  }, [schedules, token, showToast]);

  // Загрузка версии
  const loadVersion = useCallback(async (version) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/schedule/version/${version.id}`, config);
      if (res.data?.schedule) {
        const convertedSchedule = convertScheduleDays(res.data.schedule);
        setSchedules(convertedSchedule);
        setCurrentVersionId(version.id);
        setIsDraft(version.status === 'draft');
        setHasUnsavedChanges(false);
        showToast(`Загружена версия ${version.name || version.version_number}`, 'success');
        setVersionHistoryOpen(false);
      }
    } catch (err) {
      console.error('Error loading version:', err);
      showToast('Ошибка загрузки версии', 'error');
    }
  }, [token, showToast]);

  // ЗАГРУЗКА ДАННЫХ
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const [classesRes, teachersRes, roomsRes, settingsRes, lessonsRes, versionsRes] = await Promise.all([
          axios.get(`${API_URL}/schedule/viewer/classes`, config),
          axios.get(`${API_URL}/schedule/public-teachers`, config),
          axios.get(`${API_URL}/schedule/public-rooms`, config),
          axios.get(`${API_URL}/admin/schedule-settings`, config),
          axios.get(`${API_URL}/schedule/public-lessons`, config),
          axios.get(`${API_URL}/schedule/versions`, config)
        ]);
        
        setAllClasses(classesRes.data || []);
        setTeachers(teachersRes.data || []);
        setRooms(roomsRes.data || []);
        setSubjects(lessonsRes.data || []);
        setVersions(versionsRes.data || []);
        
        const colorsMap = {};
        teachersRes.data.forEach(t => { 
          if (t.color) colorsMap[t.name] = t.color; 
        });
        setTeacherColors(colorsMap);
        
        setScheduleSettings(settingsRes.data);
        
        try {
          const activeRes = await axios.get(`${API_URL}/schedule/active`, config);
          if (activeRes.data?.schedules && Object.keys(activeRes.data.schedules).length > 0) {
            console.log('Загружено активное расписание из БД');
            const convertedSchedules = convertScheduleDays(activeRes.data.schedules);
            setSchedules(convertedSchedules);
            setCurrentVersionId(activeRes.data.version_id);
            setIsDraft(false);
          } else {
            const draftRes = await axios.get(`${API_URL}/schedule/draft`, config);
            if (draftRes.data?.schedules && Object.keys(draftRes.data.schedules).length > 0) {
              console.log('Загружен черновик расписания');
              const convertedSchedules = convertScheduleDays(draftRes.data.schedules);
              setSchedules(convertedSchedules);
              setCurrentVersionId(draftRes.data.version_id);
              setIsDraft(true);
            } else {
              console.log('Расписание не найдено в БД');
              setSchedules({});
            }
          }
        } catch (err) {
          console.log('Ошибка загрузки расписания:', err);
          setSchedules({});
        }
        
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        showToast('Ошибка загрузки расписания', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      loadData();
    } else {
      console.log('Нет токена авторизации');
      setLoading(false);
    }
  }, [token, showToast]);

  // Расчет времени уроков
  useEffect(() => {
    if (scheduleSettings) {
      const newCache = {};
      const newStartLesson = {};
      
      newCache[1] = calculateLessonTimes(scheduleSettings, 1);
      newStartLesson[1] = 1;
      
      if (scheduleSettings.secondShift) {
        newCache[2] = calculateLessonTimes(scheduleSettings, 2);
        const firstShiftMax = scheduleSettings.maxLessonsPerDay || 7;
        newStartLesson[2] = firstShiftMax - (scheduleSettings.secondShiftMaxLessonsPerDay || 6) + 1;
        if (newStartLesson[2] < 1) newStartLesson[2] = 1;
      }
      
      setTimeCache(newCache);
      setShiftStartLesson(newStartLesson);
    }
  }, [scheduleSettings]);

  // Загрузка смен для классов
  useEffect(() => {
    if (allClasses.length > 0) {
      const fetchShifts = async () => {
        const shifts = {};
        for (const cls of allClasses) {
          try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${API_URL}/schedule/class-shift/${encodeURIComponent(cls.name)}`, config);
            shifts[cls.name] = res.data.shift || 1;
          } catch {
            shifts[cls.name] = 1;
          }
        }
        setClassShifts(shifts);
      };
      fetchShifts();
    }
  }, [allClasses, token]);

  // Вычисление максимального количества уроков
  const maxTotalLessons = useMemo(() => {
    return Math.max(
      scheduleSettings?.maxLessonsPerDay || 7,
      (scheduleSettings?.secondShiftMaxLessonsPerDay || 6) + (shiftStartLesson[2] || 4) - 1,
      8
    );
  }, [scheduleSettings, shiftStartLesson]);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Загрузка расписания...</p>
    </div>
  );

  const daysList = DAYS;

  return (
    <div className={`schedule-viewer-page ${isEditMode ? 'edit-mode-active' : ''}`}>
      {!isEditMode && <ThemeToggle />}
      {!isEditMode && <BackButton />}
      {!isEditMode && <Header />}
      
      <div className="schedule-viewer-container full-width">
        {/* Панель управления */}
        <div className="top-controls-panel">
          <div className="filter-buttons">
            <button className={`filter-btn ${classGroup === 'all' ? 'active' : ''}`} onClick={() => setClassGroup('all')}>
              Все классы
            </button>
            <button className={`filter-btn ${classGroup === '1-4-first' ? 'active' : ''}`} onClick={() => setClassGroup('1-4-first')}>
              1-4 класс (1 смена)
            </button>
            <button className={`filter-btn ${classGroup === '1-4-second' ? 'active' : ''}`} onClick={() => setClassGroup('1-4-second')}>
              1-4 класс (2 смена)
            </button>
            <button className={`filter-btn ${classGroup === '5-11-first' ? 'active' : ''}`} onClick={() => setClassGroup('5-11-first')}>
              5-11 класс (1 смена)
            </button>
            <button className={`edit-mode-btn ${isEditMode ? 'active' : ''}`} onClick={() => setIsEditMode(!isEditMode)}>
              <FaEdit /> {isEditMode ? 'Выйти из редактирования' : 'Режим редактирования'}
            </button>
            {isEditMode && (
              <>
                <button className={`filter-btn ${hasUnsavedChanges ? 'unsaved' : ''}`} onClick={saveDraft} disabled={saving}>
                  <FaSave /> {saving ? 'Сохранение...' : 'Сохранить черновик'}
                </button>
                <button className="filter-btn publish" onClick={publishSchedule} disabled={saving}>
                  <FaCloudUploadAlt /> Опубликовать
                </button>
              </>
            )}
            <button className="filter-btn history" onClick={() => setVersionHistoryOpen(true)}>
              <FaHistory /> История версий
            </button>
          </div>
          
          <div className="action-buttons">
            <div className="search-wrapper">
              <FaSearch />
              <input 
                type="text" 
                placeholder="Поиск класса..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <button className="action-btn" onClick={exportToExcel}><FaFileExcel /> Экспорт</button>
            <button className="action-btn" onClick={handlePrint}><FaPrint /> Печать</button>
          </div>
        </div>

        {/* Панель конфликтов (скрыта) */}
        {isEditMode && (
          <ConflictsPanel 
            conflicts={conflicts}
            isEditMode={isEditMode}
            isOpen={conflictsPanelOpen}
            onToggle={() => setConflictsPanelOpen(!conflictsPanelOpen)}
          />
        )}
        
        {/* Таблица расписания */}
        <div ref={tableWrapperRef} className="schedule-table-wrapper full-width-table">
          <table className="unified-schedule-table full-width">
            <thead>
              <tr>
                <th className="day-col-header">День</th>
                <th className="lesson-num-header">№</th>
                <th className="time-col-header">Время</th>
                {filteredClasses.map(c => (
                  <th key={c.name} className="class-col">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daysList.map((day, dayIndex) => {
                return [...Array(maxTotalLessons)].map((_, slotIdx) => {
                  const lessonNumber = slotIdx + 1;
                  const isFirstRow = slotIdx === 0;
                  const time = getClassLessonTime(filteredClasses[0]?.name || '', lessonNumber);
                  
                  return (
                    <tr key={`${day}-${lessonNumber}`}>
                      {isFirstRow && (
                        <td className="day-cell" rowSpan={maxTotalLessons}>
                          <div className="day-name-wrapper">
                            <span className="day-full-name">{FULL_DAYS[dayIndex]}</span>
                            <span className="day-short-name">{day}</span>
                          </div>
                        </td>
                      )}
                      <td className="lesson-number-cell">{lessonNumber}</td>
                      <td className="lesson-time-cell">{time || (lessonNumber === 1 ? "08:00" : time)}</td>
                      {filteredClasses.map(classItem => {
                        const shift = classShifts[classItem.name] || 1;
                        const startOffset = shiftStartLesson[shift] || 1;
                        const shouldShow = shouldShowLessonForClass(classItem.name, lessonNumber);
                        
                        if (!shouldShow) {
                          return <td key={`${classItem.name}-${day}-${lessonNumber}`} className="lesson-cell empty-cell">—</td>;
                        }
                        
                        const actualLessonNumber = lessonNumber - startOffset + 1;
                        const lesson = getLessonForCell(classItem.name, day, actualLessonNumber);
                        const isDragOver = dragOverCell === `${classItem.name}|${day}|${actualLessonNumber}`;
                        const teacherColor = lesson?.teacherColor || (lesson?.teacher ? teacherColors[lesson.teacher] : null);
                        
                        return (
                          <td 
                            key={`${classItem.name}-${day}-${lessonNumber}`} 
                            className={`lesson-cell ${isDragOver ? 'drag-over' : ''}`}
                            data-class={classItem.name}
                            data-day={day}
                            data-lesson={actualLessonNumber}
                            onDragOver={handleDragOver}
                            onDragEnter={(e) => handleDragEnter(e, classItem.name, day, actualLessonNumber)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, classItem.name, day, actualLessonNumber)}
                          >
                            {lesson ? (
                              <LessonCard 
                                lesson={lesson} 
                                teacherColor={teacherColor}
                                onEdit={() => handleEditLesson(classItem.name, day, actualLessonNumber, lesson)}
                                onDelete={() => handleDeleteLesson(classItem.name, day, actualLessonNumber)}
                                isDraggable={isEditMode}
                                lessonNumber={actualLessonNumber}
                                className={classItem.name}
                                day={day}
                                onCopy={handleCopyLesson}
                                onPaste={() => handlePasteLesson(classItem.name, day, actualLessonNumber)}
                                canPaste={!!copiedLesson}
                              />
                            ) : (
                              <div className={`empty-slot-add ${!isEditMode ? 'disabled' : ''}`} onClick={() => {
                                if (isEditMode) handleEditLesson(classItem.name, day, actualLessonNumber, null);
                              }}>
                                {isEditMode && <FaPlus />}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
        
        {/* Подсказки */}
        <div className="tips-footer">
          {isEditMode ? (
            <>
              <div className="tip"><FaGripVertical /> Перетащите карточку для перемещения</div>
              <div className="tip"><FaCopy /> Копируйте и вставляйте уроки</div>
              <div className="tip"><FaSave /> Сохраняйте черновики перед публикацией</div>
            </>
          ) : (
            <div className="tip"><FaInfoCircle /> Включите режим редактирования для изменения расписания</div>
          )}
        </div>
      </div>
      
      {!isEditMode && <Footer />}
      
      {/* Модальные окна */}
      <EditLessonModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveLesson}
        lesson={editingLesson}
        subjects={subjects}
        teachers={teachers}
        rooms={rooms}
      />
      
      <VersionHistoryModal
        isOpen={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
        versions={versions}
        onLoadVersion={loadVersion}
        onPublishVersion={() => {}}
        currentVersionId={currentVersionId}
      />
      
      {/* Уведомления */}
      <div className="toast-container">
        {toasts.map(toast => (
          <ToastNotification 
            key={toast.id} 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}
      </div>
    </div>
  );
};

export default ScheduleViewer;