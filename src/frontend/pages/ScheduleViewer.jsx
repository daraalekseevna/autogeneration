// ScheduleViewer.jsx - финальная версия
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaCalendar, FaEdit, FaSave, FaTimes, FaPrint,
  FaSearch, FaArrowLeft, FaPlus, FaTrash,
  FaClock, FaSchool, FaSync, FaBook, FaGraduationCap,
  FaMapMarkerAlt, FaHourglassHalf, FaSun, FaMoon,
  FaFileExcel, FaChalkboardTeacher, FaRegSave,
  FaLock, FaUnlock, FaGripVertical, FaDownload, FaUpload,
  FaUndo, FaRedo, FaExclamationTriangle, FaUsers
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/ScheduleViewer.css';

// Константы
const CLASSES = ['1А', '1Б', '2А', '2Б', '3А', '3Б', '4А', '4Б', '5А', '5Б', '6А', '6Б', '7А', '7Б', '8А', '8Б', '9А', '9Б', '10А', '10Б', '11А'];
const DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const FULL_DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

// Слоты для первой и второй смены
const SHIFT_SLOTS = {
  first: [
    { number: 1, start: '08:30', end: '09:15' },
    { number: 2, start: '09:25', end: '10:10' },
    { number: 3, start: '10:20', end: '11:05' },
    { number: 4, start: '11:20', end: '12:05' },
    { number: 5, start: '12:15', end: '13:00' }
  ],
  second: [
    { number: 6, start: '13:30', end: '14:15' },
    { number: 7, start: '14:25', end: '15:10' },
    { number: 8, start: '15:20', end: '16:05' },
    { number: 9, start: '16:15', end: '17:00' }
  ]
};

const SUBJECT_COLORS = {
  'Математика': '#4CAF50', 'Русский язык': '#2196F3', 'Литература': '#9C27B0',
  'Английский язык': '#FF9800', 'Физкультура': '#F44336', 'История': '#795548',
  'Биология': '#8BC34A', 'Химия': '#009688', 'Физика': '#FF5722',
  'География': '#3F51B5', 'Информатика': '#E91E63', 'Обществознание': '#607D8B'
};

const getSubjectColor = (subject) => SUBJECT_COLORS[subject] || '#9E9E9E';

const ScheduleViewer = () => {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState({ subject: '', teacher: '', room: '' });
  const [showTeachers, setShowTeachers] = useState(true);
  const [showRooms, setShowRooms] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [dragMode, setDragMode] = useState('lesson'); // 'lesson' или 'field'

  // Генерация дефолтного расписания
  const getDefaultSchedule = useCallback(() => {
    const schedule = {};
    DAYS.forEach(day => {
      schedule[day] = {};
      [...SHIFT_SLOTS.first, ...SHIFT_SLOTS.second].forEach(slot => {
        const num = slot.number;
        if (num === 1) schedule[day][num] = { subject: 'Математика', teacher: 'Иванова А.П.', room: '201' };
        else if (num === 2) schedule[day][num] = { subject: 'Русский язык', teacher: 'Петрова С.И.', room: '305' };
        else if (num === 3) schedule[day][num] = { subject: 'Литература', teacher: 'Сидорова О.В.', room: '208' };
        else if (num === 4) schedule[day][num] = { subject: 'Английский язык', teacher: 'Смирнова Е.А.', room: '401' };
        else if (num === 5) schedule[day][num] = { subject: 'История', teacher: 'Федоров П.К.', room: '312' };
        else if (num === 6) schedule[day][num] = { subject: 'Биология', teacher: 'Николаева М.В.', room: 'Лаборатория' };
        else schedule[day][num] = null;
      });
    });
    return schedule;
  }, []);

  // Загрузка данных
  useEffect(() => {
    const saved = localStorage.getItem('school_schedules');
    if (saved) {
      setSchedules(JSON.parse(saved));
    } else {
      const allSchedules = {};
      CLASSES.forEach(className => {
        allSchedules[className] = getDefaultSchedule();
      });
      setSchedules(allSchedules);
    }
    setLoading(false);
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setIsDarkTheme(true);
      document.body.classList.add('dark-theme');
    }
  }, [getDefaultSchedule]);

  const saveToLocalStorage = useCallback((newSchedules) => {
    localStorage.setItem('school_schedules', JSON.stringify(newSchedules));
  }, []);

  const saveToHistory = useCallback((newSchedules) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newSchedules)));
      return newHistory.slice(-30);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 29));
  }, [historyIndex]);

  const updateSchedules = useCallback((newSchedules) => {
    setSchedules(newSchedules);
    saveToLocalStorage(newSchedules);
    saveToHistory(newSchedules);
  }, [saveToLocalStorage, saveToHistory]);

  const updateLesson = useCallback((className, day, slotNum, lessonData) => {
    const newSchedules = JSON.parse(JSON.stringify(schedules));
    if (!newSchedules[className]) newSchedules[className] = {};
    if (!newSchedules[className][day]) newSchedules[className][day] = {};

    if (lessonData && (lessonData.subject || lessonData.teacher || lessonData.room)) {
      newSchedules[className][day][slotNum] = lessonData;
    } else {
      delete newSchedules[className][day][slotNum];
    }
    updateSchedules(newSchedules);
  }, [schedules, updateSchedules]);

  const updateLessonField = useCallback((className, day, slotNum, field, value) => {
    const newSchedules = JSON.parse(JSON.stringify(schedules));
    if (!newSchedules[className]) newSchedules[className] = {};
    if (!newSchedules[className][day]) newSchedules[className][day] = {};
    const existing = newSchedules[className][day][slotNum] || { subject: '', teacher: '', room: '' };
    existing[field] = value;
    if (existing.subject || existing.teacher || existing.room) {
      newSchedules[className][day][slotNum] = existing;
    }
    updateSchedules(newSchedules);
  }, [schedules, updateSchedules]);

  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    if (newTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  const startEdit = (className, day, slotNum, lesson) => {
    if (!editMode) return;
    setEditingCell({ className, day, slotNum });
    setEditValue({
      subject: lesson?.subject || '',
      teacher: lesson?.teacher || '',
      room: lesson?.room || ''
    });
  };

  const saveEdit = () => {
    if (!editingCell) return;
    const { className, day, slotNum } = editingCell;
    if (editValue.subject || editValue.teacher || editValue.room) {
      updateLesson(className, day, slotNum, { ...editValue });
    } else {
      updateLesson(className, day, slotNum, null);
    }
    setEditingCell(null);
  };

  const deleteLesson = (className, day, slotNum) => {
    if (!editMode) return;
    if (window.confirm('Удалить этот урок?')) {
      updateLesson(className, day, slotNum, null);
    }
  };

  // Drag and drop для целого урока
  const handleDragStart = (e, className, day, slotNum, lesson) => {
    if (!editMode) return;
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'lesson', className, day, slotNum, lesson }));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Drag and drop для полей
  const handleFieldDragStart = (e, className, day, slotNum, field, value) => {
    if (!editMode || dragMode !== 'field') return;
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'field', className, day, slotNum, field, value }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = editMode ? (dragMode === 'field' ? 'copy' : 'move') : 'none';
  };

  const handleDrop = (e, targetClass, targetDay, targetSlot) => {
    e.preventDefault();
    if (!editMode) return;

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;
    const sourceData = JSON.parse(rawData);

    if (sourceData.type === 'lesson') {
      const sourceLesson = schedules[sourceData.className]?.[sourceData.day]?.[sourceData.slotNum];
      if (!sourceLesson) return;
      updateLesson(sourceData.className, sourceData.day, sourceData.slotNum, null);
      updateLesson(targetClass, targetDay, targetSlot, sourceLesson);
    } else if (sourceData.type === 'field' && dragMode === 'field') {
      updateLessonField(targetClass, targetDay, targetSlot, sourceData.field, sourceData.value);
    }
  };

  const exportToExcel = () => {
    const data = [];
    
    // Экспорт 1 смены
    SHIFT_SLOTS.first.forEach(slot => {
      DAYS.forEach((day, dayIdx) => {
        CLASSES.forEach(className => {
          const lesson = schedules[className]?.[day]?.[slot.number];
          if (lesson) {
            data.push({
              'Смена': '1 смена',
              'День': FULL_DAYS[dayIdx],
              'Урок': slot.number,
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
    
    // Экспорт 2 смены
    SHIFT_SLOTS.second.forEach(slot => {
      DAYS.forEach((day, dayIdx) => {
        CLASSES.forEach(className => {
          const lesson = schedules[className]?.[day]?.[slot.number];
          if (lesson) {
            data.push({
              'Смена': '2 смена',
              'День': FULL_DAYS[dayIdx],
              'Урок': slot.number,
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
      alert('Нет данных для экспорта');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Расписание');
    XLSX.writeFile(wb, `raspisanie_vse_smeny.xlsx`);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSchedules(JSON.parse(JSON.stringify(history[newIndex])));
      saveToLocalStorage(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSchedules(JSON.parse(JSON.stringify(history[newIndex])));
      saveToLocalStorage(history[newIndex]);
    }
  };

  const resetAllSchedules = () => {
    if (window.confirm('Сбросить расписание для всех классов?')) {
      const newSchedules = {};
      CLASSES.forEach(className => {
        newSchedules[className] = getDefaultSchedule();
      });
      updateSchedules(newSchedules);
    }
  };

  const isMatchSearch = (lesson) => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    return (lesson.subject?.toLowerCase().includes(lowerSearch) ||
            lesson.teacher?.toLowerCase().includes(lowerSearch) ||
            lesson.room?.toLowerCase().includes(lowerSearch));
  };

  // Компонент таблицы для смены
  const ScheduleTable = ({ shiftName, timeSlots }) => (
    <div className="schedule-table-container">
      <div className="schedule-table-header">
        <h3><span className="shift-title-icon">{shiftName === '1 смена' ? <FaSun /> : <FaMoon />}</span> {shiftName}</h3>
      </div>
      <div className="horizontal-schedule-wrapper">
        <table className="horizontal-schedule-table">
          <thead>
            <tr>
              <th className="day-time-col">День / Урок</th>
              {CLASSES.map(className => (
                <th key={className} className="class-header-col">
                  {className}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <React.Fragment key={day}>
                {timeSlots.map((slot, slotIdx) => (
                  <tr key={`${day}-${slot.number}`}>
                    {slotIdx === 0 && (
                      <td className="day-rowspan-cell" rowSpan={timeSlots.length}>
                        <div className="day-name-cell">
                          <span className="day-name">{FULL_DAYS[DAYS.indexOf(day)]}</span>
                        </div>
                      </td>
                    )}
                    <td className="time-cell">
                      <div className="time-info">
                        <span className="slot-num">{slot.number}</span>
                        <span className="slot-time">{slot.start}–{slot.end}</span>
                      </div>
                    </td>
                    {CLASSES.map(className => {
                      const lesson = schedules[className]?.[day]?.[slot.number];
                      const matchesSearch = lesson && isMatchSearch(lesson);
                      const isEditing = editingCell?.className === className && 
                                       editingCell?.day === day && 
                                       editingCell?.slotNum === slot.number;

                      return (
                        <td
                          key={`${className}-${day}-${slot.number}`}
                          className={`lesson-cell ${editMode ? 'edit-mode' : ''} ${matchesSearch ? 'highlight' : ''}`}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, className, day, slot.number)}
                          onClick={() => !isEditing && editMode && startEdit(className, day, slot.number, lesson)}
                        >
                          {isEditing ? (
                            <div className="inline-edit-form">
                              <input
                                type="text"
                                placeholder="Предмет"
                                value={editValue.subject}
                                onChange={(e) => setEditValue({...editValue, subject: e.target.value})}
                                autoFocus
                              />
                              <div className="inline-edit-row">
                                <input
                                  type="text"
                                  placeholder="Учитель"
                                  value={editValue.teacher}
                                  onChange={(e) => setEditValue({...editValue, teacher: e.target.value})}
                                />
                                <input
                                  type="text"
                                  placeholder="Кабинет"
                                  value={editValue.room}
                                  onChange={(e) => setEditValue({...editValue, room: e.target.value})}
                                />
                              </div>
                              <div className="inline-edit-actions">
                                <button onClick={saveEdit} className="save-inline">✓</button>
                                <button onClick={() => setEditingCell(null)} className="cancel-inline">✗</button>
                              </div>
                            </div>
                          ) : lesson ? (
                            <div
                              className={`lesson-card-horizontal ${editMode && dragMode === 'lesson' ? 'draggable' : ''}`}
                              draggable={editMode && dragMode === 'lesson'}
                              onDragStart={(e) => handleDragStart(e, className, day, slot.number, lesson)}
                              style={{ borderLeftColor: getSubjectColor(lesson.subject) }}
                            >
                              <div className="lesson-header-horizontal">
                                <span className="lesson-subject-horizontal">{lesson.subject}</span>
                                {editMode && (
                                  <button 
                                    className="delete-lesson-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteLesson(className, day, slot.number);
                                    }}
                                  >
                                    <FaTrash />
                                  </button>
                                )}
                              </div>
                              {showTeachers && (
                                <div 
                                  className={`lesson-field-horizontal ${editMode && dragMode === 'field' ? 'draggable-field' : ''}`}
                                  draggable={editMode && dragMode === 'field'}
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    handleFieldDragStart(e, className, day, slot.number, 'teacher', lesson.teacher);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FaGraduationCap /> {lesson.teacher}
                                </div>
                              )}
                              {showRooms && (
                                <div 
                                  className={`lesson-field-horizontal ${editMode && dragMode === 'field' ? 'draggable-field' : ''}`}
                                  draggable={editMode && dragMode === 'field'}
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    handleFieldDragStart(e, className, day, slot.number, 'room', lesson.room);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FaMapMarkerAlt /> {lesson.room}
                                </div>
                              )}
                            </div>
                          ) : editMode ? (
                            <div className="empty-slot-add-horizontal">
                              <FaPlus />
                              <span>Добавить</span>
                            </div>
                          ) : (
                            <div className="empty-slot-horizontal">—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="schedule-viewer-page">
        <div className="animated-bg">
          {[...Array(6)].map((_, i) => <div key={i} className="glass-circle"></div>)}
        </div>
        <Header />
        <div className="loading-container">
          <FaSync className="spin" />
          <span>Загрузка расписания...</span>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`schedule-viewer-page ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
      <div className="animated-bg">
        {[...Array(6)].map((_, i) => <div key={i} className="glass-circle"></div>)}
      </div>

      <button className="schedule-back-btn" onClick={() => navigate(-1)}>
        <FaArrowLeft />
      </button>

      <Header />

      <div className="schedule-viewer-container">
        <div className="theme-toggle">
          <button className="theme-btn" onClick={toggleTheme}>
            {isDarkTheme ? <FaSun /> : <FaMoon />}
            <span>{isDarkTheme ? 'Светлая' : 'Темная'}</span>
          </button>
        </div>

        {/* Компактная панель управления */}
        <div className="compact-control-bar">
          <div className="compact-buttons-group">
            <button className={`compact-btn ${editMode ? 'active' : ''}`} onClick={() => setEditMode(!editMode)}>
              {editMode ? <FaLock /> : <FaUnlock />}
              <span>{editMode ? 'Закрыть' : 'Правка'}</span>
            </button>
            <button className="compact-btn" onClick={undo} disabled={!editMode || historyIndex <= 0}>
              <FaUndo />
            </button>
            <button className="compact-btn" onClick={redo} disabled={!editMode || historyIndex >= history.length - 1}>
              <FaRedo />
            </button>
            <button className="compact-btn" onClick={exportToExcel}>
              <FaFileExcel />
            </button>
            <button className="compact-btn" onClick={() => window.print()}>
              <FaPrint />
            </button>
            <button className="compact-btn compact-btn-danger" onClick={resetAllSchedules}>
              <FaSync /> <span>Сброс всех</span>
            </button>
          </div>
          <div className="compact-filters">
            <div className="compact-search">
              <FaSearch />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && <FaTimes className="compact-clear" onClick={() => setSearchTerm('')} />}
            </div>
            <label className="compact-check">
              <input type="checkbox" checked={showTeachers} onChange={(e) => setShowTeachers(e.target.checked)} />
              <span>Учителя</span>
            </label>
            <label className="compact-check">
              <input type="checkbox" checked={showRooms} onChange={(e) => setShowRooms(e.target.checked)} />
              <span>Кабинеты</span>
            </label>
          </div>
        </div>

        {/* Режим перетаскивания */}
        {editMode && (
          <div className="drag-mode-panel">
            <span>Режим Drag & Drop:</span>
            <button className={`drag-mode-btn ${dragMode === 'lesson' ? 'active' : ''}`} onClick={() => setDragMode('lesson')}>
              <FaGripVertical /> Целый урок
            </button>
            <button className={`drag-mode-btn ${dragMode === 'field' ? 'active' : ''}`} onClick={() => setDragMode('field')}>
              <FaMapMarkerAlt /> Поля (учитель/кабинет)
            </button>
          </div>
        )}

        {/* 1 смена */}
        <ScheduleTable shiftName="1 смена" timeSlots={SHIFT_SLOTS.first} />

        {/* 2 смена */}
        <ScheduleTable shiftName="2 смена" timeSlots={SHIFT_SLOTS.second} />

        {/* Подсказки */}
        {editMode && (
          <div className="admin-tips-compact">
            <span className="tip-compact"><FaGripVertical /> Перетащите карточку для перемещения урока</span>
            <span className="tip-compact"><FaMapMarkerAlt /> Перетащите поле (учитель/кабинет) для копирования</span>
            <span className="tip-compact">Нажмите на ячейку → ручное редактирование</span>
            <span className="tip-compact"><FaUndo /> <FaRedo /> Отмена/повтор</span>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ScheduleViewer;