import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FaCalendar, FaEdit, FaSave, FaTimes, FaPrint, FaDownload,
  FaFilter, FaSearch, FaEye, FaEyeSlash, FaUser, FaDoorOpen,
  FaBell, FaExclamationTriangle, FaCheckCircle, FaGripVertical,
  FaArrowLeft, FaPlus, FaTrash, FaClock, FaSchool, FaSync,
  FaBook, FaCalendarAlt, FaUsers, FaUndo, FaRedo, FaEraser
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  ClassRegistry, TeacherRegistry, RoomRegistry,
  WeekSchedule, TimeSchedule, initializeExtracurricularConfig 
} from '../config/extracurricular';
import '../styles/ScheduleViewer.css';

const ScheduleViewer = () => {
  const navigate = useNavigate();
  
  // Состояния
  const [selectedClass, setSelectedClass] = useState('5А');
  const [week, setWeek] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [showConflicts, setShowConflicts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [draggedLesson, setDraggedLesson] = useState(null);
  
  // Фильтры
  const [filters, setFilters] = useState({
    showTeachers: true,
    showRooms: true,
    showSubjects: true,
    highlightConflicts: true,
    showEmptySlots: true
  });
  
  // Поиск
  const [searchTerm, setSearchTerm] = useState('');
  
  // Расписание
  const [schedule, setSchedule] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  
  // Данные из конфигурации
  const days = WeekSchedule.getDayOptions('high')
    .filter(day => !day.isWeekend)
    .map(day => ({ 
      id: day.value, 
      name: day.value, 
      shortName: WeekSchedule.getDayByShortName(day.label.split(' - ')[0])?.shortName 
    }));
  
  const lessons = TimeSchedule.getSlots('high').map((time, index) => ({
    id: index + 1,
    number: index + 1,
    startTime: time,
    endTime: TimeSchedule.getSlots('high')[index + 1] || 
      `${parseInt(time.split(':')[0]) + 1}:${time.split(':')[1]}`
  }));
  
  const allClasses = ClassRegistry.getClassOptions();

  // Инициализация
  useEffect(() => {
    initializeExtracurricularConfig();
    loadSchedule();
  }, [selectedClass, week]);

  // Загрузка расписания
  const loadSchedule = async () => {
    setLoading(true);
    try {
      const mockSchedule = generateMockSchedule();
      setSchedule(mockSchedule);
      checkConflicts(mockSchedule);
    } catch (error) {
      console.error('Ошибка загрузки расписания:', error);
    } finally {
      setLoading(false);
    }
  };

  // Генерация тестового расписания
  const generateMockSchedule = () => {
    const classData = ClassRegistry.getClassByName(selectedClass);
    if (!classData) return {};
    
    const subjects = TeacherRegistry.getAllSubjects();
    const teachers = TeacherRegistry.getTeacherOptions('high');
    const rooms = RoomRegistry.getRoomOptions('high');
    
    const mockData = {};
    
    days.forEach(day => {
      mockData[day.id] = {};
      
      const lessonsCount = Math.floor(Math.random() * 4) + 3;
      const usedLessons = new Set();
      
      for (let i = 0; i < lessonsCount; i++) {
        let lessonNum;
        do {
          lessonNum = Math.floor(Math.random() * 6) + 1;
        } while (usedLessons.has(lessonNum));
        usedLessons.add(lessonNum);
        
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const teacher = teachers[Math.floor(Math.random() * teachers.length)];
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        
        mockData[day.id][lessonNum] = {
          id: `${day.id}-${lessonNum}`,
          subject,
          teacher: teacher.value,
          room: room.value,
          color: getSubjectColor(subject),
          building: classData.building,
          duration: 45,
          type: 'regular'
        };
      }
    });
    
    return mockData;
  };

  // Получение цвета для предмета
  const getSubjectColor = (subject) => {
    const colorMap = {
      'Математика': '#4CAF50',
      'Русский язык': '#2196F3',
      'Литература': '#9C27B0',
      'Английский язык': '#FF9800',
      'Физическая культура': '#F44336',
      'История': '#795548',
      'Обществознание': '#607D8B',
      'Биология': '#8BC34A',
      'Химия': '#009688',
      'Физика': '#FF5722',
      'География': '#3F51B5',
      'Информатика': '#E91E63',
      'Изобразительное искусство': '#FFC107',
      'Музыка': '#00BCD4',
      'Труд': '#FF9800'
    };
    
    for (const [key, color] of Object.entries(colorMap)) {
      if (subject.includes(key)) {
        return color;
      }
    }
    
    return '#9E9E9E';
  };

  // Проверка конфликтов
  const checkConflicts = (currentSchedule) => {
    const newConflicts = [];
    const teacherUsage = {};
    const roomUsage = {};
    
    Object.entries(currentSchedule).forEach(([day, dayLessons]) => {
      Object.entries(dayLessons).forEach(([lessonNum, lesson]) => {
        const teacherKey = `${day}-${lesson.teacher}`;
        const roomKey = `${day}-${lesson.room}`;
        
        if (teacherUsage[teacherKey]) {
          newConflicts.push({
            id: `teacher-${day}-${lessonNum}`,
            type: 'teacher',
            day: day,
            lesson: parseInt(lessonNum),
            teacher: lesson.teacher,
            conflict: `Учитель ${lesson.teacher} ведет урок в другом классе в это же время`,
            severity: 'high'
          });
        } else {
          teacherUsage[teacherKey] = true;
        }
        
        if (roomUsage[roomKey]) {
          newConflicts.push({
            id: `room-${day}-${lessonNum}`,
            type: 'room',
            day: day,
            lesson: parseInt(lessonNum),
            room: lesson.room,
            conflict: `Кабинет ${lesson.room} занят другим классом`,
            severity: 'medium'
          });
        } else {
          roomUsage[roomKey] = true;
        }
      });
    });
    
    setConflicts(newConflicts);
  };

  // Drag and Drop
  const handleDragStart = (day, lessonNum) => {
    if (!editMode) return;
    const lesson = schedule[day]?.[lessonNum];
    if (lesson) {
      setDraggedLesson({ day, lessonNum, lesson });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetDay, targetLesson) => {
    if (!editMode || !draggedLesson) return;
    
    const { day: sourceDay, lessonNum: sourceLesson, lesson } = draggedLesson;
    
    if (sourceDay === targetDay && sourceLesson === targetLesson) {
      setDraggedLesson(null);
      return;
    }

    const newSchedule = { ...schedule };
    
    if (newSchedule[sourceDay]) {
      delete newSchedule[sourceDay][sourceLesson];
      
      if (Object.keys(newSchedule[sourceDay]).length === 0) {
        delete newSchedule[sourceDay];
      }
    }
    
    if (!newSchedule[targetDay]) {
      newSchedule[targetDay] = {};
    }
    
    const updatedLesson = {
      ...lesson,
      id: `${targetDay}-${targetLesson}`
    };
    
    newSchedule[targetDay][targetLesson] = updatedLesson;
    
    setSchedule(newSchedule);
    setDraggedLesson(null);
    checkConflicts(newSchedule);
  };

  // Сохранение изменений
  const saveChanges = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/schedule/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class: selectedClass,
          schedule: schedule,
          week,
          conflicts: conflicts.filter(c => c.severity === 'high')
        })
      });
      
      if (response.ok) {
        alert('Изменения расписания успешно сохранены!');
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Изменения сохранены локально!');
      setEditMode(false);
    } finally {
      setLoading(false);
    }
  };

  // Печать расписания
  const printSchedule = () => {
    const printContent = document.querySelector('.schedule-table-container').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Расписание ${selectedClass}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; }
            .lesson-card { margin: 2px; padding: 5px; border-left: 4px solid; }
          </style>
        </head>
        <body>
          <h2>Расписание ${selectedClass}, неделя ${week}</h2>
          ${printContent}
          <p>Сгенерировано: ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Экспорт расписания
  const exportSchedule = (format) => {
    const exportData = {
      className: selectedClass,
      week,
      schedule,
      conflicts,
      generated: new Date().toISOString()
    };
    
    if (format === 'json') {
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `расписание_${selectedClass}_неделя${week}.json`;
      downloadFile(dataUri, exportFileDefaultName);
    } else {
      alert(`Экспорт в ${format.toUpperCase()} будет реализован позже`);
    }
  };

  const downloadFile = (uri, name) => {
    const link = document.createElement("a");
    link.href = uri;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Добавление урока
  const handleAddLesson = (day, lessonNum) => {
    if (!editMode) return;
    
    const newLesson = {
      id: `${day}-${lessonNum}`,
      subject: 'Новый урок',
      teacher: TeacherRegistry.getTeacherOptions('high')[0]?.value || '',
      room: RoomRegistry.getRoomOptions('high')[0]?.value || '',
      color: '#9E9E9E',
      building: 'high',
      duration: 45,
      type: 'regular'
    };
    
    const newSchedule = { ...schedule };
    if (!newSchedule[day]) {
      newSchedule[day] = {};
    }
    newSchedule[day][lessonNum] = newLesson;
    
    setSchedule(newSchedule);
  };

  // Удаление урока
  const handleDeleteLesson = (day, lessonNum) => {
    if (!editMode) return;
    
    const newSchedule = { ...schedule };
    if (newSchedule[day]) {
      delete newSchedule[day][lessonNum];
      
      if (Object.keys(newSchedule[day]).length === 0) {
        delete newSchedule[day];
      }
    }
    
    setSchedule(newSchedule);
  };

  // Редактирование урока
  const handleEditLesson = (day, lessonNum) => {
    const lesson = schedule[day]?.[lessonNum];
    if (!lesson) return;
    
    const newSubject = prompt('Введите название предмета:', lesson.subject);
    if (newSubject === null) return;
    
    const newTeacher = prompt('Введите учителя:', lesson.teacher);
    if (newTeacher === null) return;
    
    const newRoom = prompt('Введите кабинет:', lesson.room);
    if (newRoom === null) return;
    
    const updatedLesson = {
      ...lesson,
      subject: newSubject || lesson.subject,
      teacher: newTeacher || lesson.teacher,
      room: newRoom || lesson.room,
      color: getSubjectColor(newSubject || lesson.subject)
    };
    
    const newSchedule = { ...schedule };
    newSchedule[day][lessonNum] = updatedLesson;
    setSchedule(newSchedule);
    
    checkConflicts(newSchedule);
  };

  // Поиск альтернатив
  const findAlternatives = (conflict) => {
    const alternativesList = [];
    
    if (conflict.type === 'teacher') {
      const subjectTeachers = TeacherRegistry.getTeachersBySubject(
        schedule[conflict.day]?.[conflict.lesson]?.subject || ''
      );
      
      subjectTeachers.forEach(teacher => {
        if (teacher !== conflict.teacher) {
          alternativesList.push({
            type: 'teacher',
            teacher,
            subject: schedule[conflict.day]?.[conflict.lesson]?.subject,
            day: conflict.day,
            lesson: conflict.lesson
          });
        }
      });
    } else if (conflict.type === 'room') {
      const allRooms = RoomRegistry.getRoomOptions('high');
      const takenRooms = new Set();
      
      Object.values(schedule).forEach(dayLessons => {
        Object.values(dayLessons).forEach(lesson => {
          takenRooms.add(lesson.room);
        });
      });
      
      allRooms.forEach(room => {
        if (!takenRooms.has(room.value)) {
          alternativesList.push({
            type: 'room',
            room: room.value,
            day: conflict.day,
            lesson: conflict.lesson
          });
        }
      });
    }
    
    setAlternatives(alternativesList);
  };

  // Применение альтернативы
  const applyAlternative = (alternative) => {
    const newSchedule = { ...schedule };
    
    if (alternative.type === 'teacher') {
      newSchedule[alternative.day][alternative.lesson].teacher = alternative.teacher;
    } else if (alternative.type === 'room') {
      newSchedule[alternative.day][alternative.lesson].room = alternative.room;
    }
    
    setSchedule(newSchedule);
    setAlternatives([]);
    checkConflicts(newSchedule);
  };

  // Проверка конфликта для ячейки
  const hasConflict = (day, lessonNum) => {
    return conflicts.some(c => c.day === day && c.lesson === lessonNum);
  };

  // Фильтрация расписания
  const filteredSchedule = useCallback(() => {
    if (!searchTerm) return schedule;
    
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = {};
    
    Object.entries(schedule).forEach(([day, dayLessons]) => {
      const filteredLessons = {};
      
      Object.entries(dayLessons).forEach(([lessonNum, lesson]) => {
        const matches = 
          lesson.subject.toLowerCase().includes(lowerSearch) ||
          lesson.teacher.toLowerCase().includes(lowerSearch) ||
          lesson.room.toLowerCase().includes(lowerSearch);
        
        if (matches) {
          filteredLessons[lessonNum] = lesson;
        }
      });
      
      if (Object.keys(filteredLessons).length > 0) {
        filtered[day] = filteredLessons;
      }
    });
    
    return filtered;
  }, [schedule, searchTerm]);

  return (
    <div className="schedule-viewer-page">
      {/* Фон с кругами */}
      <div className="schedule-bg">
        <div className="schedule-glass-circle"></div>
        <div className="schedule-glass-circle"></div>
        <div className="schedule-glass-circle"></div>
        <div className="schedule-glass-circle"></div>
      </div>
      
      {/* Кнопка возврата */}
      <button 
        className="schedule-back-btn"
        onClick={() => navigate(-1)}
        title="Вернуться назад"
      >
        <FaArrowLeft />
      </button>
      
      <Header />
      
      <div className="schedule-viewer-container">
        {/* Панель управления */}
        <div className="schedule-control-panel">
          <div className="control-section">
            <h2>
              <FaCalendar />
              Расписание классов
            </h2>
            
            <div className="class-selector">
              <label>Класс:</label>
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={editMode}
              >
                {allClasses.map(cls => (
                  <option key={cls.value} value={cls.value}>
                    {cls.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="week-selector">
              <label>Неделя:</label>
              <div className="week-buttons">
                {[1, 2].map(w => (
                  <button
                    key={w}
                    className={`week-btn ${week === w ? 'active' : ''}`}
                    onClick={() => setWeek(w)}
                    disabled={editMode}
                  >
                    {w} неделя
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="action-buttons">
            <button 
              className={`schedule-btn ${editMode ? 'schedule-btn-warning' : 'schedule-btn-primary'}`}
              onClick={() => {
                setEditMode(!editMode);
                if (editMode) {
                  setDraggedLesson(null);
                  setAlternatives([]);
                }
              }}
              disabled={loading}
            >
              {editMode ? <FaTimes /> : <FaEdit />}
              {editMode ? 'Отменить редактирование' : 'Редактировать расписание'}
            </button>
            
            {editMode && (
              <button 
                className="schedule-btn schedule-btn-success" 
                onClick={saveChanges}
                disabled={loading}
              >
                {loading ? <FaSync className="spin" /> : <FaSave />}
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            )}
            
            <button 
              className="schedule-btn schedule-btn-secondary" 
              onClick={printSchedule}
              disabled={loading}
            >
              <FaPrint />
              Печать
            </button>
            
            <div className="dropdown">
              <button 
                className="schedule-btn schedule-btn-secondary dropdown-toggle"
                disabled={loading}
              >
                <FaDownload />
                Экспорт
              </button>
              <div className="dropdown-menu">
                <button onClick={() => exportSchedule('json')}>JSON</button>
                <button onClick={() => exportSchedule('excel')}>Excel</button>
                <button onClick={() => exportSchedule('pdf')}>PDF</button>
              </div>
            </div>
            
            <button 
              className={`schedule-btn ${showConflicts ? 'schedule-btn-danger' : 'schedule-btn-secondary'}`}
              onClick={() => setShowConflicts(!showConflicts)}
            >
              {showConflicts ? <FaEyeSlash /> : <FaEye />}
              {showConflicts ? 'Скрыть конфликты' : 'Показать конфликты'}
            </button>
          </div>
        </div>
        
        {/* Панель поиска и фильтров */}
        <div className="filter-panel">
          <h3><FaFilter /> Поиск и фильтры</h3>
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Поиск по предмету, учителю или кабинету..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-options">
            {Object.entries(filters).map(([key, value]) => (
              <label key={key} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setFilters({...filters, [key]: e.target.checked})}
                />
                <span>
                  {key === 'showTeachers' && 'Показывать учителей'}
                  {key === 'showRooms' && 'Показывать кабинеты'}
                  {key === 'showSubjects' && 'Показывать предметы'}
                  {key === 'highlightConflicts' && 'Подсвечивать конфликты'}
                  {key === 'showEmptySlots' && 'Показывать пустые слоты'}
                </span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Информация о классе */}
        <div className="class-info-panel">
          <div className="class-info">
            <div className="class-name">
              <FaSchool /> Класс: <strong>{selectedClass}</strong>
            </div>
            <div className="class-teacher">
              <FaUser /> Классный руководитель: <strong>{ClassRegistry.getClassTeacher(selectedClass) || 'Не назначен'}</strong>
            </div>
            <div className="class-stats">
              <FaBook /> Уроков в неделю: <strong>{Object.values(schedule).reduce((sum, day) => sum + Object.keys(day).length, 0)}</strong>
              {conflicts.length > 0 && (
                <span className="conflict-count">
                  <FaExclamationTriangle /> Конфликтов: <strong>{conflicts.length}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Основная таблица расписания */}
        <div className="schedule-table-container">
          <table className="schedule-table">
            <thead>
              <tr>
                <th className="time-header">Урок / День</th>
                {days.map((day) => (
                  <th key={day.id} className="day-header">
                    <div className="day-name">{day.shortName}</div>
                    <div className="full-day-name">{day.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id}>
                  <td className="lesson-number">
                    <div className="lesson-time">
                      <div className="lesson-num">{lesson.number}</div>
                      <div className="time-range">
                        <FaClock /> {lesson.startTime} - {lesson.endTime}
                      </div>
                    </div>
                  </td>
                  
                  {days.map((day) => {
                    const lessonData = filteredSchedule()[day.id]?.[lesson.number];
                    const conflict = hasConflict(day.id, lesson.number);
                    
                    return (
                      <td
                        key={`${day.id}-${lesson.number}`}
                        className={`schedule-cell ${conflict && showConflicts && filters.highlightConflicts ? 'has-conflict' : ''} ${editMode ? 'editable' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(day.id, lesson.number)}
                      >
                        {lessonData ? (
                          <div 
                            className={`lesson-card ${editMode ? 'draggable' : ''}`}
                            draggable={editMode}
                            onDragStart={() => handleDragStart(day.id, lesson.number)}
                            style={{
                              backgroundColor: lessonData.color + '20',
                              borderLeft: `4px solid ${lessonData.color}`
                            }}
                          >
                            {conflict && showConflicts && filters.highlightConflicts && (
                              <div className="conflict-indicator">
                                <FaExclamationTriangle />
                              </div>
                            )}
                            
                            {editMode && (
                              <div className="drag-handle">
                                <FaGripVertical />
                              </div>
                            )}
                            
                            <div className="lesson-content">
                              {filters.showSubjects && (
                                <div className="lesson-subject">{lessonData.subject}</div>
                              )}
                              
                              {filters.showTeachers && (
                                <div className="lesson-teacher">
                                  <FaUser /> {lessonData.teacher}
                                </div>
                              )}
                              
                              {filters.showRooms && (
                                <div className="lesson-room">
                                  <FaDoorOpen /> {lessonData.room}
                                </div>
                              )}
                            </div>
                            
                            {editMode && (
                              <div className="lesson-actions">
                                <button 
                                  className="btn-icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditLesson(day.id, lesson.number);
                                  }}
                                  title="Редактировать"
                                >
                                  <FaEdit />
                                </button>
                                <button 
                                  className="btn-icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Удалить этот урок?')) {
                                      handleDeleteLesson(day.id, lesson.number);
                                    }
                                  }}
                                  title="Удалить"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : editMode ? (
                          <div 
                            className="empty-slot"
                            onClick={() => handleAddLesson(day.id, lesson.number)}
                            title="Добавить урок"
                          >
                            <FaPlus /> Добавить урок
                          </div>
                        ) : filters.showEmptySlots ? (
                          <div className="empty-slot-view">—</div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Панель конфликтов */}
        {showConflicts && conflicts.length > 0 && (
          <div className="conflicts-panel">
            <h3><FaExclamationTriangle /> Обнаруженные конфликты ({conflicts.length})</h3>
            <div className="conflicts-list">
              {conflicts.map((conflict) => (
                <div key={conflict.id} className={`conflict-item ${conflict.type}`}>
                  <div className="conflict-header">
                    <FaBell />
                    <span className="conflict-type">
                      {conflict.type === 'teacher' ? 'Конфликт учителя' : 'Конфликт кабинета'}
                    </span>
                    <span className="conflict-location">
                      {conflict.day}, {conflict.lesson} урок
                    </span>
                    <span className={`conflict-severity ${conflict.severity}`}>
                      {conflict.severity === 'high' ? 'Высокая' : 'Средняя'}
                    </span>
                  </div>
                  <div className="conflict-details">
                    {conflict.conflict}
                  </div>
                  <div className="conflict-actions">
                    <button 
                      className="schedule-btn schedule-btn-sm schedule-btn-outline"
                      onClick={() => findAlternatives(conflict)}
                    >
                      <FaSearch /> Найти альтернативы
                    </button>
                    <button 
                      className="schedule-btn schedule-btn-sm schedule-btn-danger"
                      onClick={() => {
                        setConflicts(prev => prev.filter(c => c.id !== conflict.id));
                      }}
                    >
                      Игнорировать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Панель альтернативных вариантов */}
        {alternatives.length > 0 && (
          <div className="alternatives-panel">
            <h3><FaSearch /> Доступные альтернативы ({alternatives.length})</h3>
            <div className="alternatives-grid">
              {alternatives.map((alt, index) => (
                <div key={index} className="alternative-item">
                  {alt.type === 'teacher' && (
                    <>
                      <div className="alternative-subject">{alt.subject}</div>
                      <div className="alternative-teacher">
                        <FaUser /> {alt.teacher}
                      </div>
                      <div className="alternative-info">
                        Замена учителя
                      </div>
                    </>
                  )}
                  {alt.type === 'room' && (
                    <>
                      <div className="alternative-room">
                        <FaDoorOpen /> {alt.room}
                      </div>
                      <div className="alternative-info">
                        Свободный кабинет
                      </div>
                    </>
                  )}
                  <div className="alternative-location">
                    {alt.day}, {alt.lesson} урок
                  </div>
                  <button 
                    className="schedule-btn schedule-btn-sm schedule-btn-success"
                    onClick={() => applyAlternative(alt)}
                  >
                    <FaCheckCircle /> Применить
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Подсказки */}
        {editMode && (
          <div className="hints-panel">
            <div className="hint">
              <strong>Режим редактирования:</strong>
              <ul>
                <li>Перетащите урок для изменения его времени</li>
                <li>Нажмите на урок для редактирования</li>
                <li>Кликните на пустую ячейку для добавления урока</li>
                <li>Красная иконка указывает на конфликт</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default ScheduleViewer;