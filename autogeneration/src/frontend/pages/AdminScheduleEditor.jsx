// src/frontend/pages/AdminScheduleEditor.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FaCalendar, FaEdit, FaSave, FaTimes, FaPrint, FaDownload,
  FaFilter, FaSearch, FaEye, FaEyeSlash, FaUser,
  FaBell, FaExclamationTriangle, FaGripVertical,
  FaArrowLeft, FaPlus, FaTrash, FaClock, FaSchool, FaSync,
  FaBook, FaMapMarkerAlt, FaHourglassHalf, FaUsersSlash,
  FaChalkboardTeacher, FaCopy, FaRegSave, FaUndo, FaRedo,
  FaInfoCircle, FaCheck, FaChevronDown, FaThLarge, FaTh,
  FaRegClock, FaUserGraduate, FaBuilding, FaLayerGroup,
  FaChevronLeft, FaChevronRight, FaHome, FaList, FaTable,
  FaFileExcel
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ThemeToggle from '../components/ThemeToggle';
import BackButton from '../components/BackButton';
import { 
  getAllClasses,
  getAllTeachers,
  getAllRooms,
  getAllSubjects,
  getClassByName,
  WeekDays,
  ScheduleTimes
} from '../config/schoolData';
import '../styles/AdminScheduleEditor.css';

const AdminScheduleEditor = () => {
  const navigate = useNavigate();
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = user?.role || 'guest';
  
  useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'superadmin') {
      alert('Доступ запрещен. Только для администраторов.');
      navigate('/');
    }
  }, [userRole, navigate]);
  
  const [selectedView, setSelectedView] = useState('matrix');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [selectedShift, setSelectedShift] = useState('first');
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showConflicts, setShowConflicts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedLesson, setDraggedLesson] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);
  
  const allClasses = getAllClasses();
  const allTeachersList = getAllTeachers();
  const allRoomsList = getAllRooms();
  const allSubjectsList = getAllSubjects();
  
  const [allSchedules, setAllSchedules] = useState({});
  const [originalSchedules, setOriginalSchedules] = useState({});
  const [conflicts, setConflicts] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editForm, setEditForm] = useState({
    subject: '',
    teacher: '',
    room: '',
    duration: 45,
    subgroup: null
  });
  
  const [filters, setFilters] = useState({
    showTeachers: true,
    showRooms: true,
    showSubjects: true,
    highlightConflicts: true,
    showEmptySlots: true
  });
  
  const subjects = allSubjectsList.map(s => s.name);
  const teachers = allTeachersList.map(t => ({ value: t.name, label: `${t.name} (${t.subject})` }));
  const rooms = allRoomsList.map(r => ({ value: r.name, label: r.name }));
  const durations = [30, 45, 60, 90, 120];
  const subgroupOptions = [
    { value: null, label: 'Весь класс' },
    { value: 1, label: '1 подгруппа' },
    { value: 2, label: '2 подгруппа' }
  ];
  
  const allDays = WeekDays.filter(day => !day.isWeekend).map(day => ({ 
    id: day.id, 
    name: day.name, 
    shortName: day.shortName,
    order: day.order
  }));
  
  const firstShiftLessons = ScheduleTimes.firstShiftLessons.map(lesson => ({
    id: lesson.number,
    number: lesson.number,
    startTime: lesson.startTime,
    endTime: lesson.endTime
  }));
  
  const secondShiftLessons = ScheduleTimes.secondShiftLessons.map(lesson => ({
    id: lesson.number,
    number: lesson.number,
    startTime: lesson.startTime,
    endTime: lesson.endTime
  }));
  
  const lessons = selectedShift === 'first' ? firstShiftLessons : secondShiftLessons;
  
  const saveToHistory = useCallback((newSchedules) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), JSON.parse(JSON.stringify(newSchedules))]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);
  
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setAllSchedules(JSON.parse(JSON.stringify(history[historyIndex - 1])));
      checkAllConflicts(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setAllSchedules(JSON.parse(JSON.stringify(history[historyIndex + 1])));
      checkAllConflicts(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);
  
  const generateAllSchedules = () => {
    const schedules = {};
    
    allClasses.forEach(classInfo => {
      const className = classInfo.name;
      const classTeacher = classInfo.classTeacher;
      const schedule = {};
      
      allDays.forEach(day => {
        schedule[day.id] = generateDaySchedule(className, day.id, classTeacher);
      });
      
      schedules[className] = schedule;
    });
    
    return schedules;
  };
  
  const generateDaySchedule = (className, dayId, classTeacher) => {
    const templates = {
      monday: {
        1: { subject: 'Математика', teacher: 'Иванова А.П.', room: '201' },
        2: { subject: 'Русский язык', teacher: 'Кузнецова Е.М.', room: '305' },
        3: { subject: 'Литература', teacher: 'Михайлова С.В.', room: '306' },
        4: { subject: 'Физкультура', teacher: 'Козлов Д.С.', room: 'Спортзал' },
        5: { subject: 'Английский язык', teacher: 'Смирнова Е.А.', room: '401' }
      },
      tuesday: {
        1: { subject: 'Английский язык', teacher: 'Смирнова Е.А.', room: '401' },
        2: { subject: 'История', teacher: 'Морозова Т.П.', room: '210' },
        3: { subject: 'Информатика', teacher: 'Белов Д.А.', room: 'Комп. кл.' },
        4: { subject: 'Физика', teacher: 'Григорьев А.С.', room: 'Физика' },
        5: { subject: 'Математика', teacher: 'Петров С.И.', room: '202' }
      },
      wednesday: {
        1: { subject: 'Физика', teacher: 'Григорьев А.С.', room: 'Физика' },
        2: { subject: 'География', teacher: 'Тихонова Л.М.', room: '307' },
        3: { subject: 'Биология', teacher: 'Николаева М.В.', room: 'Лаб.' },
        4: { subject: 'Химия', teacher: 'Алексеев В.Г.', room: 'Лаб.' },
        5: { subject: 'Математика', teacher: 'Петров С.И.', room: '202' }
      },
      thursday: {
        1: { subject: 'Математика', teacher: 'Иванова А.П.', room: '201' },
        2: { subject: 'Русский язык', teacher: 'Кузнецова Е.М.', room: '305' },
        3: { subject: 'Обществознание', teacher: 'Лебедева И.А.', room: '211' },
        4: { subject: 'Физкультура', teacher: 'Козлов Д.С.', room: 'Спортзал' },
        5: { subject: 'Литература', teacher: 'Михайлова С.В.', room: '306' }
      },
      friday: {
        1: { subject: 'ИЗО', teacher: 'Волкова Н.С.', room: 'ИЗО' },
        2: { subject: 'Музыка', teacher: 'Соколова Е.И.', room: 'Музыка' },
        3: { subject: 'Труд', teacher: 'Павлов С.В.', room: 'Мастерская' },
        4: { subject: 'Кл. час', teacher: classTeacher, room: className },
        5: { subject: 'Английский', teacher: 'Андреева Е.В.', room: '403' }
      },
      saturday: {
        1: { subject: 'Математика', teacher: 'Петров С.И.', room: '202' },
        2: { subject: 'Английский', teacher: 'Андреева Е.В.', room: '403' },
        3: { subject: 'Физкультура', teacher: 'Степанова О.В.', room: 'Спортзал' },
        4: { subject: 'Информатика', teacher: 'Новикова Е.В.', room: 'Комп. кл.' }
      }
    };
    
    const template = templates[dayId];
    if (!template) return {};
    
    const daySchedule = {};
    Object.entries(template).forEach(([num, data]) => {
      const key = data.subgroup ? `${num}_${data.subgroup}` : num;
      daySchedule[key] = {
        id: `${className}-${dayId}-${key}`,
        subject: data.subject,
        teacher: data.teacher,
        room: data.room,
        duration: 45,
        color: getSubjectColor(data.subject),
        class: className,
        subgroup: null
      };
    });
    
    return daySchedule;
  };
  
  const getSubjectColor = (subject) => {
    const found = allSubjectsList.find(s => s.name === subject);
    return found?.color || '#9E9E9E';
  };
  
  const loadAllSchedules = async () => {
    setLoading(true);
    try {
      const schedules = generateAllSchedules();
      setAllSchedules(schedules);
      setOriginalSchedules(JSON.parse(JSON.stringify(schedules)));
      if (editMode) saveToHistory(schedules);
      checkAllConflicts(schedules);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadAllSchedules();
  }, []);
  
  useEffect(() => {
    if (editMode) {
      const handleKeyPress = (e) => {
        if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
        if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
      };
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [undo, redo, editMode]);
  
  const checkAllConflicts = (schedules) => {
    const newConflicts = [];
    const teacherUsage = {};
    const roomUsage = {};
    
    Object.entries(schedules).forEach(([className, classSchedule]) => {
      Object.entries(classSchedule).forEach(([day, dayLessons]) => {
        Object.entries(dayLessons).forEach(([lessonKey, lesson]) => {
          const teacherKey = `${day}-${lesson.teacher}-${lessonKey}`;
          const roomKey = `${day}-${lesson.room}-${lessonKey}`;
          
          if (teacherUsage[teacherKey]) {
            newConflicts.push({
              id: `teacher-${className}-${day}-${lessonKey}`,
              type: 'teacher',
              className,
              day,
              lesson: lessonKey,
              teacher: lesson.teacher,
              conflict: `Учитель ${lesson.teacher} уже ведет урок в это время`,
              severity: 'high'
            });
          } else {
            teacherUsage[teacherKey] = true;
          }
          
          if (roomUsage[roomKey]) {
            newConflicts.push({
              id: `room-${className}-${day}-${lessonKey}`,
              type: 'room',
              className,
              day,
              lesson: lessonKey,
              room: lesson.room,
              conflict: `Кабинет ${lesson.room} уже занят`,
              severity: 'medium'
            });
          } else {
            roomUsage[roomKey] = true;
          }
        });
      });
    });
    
    setConflicts(newConflicts);
  };
  
  const handleDragStart = (e, className, day, lessonKey) => {
    if (!editMode) return;
    e.dataTransfer.setData('text/plain', JSON.stringify({ className, day, lessonKey }));
    e.dataTransfer.effectAllowed = 'move';
    const lesson = allSchedules[className]?.[day]?.[lessonKey];
    if (lesson) setDraggedLesson({ className, day, lessonKey, lesson });
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDragEnter = (e, className, day, lessonNum) => {
    e.preventDefault();
    setDragOverCell({ className, day, lessonNum });
  };
  
  const handleDragLeave = () => {
    setDragOverCell(null);
  };
  
  const handleDrop = (e, targetClassName, targetDay, targetLessonNum) => {
    e.preventDefault();
    setDragOverCell(null);
    if (!editMode || !draggedLesson) return;
    
    const { className: sourceClass, day: sourceDay, lessonKey: sourceLessonKey, lesson } = draggedLesson;
    const targetLessonKey = targetLessonNum.toString();
    
    if (sourceClass === targetClassName && sourceDay === targetDay && sourceLessonKey === targetLessonKey) {
      setDraggedLesson(null);
      return;
    }
    
    const newSchedules = JSON.parse(JSON.stringify(allSchedules));
    
    if (newSchedules[sourceClass]?.[sourceDay]) {
      delete newSchedules[sourceClass][sourceDay][sourceLessonKey];
      if (Object.keys(newSchedules[sourceClass][sourceDay]).length === 0) {
        delete newSchedules[sourceClass][sourceDay];
      }
    }
    
    if (!newSchedules[targetClassName]) newSchedules[targetClassName] = {};
    if (!newSchedules[targetClassName][targetDay]) newSchedules[targetClassName][targetDay] = {};
    
    newSchedules[targetClassName][targetDay][targetLessonKey] = {
      ...lesson,
      id: `${targetClassName}-${targetDay}-${targetLessonKey}`,
      class: targetClassName
    };
    
    setAllSchedules(newSchedules);
    saveToHistory(newSchedules);
    setDraggedLesson(null);
    checkAllConflicts(newSchedules);
  };
  
  const openEditModal = (className, day, lessonKey, lesson) => {
    if (!editMode) return;
    setEditingLesson({ className, day, lessonKey, lesson });
    setEditForm({
      subject: lesson.subject || '',
      teacher: lesson.teacher || '',
      room: lesson.room || '',
      duration: lesson.duration || 45,
      subgroup: lesson.subgroup || null
    });
    setShowEditModal(true);
  };
  
  const saveLessonChanges = () => {
    if (!editingLesson) return;
    const { className, day, lessonKey } = editingLesson;
    const newSchedules = JSON.parse(JSON.stringify(allSchedules));
    
    if (!newSchedules[className]) newSchedules[className] = {};
    if (!newSchedules[className][day]) newSchedules[className][day] = {};
    
    newSchedules[className][day][lessonKey] = {
      ...newSchedules[className][day][lessonKey],
      ...editForm,
      color: getSubjectColor(editForm.subject)
    };
    
    setAllSchedules(newSchedules);
    saveToHistory(newSchedules);
    setShowEditModal(false);
    setEditingLesson(null);
    checkAllConflicts(newSchedules);
  };
  
  const handleAddLesson = (className, day, lessonNum, subgroup = null) => {
    if (!editMode) return;
    const lessonKey = subgroup ? `${lessonNum}_${subgroup}` : `${lessonNum}`;
    setEditingLesson({ className, day, lessonKey, isNew: true, lessonNum, subgroup });
    setEditForm({
      subject: subjects[0] || '',
      teacher: teachers[0]?.value || '',
      room: rooms[0]?.value || '',
      duration: 45,
      subgroup: subgroup
    });
    setShowEditModal(true);
  };
  
  const saveNewLesson = () => {
    if (!editingLesson?.isNew) return;
    const { className, day, lessonNum, subgroup } = editingLesson;
    const lessonKey = subgroup ? `${lessonNum}_${subgroup}` : `${lessonNum}`;
    const newSchedules = JSON.parse(JSON.stringify(allSchedules));
    
    if (!newSchedules[className]) newSchedules[className] = {};
    if (!newSchedules[className][day]) newSchedules[className][day] = {};
    
    newSchedules[className][day][lessonKey] = {
      id: `${className}-${day}-${lessonKey}`,
      subject: editForm.subject,
      teacher: editForm.teacher,
      room: editForm.room,
      duration: editForm.duration,
      color: getSubjectColor(editForm.subject),
      class: className,
      subgroup: subgroup
    };
    
    setAllSchedules(newSchedules);
    saveToHistory(newSchedules);
    setShowEditModal(false);
    setEditingLesson(null);
    checkAllConflicts(newSchedules);
  };
  
  const handleDeleteLesson = (className, day, lessonKey) => {
    if (!editMode) return;
    const lesson = allSchedules[className]?.[day]?.[lessonKey];
    if (!lesson) return;
    if (!window.confirm(`Удалить урок "${lesson.subject}" в классе ${className}?`)) return;
    
    const newSchedules = JSON.parse(JSON.stringify(allSchedules));
    if (newSchedules[className]?.[day]) {
      delete newSchedules[className][day][lessonKey];
      if (Object.keys(newSchedules[className][day]).length === 0) {
        delete newSchedules[className][day];
      }
    }
    
    setAllSchedules(newSchedules);
    saveToHistory(newSchedules);
    checkAllConflicts(newSchedules);
  };
  
  const copyClassSchedule = (sourceClass, targetClass) => {
    if (!editMode) return;
    if (sourceClass === targetClass) return;
    if (!window.confirm(`Скопировать расписание из ${sourceClass} в ${targetClass}?`)) return;
    
    const newSchedules = JSON.parse(JSON.stringify(allSchedules));
    newSchedules[targetClass] = JSON.parse(JSON.stringify(newSchedules[sourceClass]));
    
    Object.entries(newSchedules[targetClass]).forEach(([day, daySchedule]) => {
      Object.entries(daySchedule).forEach(([key, lesson]) => {
        lesson.id = `${targetClass}-${day}-${key}`;
        lesson.class = targetClass;
      });
    });
    
    setAllSchedules(newSchedules);
    saveToHistory(newSchedules);
    checkAllConflicts(newSchedules);
  };
  
  const saveAllChanges = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      alert('Расписание всей школы сохранено!');
      setEditMode(false);
      setOriginalSchedules(JSON.parse(JSON.stringify(allSchedules)));
    } finally {
      setLoading(false);
    }
  };
  
  const exportAllSchedules = () => {
    const data = {
      schoolName: 'Школьное расписание',
      shift: selectedShift === 'first' ? 'Первая смена' : 'Вторая смена',
      schedules: allSchedules,
      exportedAt: new Date().toISOString(),
      classes: allClasses.map(c => c.name)
    };
    const link = document.createElement('a');
    link.href = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    link.download = `schedule_${selectedShift}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };
  
  const exportToExcel = () => {
    const classesToExport = filteredClasses();
    const shiftName = selectedShift === 'first' ? 'Первая смена' : 'Вторая смена';
    const workbook = XLSX.utils.book_new();
    
    allDays.forEach(day => {
      const sheetData = [];
      
      sheetData.push([`РАСПИСАНИЕ УРОКОВ`]);
      sheetData.push([`${getSchoolName()}`]);
      sheetData.push([`${day.name} (${day.shortName})`]);
      sheetData.push([`Смена: ${shiftName}`]);
      sheetData.push([]);
      
      const headers = ['Урок', 'Время', ...classesToExport.map(c => `${c.name} класс`)];
      sheetData.push(headers);
      
      lessons.forEach(lesson => {
        const row = [lesson.number, `${lesson.startTime}-${lesson.endTime}`];
        
        classesToExport.forEach(classInfo => {
          const className = classInfo.name;
          const schedule = allSchedules[className] || {};
          const lessonsList = getLessonsAtTimeForExport(schedule, day.id, lesson.number);
          
          if (lessonsList.length > 0) {
            const lessonText = lessonsList.map(l => 
              `${l.lesson.subject}\n${l.lesson.teacher}\nкаб. ${l.lesson.room}`
            ).join('\n\n');
            row.push(lessonText);
          } else {
            row.push('—');
          }
        });
        
        sheetData.push(row);
      });
      
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      
      const colWidths = [{ wch: 8 }, { wch: 12 }];
      classesToExport.forEach(() => colWidths.push({ wch: 28 }));
      worksheet['!cols'] = colWidths;
      
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: headers.length - 1 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: headers.length - 1 } }
      ];
      
      XLSX.utils.book_append_sheet(workbook, worksheet, day.shortName);
    });
    
    XLSX.writeFile(workbook, `schedule_${selectedShift}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  
  const getLessonsAtTimeForExport = (schedule, day, lessonNum) => {
    const daySchedule = schedule?.[day] || {};
    const result = [];
    if (daySchedule[lessonNum]) result.push({ key: lessonNum, lesson: daySchedule[lessonNum], subgroup: null });
    if (daySchedule[`${lessonNum}_1`]) result.push({ key: `${lessonNum}_1`, lesson: daySchedule[`${lessonNum}_1`], subgroup: 1 });
    if (daySchedule[`${lessonNum}_2`]) result.push({ key: `${lessonNum}_2`, lesson: daySchedule[`${lessonNum}_2`], subgroup: 2 });
    return result;
  };
  
  const printSchedule = () => {
    const classesToPrint = filteredClasses();
    const shiftName = selectedShift === 'first' ? 'Первая смена' : 'Вторая смена';
    const currentDate = new Date().toLocaleDateString('ru-RU');
    
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Расписание уроков</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 15px; background: white; font-size: 11px; }
          .print-header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #000; }
          .print-header h1 { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .print-header p { font-size: 12px; color: #555; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
          th { background: #f0f0f0; border: 1px solid #000; padding: 8px 6px; text-align: center; font-weight: bold; }
          td { border: 1px solid #000; padding: 8px 6px; vertical-align: top; }
          .day-cell { background: #fafafa; font-weight: bold; text-align: center; width: 80px; }
          .class-header { min-width: 140px; }
          .lesson-card { margin-bottom: 8px; padding: 6px; border-left: 3px solid; background: #f9f9f9; }
          .lesson-card:last-child { margin-bottom: 0; }
          .lesson-subject { font-weight: bold; font-size: 11px; margin: 4px 0 3px 0; }
          .lesson-teacher, .lesson-room { font-size: 9px; color: #555; margin: 2px 0; }
          .empty { text-align: center; color: #ccc; padding: 12px; font-style: italic; }
          @media print { body { padding: 0; margin: 0; } }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>Расписание уроков</h1>
          <p>${getSchoolName()} | ${shiftName} | ${currentDate}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>День</th>
              <th>Урок</th>
              <th>Время</th>
              ${classesToPrint.map(c => `<th class="class-header">${c.name} класс</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${allDays.map(day => {
              return lessons.map((lesson, lessonIndex) => {
                const isFirstLessonOfDay = lessonIndex === 0;
                return `
                  <tr>
                    ${isFirstLessonOfDay ? `<td class="day-cell" rowspan="${lessons.length}"><strong>${day.name}</strong><br><span style="font-size:9px">${day.shortName}</span></td>` : ''}
                    <td style="text-align:center; background:#fafafa;">${lesson.number}</td>
                    <td style="text-align:center;">${lesson.startTime}<br>–<br>${lesson.endTime}</td>
                    ${classesToPrint.map(classInfo => {
                      const className = classInfo.name;
                      const schedule = allSchedules[className] || {};
                      const lessonsList = getLessonsAtTimeForExport(schedule, day.id, lesson.number);
                      
                      if (lessonsList.length > 0) {
                        return `
                          <td>
                            ${lessonsList.map(l => `
                              <div class="lesson-card" style="border-left-color: ${l.lesson.color || '#9E9E9E'}">
                                <div class="lesson-subject">${l.lesson.subject}</div>
                                <div class="lesson-teacher">${l.lesson.teacher}</div>
                                <div class="lesson-room">каб. ${l.lesson.room}</div>
                              </div>
                            `).join('')}
                          </td>
                        `;
                      } else {
                        return `<td><div class="empty">—</div></td>`;
                      }
                    }).join('')}
                  </tr>
                `;
              }).join('');
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
  
  const getSchoolName = () => {
    return 'МБОУ "СОШ №1"';
  };
  
  const getLessonsAtTime = (schedule, day, lessonNum) => {
    const daySchedule = schedule?.[day] || {};
    const result = [];
    if (daySchedule[lessonNum]) result.push({ key: lessonNum, lesson: daySchedule[lessonNum], subgroup: null });
    if (daySchedule[`${lessonNum}_1`]) result.push({ key: `${lessonNum}_1`, lesson: daySchedule[`${lessonNum}_1`], subgroup: 1 });
    if (daySchedule[`${lessonNum}_2`]) result.push({ key: `${lessonNum}_2`, lesson: daySchedule[`${lessonNum}_2`], subgroup: 2 });
    return result;
  };
  
  const hasConflict = (className, day, lessonNum) => {
    return conflicts.some(c => c.className === className && c.day === day && c.lesson === lessonNum?.toString());
  };
  
  const filteredClasses = () => {
    if (selectedClassFilter === 'all') return allClasses;
    if (selectedClassFilter === 'primary') return allClasses.filter(c => {
      const num = parseInt(c.name);
      return num >= 1 && num <= 4;
    });
    if (selectedClassFilter === 'middle') return allClasses.filter(c => {
      const num = parseInt(c.name);
      return num >= 5 && num <= 9;
    });
    if (selectedClassFilter === 'high') return allClasses.filter(c => {
      const num = parseInt(c.name);
      return num >= 10 && num <= 11;
    });
    return allClasses.filter(c => c.name === selectedClassFilter);
  };
  
  const renderMatrixView = () => {
    const classesToShow = filteredClasses();
    
    return (
      <div className="matrix-view">
        <table className="schedule-matrix-table">
          <thead>
            <tr>
              <th className="matrix-class-header">Класс</th>
              {allDays.map(day => (
                <th key={day.id} className="matrix-day-header">
                  <div className="matrix-day-name">{day.shortName}</div>
                  <div className="matrix-day-full">{day.name}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classesToShow.map(classInfo => {
              const className = classInfo.name;
              const schedule = allSchedules[className] || {};
              
              return (
                <tr key={className} className="matrix-row">
                  <td className="matrix-class-cell">
                    <div className="matrix-class-name">{className}</div>
                    <div className="matrix-class-teacher">{classInfo.classTeacher?.split(' ')[0]}</div>
                  </td>
                  
                  {allDays.map(day => {
                    const daySchedule = schedule[day.id] || {};
                    const isDragOver = dragOverCell?.className === className && dragOverCell?.day === day.id;
                    
                    return (
                      <td 
                        key={day.id} 
                        className={`matrix-day-cell ${isDragOver ? 'drag-over' : ''}`}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, className, day.id, 'cell')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, className, day.id, '1')}
                      >
                        <div className="matrix-lessons-list">
                          {lessons.map(lesson => {
                            const lessonsList = getLessonsAtTime(schedule, day.id, lesson.number);
                            const isConflict = hasConflict(className, day.id, lesson.number);
                            
                            return (
                              <div 
                                key={lesson.number} 
                                className={`matrix-lesson-item ${isConflict && showConflicts && filters.highlightConflicts ? 'conflict' : ''}`}
                                draggable={editMode && lessonsList.length > 0}
                                onDragStart={(e) => lessonsList.length > 0 && handleDragStart(e, className, day.id, lessonsList[0].key)}
                                onClick={() => {
                                  if (editMode && lessonsList.length > 0) {
                                    openEditModal(className, day.id, lessonsList[0].key, lessonsList[0].lesson);
                                  } else if (editMode && lessonsList.length === 0) {
                                    handleAddLesson(className, day.id, lesson.number);
                                  }
                                }}
                              >
                                <div className="matrix-lesson-time">{lesson.number}</div>
                                {lessonsList.length > 0 ? (
                                  <div className="matrix-lesson-content">
                                    <div className="matrix-lesson-subject" style={{ color: lessonsList[0].lesson.color }}>
                                      {lessonsList[0].lesson.subject}
                                    </div>
                                    {filters.showTeachers && (
                                      <div className="matrix-lesson-teacher">{lessonsList[0].lesson.teacher}</div>
                                    )}
                                    {filters.showRooms && (
                                      <div className="matrix-lesson-room">{lessonsList[0].lesson.room}</div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="matrix-lesson-empty">
                                    {editMode ? <FaPlus /> : '—'}
                                  </div>
                                )}
                                {editMode && lessonsList.length > 0 && (
                                  <div className="matrix-lesson-actions">
                                    <button 
                                      className="matrix-lesson-edit"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(className, day.id, lessonsList[0].key, lessonsList[0].lesson);
                                      }}
                                    >
                                      <FaEdit />
                                    </button>
                                    <button 
                                      className="matrix-lesson-delete"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteLesson(className, day.id, lessonsList[0].key);
                                      }}
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {editMode && (
                          <div className="matrix-day-actions">
                            <button 
                              className="matrix-add-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                const lessonNum = prompt('Номер урока (1-8):', '1');
                                if (lessonNum && lessonNum >= 1 && lessonNum <= 8) {
                                  handleAddLesson(className, day.id, parseInt(lessonNum));
                                }
                              }}
                            >
                              <FaPlus /> Урок
                            </button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderCompactView = () => {
    const classesToShow = filteredClasses();
    
    return (
      <div className="compact-view">
        <table className="compact-schedule-table">
          <thead>
            <tr>
              <th className="compact-class-header">Класс</th>
              {allDays.map(day => (
                <th key={day.id} className="compact-day-header">
                  {day.shortName}<br/>
                  <span className="compact-day-full">{day.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classesToShow.map(classInfo => {
              const className = classInfo.name;
              const schedule = allSchedules[className] || {};
              
              return (
                <tr key={className} className="compact-row">
                  <td className="compact-class-cell">
                    <div className="compact-class-name">{className}</div>
                    <div className="compact-class-info">{classInfo.classTeacher?.split(' ')[0]}</div>
                  </td>
                  {allDays.map(day => {
                    const daySchedule = schedule[day.id] || {};
                    const lessonCount = Object.keys(daySchedule).length;
                    const conflictsCount = conflicts.filter(c => c.className === className && c.day === day.id).length;
                    
                    return (
                      <td 
                        key={day.id} 
                        className={`compact-day-cell ${lessonCount === 0 ? 'empty' : ''} ${conflictsCount > 0 ? 'has-conflicts' : ''}`}
                      >
                        {lessonCount > 0 ? (
                          <div className="compact-day-summary">
                            <div className="compact-lesson-count">
                              {lessonCount} {getLessonDeclension(lessonCount)}
                            </div>
                            <div className="compact-subjects">
                              {Object.values(daySchedule).slice(0, 3).map((lesson, idx) => (
                                <span key={idx} className="compact-subject" style={{ color: lesson.color }}>
                                  {lesson.subject}
                                </span>
                              ))}
                              {lessonCount > 3 && (
                                <span className="compact-more">+{lessonCount - 3}</span>
                              )}
                            </div>
                            {conflictsCount > 0 && (
                              <div className="compact-conflict-badge">
                                <FaExclamationTriangle /> {conflictsCount}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="compact-empty">—</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };
  
  const getLessonDeclension = (count) => {
    if (count % 10 === 1 && count % 100 !== 11) return 'урок';
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'урока';
    return 'уроков';
  };
  
  const totalConflicts = conflicts.length;
  
  return (
    <div className="admin-schedule-editor">
      <ThemeToggle />
      <BackButton fallbackPath="/" />
      
      <div className="animated-bg">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="glass-circle"></div>
        ))}
      </div>
      
      <Header />
      
      <div className="container">
        <div className="page-header">
          <h1>
            <FaBuilding /> Редактор расписания школы
          </h1>
          <p className="subtitle">Управление расписанием для всех классов</p>
        </div>
        
        <div className="control-panel">
          <div className="view-selector">
            <button 
              className={`view-btn ${selectedView === 'matrix' ? 'active' : ''}`}
              onClick={() => setSelectedView('matrix')}
            >
              <FaTable /> Матрица
            </button>
            <button 
              className={`view-btn ${selectedView === 'compact' ? 'active' : ''}`}
              onClick={() => setSelectedView('compact')}
            >
              <FaTh /> Компакт
            </button>
          </div>
          
          <div className="shift-selector">
            <button 
              className={`shift-btn ${selectedShift === 'first' ? 'active' : ''}`}
              onClick={() => setSelectedShift('first')}
            >
              <FaSun /> 1 смена
            </button>
            <button 
              className={`shift-btn ${selectedShift === 'second' ? 'active' : ''}`}
              onClick={() => setSelectedShift('second')}
            >
              <FaMoon /> 2 смена
            </button>
          </div>
          
          <div className="class-filter">
            <label>Классы:</label>
            <select value={selectedClassFilter} onChange={(e) => setSelectedClassFilter(e.target.value)}>
              <option value="all">Все классы</option>
              <option value="primary">Начальная школа (1-4)</option>
              <option value="middle">Средняя школа (5-9)</option>
              <option value="high">Старшая школа (10-11)</option>
              {allClasses.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className="action-buttons">
            <button className={`btn ${editMode ? 'btn-warning' : 'btn-primary'}`} onClick={() => setEditMode(!editMode)}>
              {editMode ? <FaTimes /> : <FaEdit />} {editMode ? 'Отменить' : 'Редактировать'}
            </button>
            
            {editMode && (
              <>
                <button className="btn btn-secondary" onClick={undo}><FaUndo /> Отменить</button>
                <button className="btn btn-secondary" onClick={redo}><FaRedo /> Повторить</button>
                <button className="btn btn-success" onClick={saveAllChanges}><FaRegSave /> Сохранить</button>
              </>
            )}
            
            <button className="btn btn-secondary" onClick={printSchedule}><FaPrint /> Печать</button>
            <button className="btn btn-success" onClick={exportToExcel}><FaFileExcel /> Excel</button>
            <button className="btn btn-secondary" onClick={exportAllSchedules}><FaDownload /> JSON</button>
            
            <button className={`btn ${showConflicts ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setShowConflicts(!showConflicts)}>
              {showConflicts ? <FaEyeSlash /> : <FaEye />} Конфликты
            </button>
          </div>
        </div>
        
        <div className="filter-panel">
          <div className="search">
            <FaSearch />
            <input 
              type="text" 
              placeholder="Поиск по предмету, учителю, кабинету..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="filters">
            <label>
              <input type="checkbox" checked={filters.showTeachers} onChange={(e) => setFilters({...filters, showTeachers: e.target.checked})} />
              <span>Учителя</span>
            </label>
            <label>
              <input type="checkbox" checked={filters.showRooms} onChange={(e) => setFilters({...filters, showRooms: e.target.checked})} />
              <span>Кабинеты</span>
            </label>
            <label>
              <input type="checkbox" checked={filters.highlightConflicts} onChange={(e) => setFilters({...filters, highlightConflicts: e.target.checked})} />
              <span>Подсветка конфликтов</span>
            </label>
          </div>
        </div>
        
        <div className="info-panel">
          <div><FaSchool /> Классов: {filteredClasses().length}</div>
          <div><FaChalkboardTeacher /> Учителей: {allTeachersList.length}</div>
          <div><FaRegClock /> Смена: {selectedShift === 'first' ? 'Первая' : 'Вторая'}</div>
          {totalConflicts > 0 && (
            <div className="conflict-badge">
              <FaExclamationTriangle /> {totalConflicts} конфликтов
            </div>
          )}
          {editMode && (
            <div className="edit-mode-badge">
              <FaEdit /> Режим редактирования
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="loading">Загрузка расписания...</div>
        ) : (
          <>
            {selectedView === 'matrix' && renderMatrixView()}
            {selectedView === 'compact' && renderCompactView()}
          </>
        )}
        
        {showConflicts && totalConflicts > 0 && (
          <div className="conflicts-panel">
            <h3><FaExclamationTriangle /> Конфликты ({totalConflicts})</h3>
            <div className="conflicts-list">
              {conflicts.slice(0, 5).map(c => (
                <div key={c.id} className={`conflict ${c.type}`}>
                  <div className="conflict-header">
                    <FaBell />
                    <span className="conflict-class">{c.className}</span>
                    <span>{allDays.find(d => d.id === c.day)?.name || c.day}, урок {c.lesson}</span>
                    <span className={`severity ${c.severity}`}>
                      {c.type === 'teacher' ? c.teacher : c.room}
                    </span>
                  </div>
                  <div className="conflict-desc">{c.conflict}</div>
                </div>
              ))}
              {totalConflicts > 5 && <div className="more">и еще {totalConflicts - 5}...</div>}
            </div>
          </div>
        )}
      </div>
      
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaEdit /> {editingLesson?.isNew ? 'Добавить урок' : 'Редактировать урок'}</h3>
              <button className="close-modal" onClick={() => setShowEditModal(false)}><FaTimes /></button>
            </div>
            <div className="modal-content">
              {editingLesson && !editingLesson.isNew && (
                <div className="lesson-context">
                  <span>{editingLesson.className}</span>
                  <span>{allDays.find(d => d.id === editingLesson.day)?.name}</span>
                </div>
              )}
              <div className="edit-form">
                <div className="form-group">
                  <label><FaBook /> Предмет</label>
                  <select value={editForm.subject} onChange={(e) => setEditForm({...editForm, subject: e.target.value})}>
                    <option value="">Выберите предмет</option>
                    {subjects.map((s, i) => <option key={i} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label><FaChalkboardTeacher /> Учитель</label>
                  <select value={editForm.teacher} onChange={(e) => setEditForm({...editForm, teacher: e.target.value})}>
                    <option value="">Выберите учителя</option>
                    {teachers.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label><FaMapMarkerAlt /> Кабинет</label>
                  <select value={editForm.room} onChange={(e) => setEditForm({...editForm, room: e.target.value})}>
                    <option value="">Выберите кабинет</option>
                    {rooms.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label><FaHourglassHalf /> Длительность</label>
                    <select value={editForm.duration} onChange={(e) => setEditForm({...editForm, duration: parseInt(e.target.value)})}>
                      {durations.map(d => <option key={d} value={d}>{d} мин</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label><FaUsersSlash /> Подгруппа</label>
                    <select value={editForm.subgroup === null ? 'null' : editForm.subgroup} onChange={(e) => setEditForm({...editForm, subgroup: e.target.value === 'null' ? null : parseInt(e.target.value)})}>
                      {subgroupOptions.map(opt => (
                        <option key={opt.value === null ? 'null' : opt.value} value={opt.value === null ? 'null' : opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Отмена</button>
              <button className="btn-success" onClick={editingLesson?.isNew ? saveNewLesson : saveLessonChanges} disabled={!editForm.subject || !editForm.teacher || !editForm.room}>
                <FaSave /> {editingLesson?.isNew ? 'Добавить' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default AdminScheduleEditor;