// ScheduleViewer.jsx - Административная панель с расписанием всей школы
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FaCalendar, FaEdit, FaSave, FaTimes, FaPrint, 
  FaFilter, FaSearch, FaArrowLeft, FaPlus, FaTrash, 
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

const TIME_SLOTS = [
  { number: 1, start: '08:30', end: '09:15' },
  { number: 2, start: '09:25', end: '10:10' },
  { number: 3, start: '10:20', end: '11:05' },
  { number: 4, start: '11:20', end: '12:05' },
  { number: 5, start: '12:15', end: '13:00' },
  { number: 6, start: '13:10', end: '13:55' },
  { number: 7, start: '14:05', end: '14:50' }
];

const SUBJECT_COLORS = {
  'Математика': '#4CAF50', 'Русский язык': '#2196F3', 'Литература': '#9C27B0',
  'Английский язык': '#FF9800', 'Физкультура': '#F44336', 'История': '#795548',
  'Биология': '#8BC34A', 'Химия': '#009688', 'Физика': '#FF5722',
  'География': '#3F51B5', 'Информатика': '#E91E63', 'Обществознание': '#607D8B'
};

const getSubjectColor = (subject) => SUBJECT_COLORS[subject] || '#9E9E9E';

const ScheduleViewer = () => {
  const navigate = useNavigate();
  
  // Режимы: 'single' - один класс, 'all' - все классы
  const [viewMode, setViewMode] = useState('all');
  const [selectedClass, setSelectedClass] = useState('5А');
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
  
  // Генерация дефолтного расписания для одного класса
  const getDefaultSchedule = useCallback(() => {
    const schedule = {};
    DAYS.forEach(day => {
      schedule[day] = {};
      TIME_SLOTS.forEach(slot => {
        const num = slot.number;
        if (num === 1) {
          schedule[day][num] = { subject: 'Математика', teacher: 'Иванова А.П.', room: '201' };
        } else if (num === 2) {
          schedule[day][num] = { subject: 'Русский язык', teacher: 'Петрова С.И.', room: '305' };
        } else if (num === 3) {
          schedule[day][num] = { subject: 'Литература', teacher: 'Сидорова О.В.', room: '208' };
        } else if (num === 4) {
          schedule[day][num] = { subject: 'Английский язык', teacher: 'Смирнова Е.А.', room: '401' };
        } else if (num === 5) {
          schedule[day][num] = { subject: 'История', teacher: 'Федоров П.К.', room: '312' };
        } else if (num === 6) {
          schedule[day][num] = { subject: 'Биология', teacher: 'Николаева М.В.', room: 'Лаборатория' };
        } else {
          schedule[day][num] = null;
        }
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
  
  // Сохранение в localStorage
  const saveToLocalStorage = useCallback((newSchedules) => {
    localStorage.setItem('school_schedules', JSON.stringify(newSchedules));
  }, []);
  
  // Сохранение в историю
  const saveToHistory = useCallback((newSchedules) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newSchedules)));
      return newHistory.slice(-30);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 29));
  }, [historyIndex]);
  
  // Обновление расписания
  const updateSchedules = useCallback((newSchedules) => {
    setSchedules(newSchedules);
    saveToLocalStorage(newSchedules);
    saveToHistory(newSchedules);
  }, [saveToLocalStorage, saveToHistory]);
  
  // Обновление урока
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
    updateLesson(className, day, slotNum, { ...editValue });
    setEditingCell(null);
  };
  
  const deleteLesson = (className, day, slotNum) => {
    if (!editMode) return;
    if (window.confirm('Удалить этот урок?')) {
      updateLesson(className, day, slotNum, null);
    }
  };
  
  const handleDragStart = (e, className, day, slotNum, lesson) => {
    if (!editMode) return;
    e.dataTransfer.setData('text/plain', JSON.stringify({ className, day, slotNum, lesson }));
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e, targetClass, targetDay, targetSlot) => {
    e.preventDefault();
    if (!editMode) return;
    
    const sourceData = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (!sourceData) return;
    
    const sourceLesson = schedules[sourceData.className]?.[sourceData.day]?.[sourceData.slotNum];
    if (!sourceLesson) return;
    
    updateLesson(sourceData.className, sourceData.day, sourceData.slotNum, null);
    updateLesson(targetClass, targetDay, targetSlot, sourceLesson);
  };
  
  const exportToExcel = () => {
    const data = [];
    
    if (viewMode === 'all') {
      // Экспорт всех классов
      CLASSES.forEach(className => {
        const schedule = schedules[className] || {};
        DAYS.forEach((day, idx) => {
          TIME_SLOTS.forEach(slot => {
            const lesson = schedule[day]?.[slot.number];
            if (lesson) {
              data.push({
                'Класс': className,
                'День': FULL_DAYS[idx],
                'Урок': slot.number,
                'Время': `${slot.start}-${slot.end}`,
                'Предмет': lesson.subject,
                'Учитель': lesson.teacher,
                'Кабинет': lesson.room
              });
            }
          });
        });
      });
    } else {
      // Экспорт одного класса
      const schedule = schedules[selectedClass] || {};
      DAYS.forEach((day, idx) => {
        TIME_SLOTS.forEach(slot => {
          const lesson = schedule[day]?.[slot.number];
          if (lesson) {
            data.push({
              'Класс': selectedClass,
              'День': FULL_DAYS[idx],
              'Урок': slot.number,
              'Время': `${slot.start}-${slot.end}`,
              'Предмет': lesson.subject,
              'Учитель': lesson.teacher,
              'Кабинет': lesson.room
            });
          }
        });
      });
    }
    
    if (data.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Расписание');
    const fileName = viewMode === 'all' ? 'raspisanie_vse_klassy.xlsx' : `raspisanie_${selectedClass}.xlsx`;
    XLSX.writeFile(wb, fileName);
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
  
  const resetClassSchedule = () => {
    if (window.confirm(`Сбросить расписание для ${selectedClass} класса?`)) {
      const newSchedules = JSON.parse(JSON.stringify(schedules));
      newSchedules[selectedClass] = getDefaultSchedule();
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
        
        {/* Переключатель режима просмотра */}
        <div className="view-mode-panel">
          <button 
            className={`view-mode-btn ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            <FaUsers /> Все классы
          </button>
          <button 
            className={`view-mode-btn ${viewMode === 'single' ? 'active' : ''}`}
            onClick={() => setViewMode('single')}
          >
            <FaChalkboardTeacher /> Один класс
          </button>
        </div>
        
        {viewMode === 'single' && (
          <div className="class-selector-panel">
            <div className="class-selector-header">
              <FaChalkboardTeacher />
              <span>Выберите класс:</span>
            </div>
            <div className="class-grid">
              {CLASSES.map(className => (
                <button
                  key={className}
                  className={`class-card ${selectedClass === className ? 'active' : ''}`}
                  onClick={() => setSelectedClass(className)}
                >
                  <span className="class-name">{className}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Панель управления */}
        <div className="control-bar">
          <div className="class-info">
            <h2>
              <FaSchool /> 
              {viewMode === 'all' ? 'Расписание всех классов' : `${selectedClass} класс`}
            </h2>
          </div>
          
          <div className="action-buttons">
            {editMode && (
              <>
                <button className="btn btn-secondary" onClick={undo} title="Отменить">
                  <FaUndo />
                </button>
                <button className="btn btn-secondary" onClick={redo} title="Вернуть">
                  <FaRedo />
                </button>
              </>
            )}
            
            <button className={`btn ${editMode ? 'btn-warning' : 'btn-primary'}`} onClick={() => setEditMode(!editMode)}>
              {editMode ? <FaLock /> : <FaUnlock />}
              {editMode ? 'Закрыть' : 'Редактировать'}
            </button>
            
            {editMode && viewMode === 'single' && (
              <button className="btn btn-danger" onClick={resetClassSchedule}>
                <FaSync /> Сброс класса
              </button>
            )}
            
            <button className="btn btn-secondary" onClick={exportToExcel}>
              <FaFileExcel /> Excel
            </button>
            <button className="btn btn-secondary" onClick={() => window.print()}>
              <FaPrint /> Печать
            </button>
          </div>
        </div>
        
        {/* Поиск и фильтры */}
        <div className="search-panel">
          <div className="search-wrapper">
            <FaSearch />
            <input
              type="text"
              placeholder="Поиск по предмету, учителю или кабинету..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                <FaTimes />
              </button>
            )}
          </div>
          <div className="filters">
            <label className="filter-chip">
              <input type="checkbox" checked={showTeachers} onChange={(e) => setShowTeachers(e.target.checked)} />
              Учителя
            </label>
            <label className="filter-chip">
              <input type="checkbox" checked={showRooms} onChange={(e) => setShowRooms(e.target.checked)} />
              Кабинеты
            </label>
          </div>
        </div>
        
        {/* Расписание */}
        <div className="schedule-content">
          {viewMode === 'all' ? (
            // Режим "Все классы" - каждый класс показывается отдельной таблицей
            CLASSES.map(className => {
              const schedule = schedules[className] || {};
              const lessonsCount = Object.values(schedule).reduce((sum, day) => sum + Object.keys(day).length, 0);
              
              return (
                <div key={className} className="class-schedule-card">
                  <div className="class-schedule-header">
                    <h3><FaChalkboardTeacher /> {className} класс</h3>
                    <span className="lesson-count-badge">{lessonsCount} уроков</span>
                  </div>
                  
                  <div className="schedule-table-wrapper">
                    <table className="schedule-table">
                      <thead>
                        <tr>
                          <th className="time-col">Урок</th>
                          {DAYS.map((day, idx) => (
                            <th key={day} className="day-col">
                              <div className="day-header">
                                <span className="day-short">{day}</span>
                                <span className="day-full">{FULL_DAYS[idx]}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {TIME_SLOTS.map((slot) => (
                          <tr key={slot.number}>
                            <td className="time-cell">
                              <div className="time-info">
                                <span className="slot-num">{slot.number}</span>
                                <span className="slot-time">{slot.start}-{slot.end}</span>
                              </div>
                            </td>
                            
                            {DAYS.map((day) => {
                              const lesson = schedule[day]?.[slot.number];
                              const matchesSearch = lesson && isMatchSearch(lesson);
                              
                              return (
                                <td
                                  key={`${className}-${day}-${slot.number}`}
                                  className={`lesson-cell ${editMode ? 'edit-mode' : ''} ${matchesSearch ? 'highlight' : ''}`}
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, className, day, slot.number)}
                                  onClick={() => editMode && startEdit(className, day, slot.number, lesson)}
                                >
                                  {lesson ? (
                                    <div
                                      className={`lesson-card ${editMode ? 'draggable' : ''}`}
                                      draggable={editMode}
                                      onDragStart={(e) => handleDragStart(e, className, day, slot.number, lesson)}
                                      style={{ borderLeftColor: getSubjectColor(lesson.subject) }}
                                    >
                                      {editMode && <div className="drag-icon"><FaGripVertical /></div>}
                                      <div className="lesson-subject">{lesson.subject}</div>
                                      {showTeachers && (
                                        <div className="lesson-teacher">
                                          <FaGraduationCap /> {lesson.teacher}
                                        </div>
                                      )}
                                      {showRooms && (
                                        <div className="lesson-room">
                                          <FaMapMarkerAlt /> {lesson.room}
                                        </div>
                                      )}
                                      {editMode && (
                                        <button 
                                          className="delete-lesson"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteLesson(className, day, slot.number);
                                          }}
                                        >
                                          <FaTrash />
                                        </button>
                                      )}
                                    </div>
                                  ) : editMode ? (
                                    <div className="empty-slot-add">
                                      <FaPlus />
                                      <span>Добавить</span>
                                    </div>
                                  ) : (
                                    <div className="empty-slot">—</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          ) : (
            // Режим "Один класс"
            (() => {
              const schedule = schedules[selectedClass] || {};
              
              return (
                <div className="single-class-schedule">
                  <div className="schedule-table-wrapper">
                    <table className="schedule-table">
                      <thead>
                        <tr>
                          <th className="time-col">Урок / Время</th>
                          {DAYS.map((day, idx) => (
                            <th key={day} className="day-col">
                              <div className="day-header">
                                <span className="day-short">{day}</span>
                                <span className="day-full">{FULL_DAYS[idx]}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {TIME_SLOTS.map((slot) => (
                          <tr key={slot.number}>
                            <td className="time-cell">
                              <div className="time-info">
                                <span className="slot-num">{slot.number}</span>
                                <span className="slot-time">{slot.start}-{slot.end}</span>
                              </div>
                            </td>
                            
                            {DAYS.map((day) => {
                              const lesson = schedule[day]?.[slot.number];
                              const isEditing = editingCell?.className === selectedClass && 
                                               editingCell?.day === day && 
                                               editingCell?.slotNum === slot.number;
                              const matchesSearch = lesson && isMatchSearch(lesson);
                              
                              return (
                                <td
                                  key={`${selectedClass}-${day}-${slot.number}`}
                                  className={`lesson-cell ${editMode ? 'edit-mode' : ''} ${matchesSearch ? 'highlight' : ''}`}
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, selectedClass, day, slot.number)}
                                  onClick={() => !isEditing && editMode && startEdit(selectedClass, day, slot.number, lesson)}
                                >
                                  {isEditing ? (
                                    <div className="edit-form">
                                      <input
                                        type="text"
                                        placeholder="Предмет"
                                        value={editValue.subject}
                                        onChange={(e) => setEditValue({...editValue, subject: e.target.value})}
                                        autoFocus
                                      />
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
                                      <div className="edit-actions">
                                        <button onClick={saveEdit} className="save-btn-small">Сохранить</button>
                                        <button onClick={() => setEditingCell(null)} className="cancel-btn-small">Отмена</button>
                                      </div>
                                    </div>
                                  ) : lesson ? (
                                    <div
                                      className={`lesson-card ${editMode ? 'draggable' : ''}`}
                                      draggable={editMode}
                                      onDragStart={(e) => handleDragStart(e, selectedClass, day, slot.number, lesson)}
                                      style={{ borderLeftColor: getSubjectColor(lesson.subject) }}
                                    >
                                      {editMode && <div className="drag-icon"><FaGripVertical /></div>}
                                      <div className="lesson-subject">{lesson.subject}</div>
                                      {showTeachers && (
                                        <div className="lesson-teacher">
                                          <FaGraduationCap /> {lesson.teacher}
                                        </div>
                                      )}
                                      {showRooms && (
                                        <div className="lesson-room">
                                          <FaMapMarkerAlt /> {lesson.room}
                                        </div>
                                      )}
                                      {editMode && (
                                        <button 
                                          className="delete-lesson"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteLesson(selectedClass, day, slot.number);
                                          }}
                                        >
                                          <FaTrash />
                                        </button>
                                      )}
                                    </div>
                                  ) : editMode ? (
                                    <div className="empty-slot-add">
                                      <FaPlus />
                                      <span>Добавить урок</span>
                                    </div>
                                  ) : (
                                    <div className="empty-slot">—</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()
          )}
        </div>
        
        {/* Подсказки */}
        {editMode && (
          <div className="admin-tips">
            <div className="tip-item"><FaGripVertical /> Перетащите карточку для перемещения урока</div>
            <div className="tip-item">Нажмите на ячейку для редактирования</div>
            <div className="tip-item">Нажмите на корзину для удаления</div>
            <div className="tip-item"><FaUndo /> <FaRedo /> Отмена и повтор действий</div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default ScheduleViewer;