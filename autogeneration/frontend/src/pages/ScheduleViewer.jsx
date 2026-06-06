// ScheduleViewer.jsx - С ПРАВИЛЬНЫМ ВЫРАВНИВАНИЕМ УРОКОВ ПО СМЕНАМ
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  FaEdit, FaTrash, FaPlus, FaSearch, FaFileExcel, FaPrint, FaGripVertical, FaTimes,
  FaArrowLeft, FaClock, FaUserGraduate, FaDoorOpen, FaCopy, FaPaste,
  FaExclamationTriangle, FaCheckCircle, FaBell, FaSave, FaUpload, FaEye,
  FaGraduationCap, FaChalkboardTeacher, FaChevronDown, FaListAlt,
  FaChevronUp, FaInfoCircle, FaSchool, FaCloudUploadAlt, FaHistory,
  FaSpinner, FaChevronLeft, FaChevronRight, FaUndo, FaRedo, FaSun, FaMoon
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
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

// Кэш для данных
let lessonsCache = null;
let teachersCache = null;
let roomsCache = null;
let scheduleSettingsCache = null;

// Функция для расчета времени урока с учетом перемен
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

const LessonCard = ({ lesson, teacherColor, onEdit, onDelete, isDraggable, onDragStart, onDragEnd, lessonNumber, className, day, onCopy, onPaste, canPaste }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  if (!lesson) return null;
  
  const teacherInitials = getTeacherInitials(lesson.teacher);
  const shortSubject = lesson.subject?.length > 3 ? lesson.subject.substring(0, 3) : lesson.subject;
  const cardColor = teacherColor || '#3b82f6';
  
  return (
    <div 
      className={`lesson-card ${isDraggable ? 'edit-mode draggable' : 'view-mode'}`}
      draggable={isDraggable}
      onDragStart={(e) => isDraggable && onDragStart(e, { lesson, lessonNumber, className, day })}
      onDragEnd={onDragEnd}
      style={{ borderLeftColor: cardColor, backgroundColor: `${cardColor}10` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isDraggable && <div className="drag-icon"><FaGripVertical /></div>}
      <div className="lesson-subject">{shortSubject}</div>
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
};

const EditLessonModal = ({ isOpen, onClose, onSave, lesson, subjects, teachers, rooms }) => {
  const [formData, setFormData] = useState({ subject: '', teacher: '', room: '' });
  const [conflicts, setConflicts] = useState([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (lesson && isOpen) {
      setFormData({
        subject: lesson.subject || '',
        teacher: lesson.teacher || '',
        room: lesson.room || ''
      });
      setConflicts([]);
    }
  }, [lesson, isOpen]);

  const checkConflicts = async () => {
    if (!formData.subject || !formData.teacher || !formData.room) return;
    
    setChecking(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/schedule/check-conflicts`, {
        ...lesson,
        ...formData
      }, { headers: { Authorization: `Bearer ${token}` } });
      setConflicts(response.data.conflicts || []);
    } catch (err) {
      console.error('Error checking conflicts:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (formData.subject && formData.teacher && formData.room) {
      const timeout = setTimeout(checkConflicts, 500);
      return () => clearTimeout(timeout);
    }
  }, [formData]);

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
              {subjects.map(s => <option key={s.id} value={s.name}>{s.name} ({s.shortName})</option>)}
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
              {rooms.map(r => <option key={r.id} value={r.number}>Кабинет {r.number} {r.name && `(${r.name})`}</option>)}
            </select>
          </div>
          
          {conflicts.length > 0 && (
            <div className="conflicts-warning">
              <div className="conflicts-header"><FaExclamationTriangle /> Обнаружены конфликты:</div>
              <ul className="conflicts-list">
                {conflicts.map((c, i) => (
                  <li key={i} className={`conflict-${c.severity}`}>
                    {c.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {checking && <div className="conflicts-checking"><FaSpinner className="spinner" /> Проверка конфликтов...</div>}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn-primary" onClick={handleSave} disabled={checking}>
            <FaSave /> Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

const VersionHistoryModal = ({ isOpen, onClose, versions, onLoadVersion, onPublishVersion, currentVersionId }) => {
  if (!isOpen) return null;

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('ru-RU');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published': return <span className="status-badge published"><FaCheckCircle /> Опубликовано</span>;
      case 'draft': return <span className="status-badge draft"><FaEdit /> Черновик</span>;
      case 'archived': return <span className="status-badge archived"><FaHistory /> Архив</span>;
      default: return <span className="status-badge">{status}</span>;
    }
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
                <th>Версия</th><th>Название</th><th>Дата</th><th>Статус</th><th>Уроков</th><th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {versions.map(v => (
                <tr key={v.id} className={currentVersionId === v.id ? 'current-version' : ''}>
                  <td>v{v.version_number}</td>
                  <td>{v.name || `Черновик ${new Date(v.created_at).toLocaleDateString()}`}</td>
                  <td>{formatDate(v.created_at)}</td>
                  <td>{getStatusBadge(v.status)}</td>
                  <td>{v.lessons_count || 0}</td>
                  <td className="actions">
                    <button onClick={() => onLoadVersion(v)} className="version-btn load" title="Загрузить"><FaEye /></button>
                    {v.status !== 'published' && (
                      <button onClick={() => onPublishVersion(v)} className="version-btn publish" title="Опубликовать"><FaCloudUploadAlt /></button>
                    )}
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

const ScheduleViewer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tableWrapperRef = useRef(null);
  
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
  const [isMoving, setIsMoving] = useState(false);
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

  const token = localStorage.getItem('token');

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const loadScheduleSettings = useCallback(async () => {
    if (scheduleSettingsCache) {
      setScheduleSettings(scheduleSettingsCache);
      return;
    }
    
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/admin/schedule-settings`, config);
      scheduleSettingsCache = res.data;
      setScheduleSettings(res.data);
    } catch (err) {
      console.error('Error loading schedule settings:', err);
      setScheduleSettings({
        startTime: '08:00',
        lessonDuration: 40,
        maxLessonsPerDay: 7,
        shortBreakDuration: 10,
        breaks: [],
        secondShift: false,
        secondShiftStart: '14:00',
        secondShiftLessonDuration: 40,
        secondShiftMaxLessonsPerDay: 6,
        secondShiftShortBreakDuration: 10,
        secondShiftBreaks: []
      });
    }
  }, [token]);

  const loadClassShift = useCallback(async (className) => {
    if (classShifts[className]) return classShifts[className];
    
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/schedule/class-shift/${encodeURIComponent(className)}`, config);
      const shift = res.data.shift || 1;
      setClassShifts(prev => ({ ...prev, [className]: shift }));
      return shift;
    } catch (err) {
      console.error('Error loading class shift:', err);
      return 1;
    }
  }, [token, classShifts]);

  const loadReferenceData = useCallback(async () => {
    if (lessonsCache && teachersCache && roomsCache) {
      setSubjects(lessonsCache);
      setTeachers(teachersCache);
      setRooms(roomsCache);
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [lessonsRes, teachersRes, roomsRes] = await Promise.all([
        axios.get(`${API_URL}/schedule/public-lessons`, config),
        axios.get(`${API_URL}/schedule/public-teachers`, config),
        axios.get(`${API_URL}/schedule/public-rooms`, config)
      ]);
      
      lessonsCache = lessonsRes.data || [];
      teachersCache = teachersRes.data || [];
      roomsCache = roomsRes.data || [];
      
      setSubjects(lessonsCache);
      setTeachers(teachersCache);
      setRooms(roomsCache);
    } catch (err) {
      console.error('Error loading reference data:', err);
    }
  }, [token]);

  const loadVersions = useCallback(async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/schedule/versions`, config);
      setVersions(res.data || []);
    } catch (err) {
      console.error('Error loading versions:', err);
    }
  }, [token]);

  const loadActiveSchedule = useCallback(async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/schedule/active`, config);
      if (res.data?.schedules) {
        setSchedules(res.data.schedules);
        setCurrentVersionId(res.data.version_id);
        setIsDraft(false);
      }
    } catch (err) {
      console.error('Error loading active schedule:', err);
    }
  }, [token]);

  const loadDraftSchedule = useCallback(async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/schedule/draft`, config);
      if (res.data?.schedules) {
        setSchedules(res.data.schedules);
        setCurrentVersionId(res.data.version_id);
        setIsDraft(true);
      } else {
        await loadActiveSchedule();
      }
    } catch (err) {
      console.error('Error loading draft:', err);
      await loadActiveSchedule();
    }
  }, [token, loadActiveSchedule]);

  const loadClasses = useCallback(async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/schedule/viewer/classes`, config);
      setAllClasses(res.data || []);
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  }, [token]);

  const loadTeacherColors = useCallback(async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/schedule/public-teachers`, config);
      const colorsMap = {};
      res.data.forEach(t => { if (t.color) colorsMap[t.name] = t.color; });
      setTeacherColors(colorsMap);
    } catch (err) {
      console.error('Error loading teacher colors:', err);
    }
  }, [token]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        loadReferenceData(),
        loadVersions(),
        loadDraftSchedule(),
        loadClasses(),
        loadTeacherColors(),
        loadScheduleSettings()
      ]);
      setLoading(false);
    };
    loadAll();
  }, [loadReferenceData, loadVersions, loadDraftSchedule, loadClasses, loadTeacherColors, loadScheduleSettings]);

  useEffect(() => {
    if (allClasses.length > 0 && scheduleSettings) {
      allClasses.forEach(async (cls) => {
        await loadClassShift(cls.name);
      });
    }
  }, [allClasses, scheduleSettings, loadClassShift]);

  useEffect(() => {
    if (scheduleSettings) {
      const newCache = {};
      const newStartLesson = {};
      
      newCache['1'] = calculateLessonTimes(scheduleSettings, 1);
      newStartLesson['1'] = 1;
      
      if (scheduleSettings.secondShift) {
        newCache['2'] = calculateLessonTimes(scheduleSettings, 2);
        // Вторая смена начинается с 4 или 5 урока (в зависимости от настроек)
        const firstShiftMax = scheduleSettings.maxLessonsPerDay || 7;
        const secondShiftStart = scheduleSettings.secondShiftStart || '14:00';
        // Определяем с какого урока начинается вторая смена в таблице
        // Например, если первая смена заканчивается на 5 уроке, то вторая начинается с 6
        newStartLesson['2'] = firstShiftMax - (scheduleSettings.secondShiftMaxLessonsPerDay || 6) + 1;
        if (newStartLesson['2'] < 1) newStartLesson['2'] = 1;
      }
      
      setTimeCache(newCache);
      setShiftStartLesson(newStartLesson);
    }
  }, [scheduleSettings]);

  const saveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_URL}/schedule/save-draft`, { schedule: schedules }, config);
      showToast('Черновик сохранён', 'success');
      setHasUnsavedChanges(false);
      await loadVersions();
    } catch (err) {
      console.error('Error saving draft:', err);
      showToast('Ошибка сохранения черновика', 'error');
    } finally {
      setSaving(false);
    }
  }, [schedules, token, showToast, loadVersions]);

  const publishSchedule = useCallback(async () => {
    setSaving(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_URL}/schedule/publish`, { schedule: schedules }, config);
      showToast('Расписание опубликовано', 'success');
      setIsDraft(false);
      setHasUnsavedChanges(false);
      await loadVersions();
      await loadActiveSchedule();
    } catch (err) {
      console.error('Error publishing:', err);
      showToast('Ошибка публикации', 'error');
    } finally {
      setSaving(false);
    }
  }, [schedules, token, showToast, loadVersions, loadActiveSchedule]);

  const loadVersion = useCallback(async (version) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/schedule/version/${version.id}`, config);
      if (res.data?.schedule) {
        setSchedules(res.data.schedule);
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

  const publishVersion = useCallback(async (version) => {
    if (!window.confirm(`Опубликовать версию ${version.name || version.version_number}?`)) return;
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_URL}/schedule/publish-version/${version.id}`, {}, config);
      showToast('Версия опубликована', 'success');
      await loadVersions();
      await loadActiveSchedule();
    } catch (err) {
      console.error('Error publishing version:', err);
      showToast('Ошибка публикации', 'error');
    }
  }, [token, showToast, loadVersions, loadActiveSchedule]);

  const filteredClasses = useMemo(() => {
    let filtered = [...allClasses];
    if (classGroup === '1-4-first') filtered = filtered.filter(c => parseInt(c.number) >= 1 && parseInt(c.number) <= 4 && c.shift === 1);
    else if (classGroup === '1-4-second') filtered = filtered.filter(c => parseInt(c.number) >= 1 && parseInt(c.number) <= 4 && c.shift === 2);
    else if (classGroup === '5-11-first') filtered = filtered.filter(c => parseInt(c.number) >= 5 && parseInt(c.number) <= 11 && c.shift === 1);
    if (searchTerm) filtered = filtered.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    filtered.sort((a, b) => {
      const numA = parseInt(a.number); const numB = parseInt(b.number);
      if (numA !== numB) return numA - numB;
      return (a.letter || '').localeCompare(b.letter || '');
    });
    return filtered;
  }, [allClasses, classGroup, searchTerm]);

  const handleDragStart = (e, dragData) => {
    if (!isEditMode) { e.preventDefault(); return false; }
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  };

  const handleDrop = async (e, targetClass, targetDay, targetLessonNumber) => {
    if (!isEditMode) return;
    e.preventDefault();
    setDragOverCell(null);
    let dragData;
    try { dragData = JSON.parse(e.dataTransfer.getData('text/plain')); } catch { return; }
    if (!dragData?.lesson) return;
    
    const { lesson, lessonNumber: sourceLessonNumber, className: sourceClass, day: sourceDay } = dragData;
    if (sourceClass === targetClass && sourceDay === targetDay && sourceLessonNumber === targetLessonNumber) return;
    
    setIsMoving(true);
    
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
      setHasUnsavedChanges(true);
      return newSchedules;
    });
    
    setIsMoving(false);
  };

  const handleDragOver = (e) => { if (isEditMode) e.preventDefault(); };
  const handleDragEnter = (e, className, day, lessonNumber) => {
    if (isEditMode) {
      e.preventDefault();
      setDragOverCell(`${className}|${day}|${lessonNumber}`);
    }
  };
  const handleDragLeave = () => setDragOverCell(null);

  const updateLesson = (className, day, lessonNumber, lesson) => {
    setSchedules(prev => {
      const newSchedules = JSON.parse(JSON.stringify(prev));
      if (!newSchedules[className]) newSchedules[className] = {};
      if (!newSchedules[className][day]) newSchedules[className][day] = {};
      if (lesson) newSchedules[className][day][lessonNumber] = lesson;
      else delete newSchedules[className][day][lessonNumber];
      setHasUnsavedChanges(true);
      return newSchedules;
    });
    showToast(lesson ? `Урок "${lesson.subject}" сохранён` : 'Урок удалён', 'success');
  };

  const handleCopyLesson = (lesson) => {
    setCopiedLesson(lesson);
    showToast(`Скопирован урок: ${lesson.subject}`, 'info');
  };

  const handlePasteLesson = (targetClass, targetDay, targetLessonNumber) => {
    if (!copiedLesson) { showToast('Нет скопированного урока', 'error'); return; }
    updateLesson(targetClass, targetDay, targetLessonNumber, copiedLesson);
    showToast(`Вставлен урок: ${copiedLesson.subject}`, 'success');
  };

  const handleDelete = (className, day, lessonNumber) => {
    if (window.confirm('Удалить урок?')) {
      updateLesson(className, day, lessonNumber, null);
    }
  };

  const handleEditLesson = (className, day, lessonNumber, lesson) => {
    setEditingCell({ className, day, lessonNumber });
    setEditingLesson(lesson);
    setEditModalOpen(true);
  };

  const handleSaveLesson = (formData) => {
    updateLesson(editingCell.className, editingCell.day, editingCell.lessonNumber, formData);
  };

  const exportToExcel = () => {
    const data = [];
    const daysList = isDraft ? (Object.keys(schedules).length > 0 ? Object.keys(Object.values(schedules)[0] || {}) : DAYS) : DAYS;
    
    for (const className of filteredClasses.map(c => c.name)) {
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
    
    if (data.length === 0) { showToast('Нет данных для экспорта', 'error'); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Расписание');
    XLSX.writeFile(wb, `raspisanie_${new Date().toLocaleDateString()}.xlsx`);
    showToast('Экспорт завершен', 'success');
  };

  const getLessonForCell = (className, day, lessonNumber) => {
    return schedules[className]?.[day]?.[lessonNumber] || null;
  };

  const getClassLessonTime = (className, lessonNumber) => {
    const shift = classShifts[className] || 1;
    const times = timeCache[`${shift}`];
    const startOffset = shiftStartLesson[shift] || 1;
    const actualLessonNumber = lessonNumber - startOffset + 1;
    
    if (times && times[actualLessonNumber]) {
      const time = times[actualLessonNumber];
      return `${time.start}–${time.end}`;
    }
    return shift === 2 ? "14:00–14:40" : "08:00–08:40";
  };

  const getShiftIcon = (shift) => {
    if (shift === 2) return <FaMoon style={{ fontSize: '0.7rem', marginLeft: '4px', color: '#3b82f6' }} />;
    return <FaSun style={{ fontSize: '0.7rem', marginLeft: '4px', color: '#f59e0b' }} />;
  };

  const shouldShowLessonForClass = (className, lessonNumber) => {
    const shift = classShifts[className] || 1;
    const startOffset = shiftStartLesson[shift] || 1;
    const maxLessons = shift === 2 
      ? (scheduleSettings?.secondShiftMaxLessonsPerDay || 6)
      : (scheduleSettings?.maxLessonsPerDay || 7);
    
    return lessonNumber >= startOffset && lessonNumber < startOffset + maxLessons;
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Загрузка расписания...</p>
    </div>
  );

  const daysList = isDraft ? (Object.keys(schedules).length > 0 ? Object.keys(Object.values(schedules)[0] || {}) : DAYS) : DAYS;
  
  const maxTotalLessons = Math.max(
    scheduleSettings?.maxLessonsPerDay || 7,
    (scheduleSettings?.secondShiftMaxLessonsPerDay || 6) + (shiftStartLesson[2] || 4) - 1,
    8
  );

  return (
    <div className={`schedule-viewer-page ${isEditMode ? 'edit-mode-active' : ''}`}>
      {!isEditMode && <ThemeToggle />}
      {!isEditMode && <BackButton />}
      {!isEditMode && <Header />}
      
      <div className="schedule-viewer-container">
        <div className="top-controls-panel">
          <div className="filter-buttons">
            <button className={`filter-btn ${classGroup === 'all' ? 'active' : ''}`} onClick={() => setClassGroup('all')}>Все классы</button>
            <button className={`filter-btn ${classGroup === '1-4-first' ? 'active' : ''}`} onClick={() => setClassGroup('1-4-first')}>1-4 класс (1 смена)</button>
            <button className={`filter-btn ${classGroup === '1-4-second' ? 'active' : ''}`} onClick={() => setClassGroup('1-4-second')}>1-4 класс (2 смена)</button>
            <button className={`filter-btn ${classGroup === '5-11-first' ? 'active' : ''}`} onClick={() => setClassGroup('5-11-first')}>5-11 класс (1 смена)</button>
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
              <input type="text" placeholder="Поиск класса..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button className="action-btn" onClick={exportToExcel}><FaFileExcel /> Экспорт</button>
            <button className="action-btn" onClick={() => window.print()}><FaPrint /> Печать</button>
          </div>
        </div>
        
        <div ref={tableWrapperRef} className="schedule-table-wrapper">
          <table className="unified-schedule-table">
            <thead>
              <tr>
                <th className="day-col-header">День недели</th>
                <th className="lesson-num-header">№</th>
                <th className="time-col-header">Время</th>
                {filteredClasses.map(c => (
                  <th key={c.name} className="class-col">
                    {c.name}
                    {getShiftIcon(classShifts[c.name] || 1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daysList.map((day, dayIndex) => {
                return [...Array(maxTotalLessons)].map((_, slotIdx) => {
                  const lessonNumber = slotIdx + 1;
                  const isFirstRow = slotIdx === 0;
                  
                  // Получаем время для первого класса (как пример для колонки времени)
                  let firstClassTime = "—";
                  const firstClass = filteredClasses[0];
                  if (firstClass && shouldShowLessonForClass(firstClass.name, lessonNumber)) {
                    firstClassTime = getClassLessonTime(firstClass.name, lessonNumber);
                  } else if (firstClass && classShifts[firstClass.name] === 2) {
                    const startOffset = shiftStartLesson[2] || 4;
                    if (lessonNumber >= startOffset && lessonNumber < startOffset + (scheduleSettings?.secondShiftMaxLessonsPerDay || 6)) {
                      firstClassTime = getClassLessonTime(firstClass.name, lessonNumber);
                    }
                  }
                  
                  return (
                    <tr key={`${day}-${lessonNumber}`}>
                      {isFirstRow && (
                        <td className="day-cell" rowSpan={maxTotalLessons}>
                          <div className="day-name-wrapper">
                            <span className="day-full-name">{day}</span>
                            <span className="day-short-name">{day.substring(0, 2)}</span>
                          </div>
                        </td>
                      )}
                      <td className="lesson-number-cell">{lessonNumber}</td>
                      <td className="lesson-time-cell">{firstClassTime}</td>
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
                        const teacherColor = lesson?.teacherColor || (lesson ? teacherColors[lesson.teacher] : null);
                        
                        return (
                          <td 
                            key={`${classItem.name}-${day}-${lessonNumber}`} 
                            className={`lesson-cell ${isDragOver ? 'drag-over' : ''}`}
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
                                onDelete={() => handleDelete(classItem.name, day, actualLessonNumber)}
                                isDraggable={isEditMode}
                                onDragStart={handleDragStart}
                                onDragEnd={() => setDragOverCell(null)}
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
        onPublishVersion={publishVersion}
        currentVersionId={currentVersionId}
      />
      
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