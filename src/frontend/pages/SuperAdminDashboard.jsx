// src/frontend/pages/SuperAdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/MainContent.css';
import '../styles/SuperAdmin.css';

const SuperAdminDashboard = () => {
  // Состояния
  const [activeTab, setActiveTab] = useState('admins');
  const [admins, setAdmins] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [notification, setNotification] = useState('');

  // Формы
  const [newAdmin, setNewAdmin] = useState({ username: '', name: '', email: '', password: '' });
  const [newTeacher, setNewTeacher] = useState({ lastName: '', firstName: '', middleName: '', subjects: '' });
  const [newClass, setNewClass] = useState({ number: '', letter: '', shift: 1, teacherId: '' });

  // Загрузка данных
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setTimeout(() => {
      setAdmins([
        { id: 1, username: 'admin1', name: 'Иванов И.И.', email: 'admin1@school.ru' },
        { id: 2, username: 'admin2', name: 'Петрова А.С.', email: 'admin2@school.ru' },
      ]);
      setTeachers([
        { id: 1, name: 'Иванова М.С.', subjects: 'Математика, Информатика' },
        { id: 2, name: 'Петров А.В.', subjects: 'Физика' },
      ]);
      setClasses([
        { id: 1, name: '5 "А"', teacher: 'Иванова М.С.', shift: 1, students: 24 },
        { id: 2, name: '6 "Б"', teacher: 'Не назначен', shift: 1, students: 22 },
        { id: 3, name: '7 "В"', teacher: 'Не назначен', shift: 2, students: 20 },
      ]);
    }, 500);
  };

  // Показать уведомление
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  // Добавить администратора
  const handleAddAdmin = (e) => {
    e.preventDefault();
    if (!newAdmin.username || !newAdmin.name || !newAdmin.email || !newAdmin.password) {
      showNotification('Заполните все поля');
      return;
    }
    
    const newAdminObj = {
      id: admins.length + 1,
      ...newAdmin
    };
    
    setAdmins([...admins, newAdminObj]);
    setNewAdmin({ username: '', name: '', email: '', password: '' });
    showNotification('Администратор добавлен');
  };

  // Добавить учителя
  const handleAddTeacher = (e) => {
    e.preventDefault();
    if (!newTeacher.lastName || !newTeacher.firstName) {
      showNotification('Заполните обязательные поля');
      return;
    }
    
    const newTeacherObj = {
      id: teachers.length + 1,
      name: `${newTeacher.lastName} ${newTeacher.firstName} ${newTeacher.middleName}`.trim(),
      subjects: newTeacher.subjects
    };
    
    setTeachers([...teachers, newTeacherObj]);
    setNewTeacher({ lastName: '', firstName: '', middleName: '', subjects: '' });
    showNotification('Учитель добавлен');
  };

  // Добавить класс
  const handleAddClass = (e) => {
    e.preventDefault();
    if (!newClass.number || !newClass.letter) {
      showNotification('Заполните номер и букву класса');
      return;
    }
    
    const teacher = teachers.find(t => t.id === parseInt(newClass.teacherId));
    
    const newClassObj = {
      id: classes.length + 1,
      name: `${newClass.number} "${newClass.letter}"`,
      teacher: teacher ? teacher.name : 'Не назначен',
      shift: newClass.shift,
      students: 0
    };
    
    setClasses([...classes, newClassObj]);
    setNewClass({ number: '', letter: '', shift: 1, teacherId: '' });
    showNotification('Класс добавлен');
  };

  // Удалить запись
  const handleDelete = (type, id) => {
    if (window.confirm('Вы уверены?')) {
      switch(type) {
        case 'admin':
          setAdmins(admins.filter(a => a.id !== id));
          showNotification('Администратор удален');
          break;
        case 'teacher':
          setTeachers(teachers.filter(t => t.id !== id));
          showNotification('Учитель удален');
          break;
        case 'class':
          setClasses(classes.filter(c => c.id !== id));
          showNotification('Класс удален');
          break;
      }
    }
  };

  // Изменить смену для класса
  const handleChangeShift = (classId, newShift) => {
    const updatedClasses = classes.map(cls => 
      cls.id === classId ? { ...cls, shift: newShift } : cls
    );
    setClasses(updatedClasses);
    showNotification('Смена изменена');
  };

  // Назначить/отвязать классного руководителя
  const handleToggleTeacher = (classId) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;

    if (cls.teacher === 'Не назначен') {
      // Назначить первого доступного учителя
      const availableTeacher = teachers.find(t => 
        !classes.some(c => c.teacher === t.name && c.id !== classId)
      );
      
      if (availableTeacher) {
        const updatedClasses = classes.map(c => 
          c.id === classId ? { ...c, teacher: availableTeacher.name } : c
        );
        setClasses(updatedClasses);
        showNotification(`Назначен классный руководитель: ${availableTeacher.name}`);
      } else {
        showNotification('Нет свободных учителей');
      }
    } else {
      // Отвязать классного руководителя
      const updatedClasses = classes.map(c => 
        c.id === classId ? { ...c, teacher: 'Не назначен' } : c
      );
      setClasses(updatedClasses);
      showNotification('Классный руководитель отвязан');
    }
  };

  // Статистика
  const stats = {
    admins: admins.length,
    teachers: teachers.length,
    classes: classes.length,
    students: classes.reduce((sum, cls) => sum + cls.students, 0),
    classesWithoutTeacher: classes.filter(c => c.teacher === 'Не назначен').length,
    shift1: classes.filter(c => c.shift === 1).length,
    shift2: classes.filter(c => c.shift === 2).length
  };

  return (
    <div className="main-content-page">
      <div className="animated-bg">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="glass-circle"></div>
        ))}
      </div>
      
      <Header />
      
      <main className="superadmin-container">
        {/* Уведомление */}
        {notification && (
          <div className="notification">
            {notification}
          </div>
        )}

        {/* Заголовок */}
        <div className="superadmin-header">
          <h1 className="superadmin-title">Панель управления</h1>
          <p className="superadmin-subtitle">Управление администраторами, учителями и классами</p>
        </div>

        {/* Быстрая статистика */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.admins}</div>
            <div className="stat-label">Администраторов</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.teachers}</div>
            <div className="stat-label">Учителей</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.classes}</div>
            <div className="stat-label">Классов</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.students}</div>
            <div className="stat-label">Учеников</div>
          </div>
        </div>

        {/* Навигация */}
        <div className="tabs-container">
          <button
            onClick={() => setActiveTab('admins')}
            className={`tab-button ${activeTab === 'admins' ? 'active' : ''}`}
          >
            Администраторы
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`tab-button ${activeTab === 'teachers' ? 'active' : ''}`}
          >
            Учителя
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`tab-button ${activeTab === 'classes' ? 'active' : ''}`}
          >
            Классы
          </button>
        </div>

        {/* Контент вкладок */}
        <div>
          {/* Администраторы */}
          {activeTab === 'admins' && (
            <div className="content-grid">
              {/* Форма добавления */}
              <div className="form-container">
                <h3 className="form-title">Новый администратор</h3>
                <form onSubmit={handleAddAdmin}>
                  <div className="form-group">
                    <label className="form-label">Логин *</label>
                    <input
                      type="text"
                      value={newAdmin.username}
                      onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ФИО *</label>
                    <input
                      type="text"
                      value={newAdmin.name}
                      onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Пароль *</label>
                    <input
                      type="password"
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <button type="submit" className="submit-button">
                    Добавить администратора
                  </button>
                </form>
              </div>

              {/* Список администраторов */}
              <div className="table-container">
                <h3 className="table-title">Список администраторов ({admins.length})</h3>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Логин</th>
                        <th>ФИО</th>
                        <th>Email</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map(admin => (
                        <tr key={admin.id}>
                          <td>{admin.username}</td>
                          <td>{admin.name}</td>
                          <td>{admin.email}</td>
                          <td>
                            <button
                              onClick={() => handleDelete('admin', admin.id)}
                              className="action-button delete-button"
                            >
                              <FaTrash /> Удалить
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Учителя */}
          {activeTab === 'teachers' && (
            <div className="content-grid">
              {/* Форма добавления */}
              <div className="form-container">
                <h3 className="form-title">Новый учитель</h3>
                <form onSubmit={handleAddTeacher}>
                  <div className="form-group">
                    <label className="form-label">Фамилия *</label>
                    <input
                      type="text"
                      value={newTeacher.lastName}
                      onChange={(e) => setNewTeacher({...newTeacher, lastName: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Имя *</label>
                    <input
                      type="text"
                      value={newTeacher.firstName}
                      onChange={(e) => setNewTeacher({...newTeacher, firstName: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Отчество</label>
                    <input
                      type="text"
                      value={newTeacher.middleName}
                      onChange={(e) => setNewTeacher({...newTeacher, middleName: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Предметы</label>
                    <input
                      type="text"
                      value={newTeacher.subjects}
                      onChange={(e) => setNewTeacher({...newTeacher, subjects: e.target.value})}
                      placeholder="Математика, Физика"
                      className="form-input"
                    />
                  </div>
                  <button type="submit" className="submit-button">
                    Добавить учителя
                  </button>
                </form>
              </div>

              {/* Список учителей */}
              <div className="table-container">
                <h3 className="table-title">Список учителей ({teachers.length})</h3>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ФИО</th>
                        <th>Предметы</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map(teacher => (
                        <tr key={teacher.id}>
                          <td>{teacher.name}</td>
                          <td>{teacher.subjects}</td>
                          <td>
                            <button
                              onClick={() => handleDelete('teacher', teacher.id)}
                              className="action-button delete-button"
                            >
                              <FaTrash /> Удалить
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Классы */}
          {activeTab === 'classes' && (
            <div className="content-grid">
              {/* Форма добавления */}
              <div className="form-container">
                <h3 className="form-title">Новый класс</h3>
                <form onSubmit={handleAddClass}>
                  <div className="form-group">
                    <label className="form-label">Номер класса *</label>
                    <input
                      type="number"
                      min="1"
                      max="11"
                      value={newClass.number}
                      onChange={(e) => setNewClass({...newClass, number: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Буква *</label>
                    <input
                      type="text"
                      maxLength="1"
                      value={newClass.letter}
                      onChange={(e) => setNewClass({...newClass, letter: e.target.value.toUpperCase()})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Смена</label>
                    <select
                      value={newClass.shift}
                      onChange={(e) => setNewClass({...newClass, shift: parseInt(e.target.value)})}
                      className="form-select"
                    >
                      <option value="1">1 смена (08:00-13:30)</option>
                      <option value="2">2 смена (14:00-19:30)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Классный руководитель</label>
                    <select
                      value={newClass.teacherId}
                      onChange={(e) => setNewClass({...newClass, teacherId: e.target.value})}
                      className="form-select"
                    >
                      <option value="">Не назначен</option>
                      {teachers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="submit-button">
                    Добавить класс
                  </button>
                </form>
              </div>

              {/* Список классов с управлением */}
              <div className="table-container">
                <h3 className="table-title">Список классов ({classes.length})</h3>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Класс</th>
                        <th>Смена</th>
                        <th>Учеников</th>
                        <th>Руководитель</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map(cls => (
                        <tr key={cls.id}>
                          <td>{cls.name}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span className={`shift-badge shift-${cls.shift}`}>
                                {cls.shift} смена
                              </span>
                              <button
                                onClick={() => handleChangeShift(cls.id, cls.shift === 1 ? 2 : 1)}
                                className="action-button shift-button"
                              >
                                Сменить
                              </button>
                            </div>
                          </td>
                          <td>{cls.students}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>{cls.teacher}</span>
                              <button
                                onClick={() => handleToggleTeacher(cls.id)}
                                className={`action-button ${cls.teacher === 'Не назначен' ? 'assign-button' : 'unassign-button'}`}
                              >
                                {cls.teacher === 'Не назначен' ? <FaCheck /> : <FaTimes />}
                                {cls.teacher === 'Не назначен' ? 'Назначить' : 'Отвязать'}
                              </button>
                            </div>
                          </td>
                          <td>
                            <button
                              onClick={() => handleDelete('class', cls.id)}
                              className="action-button delete-button"
                            >
                              <FaTrash /> Удалить
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Статистика по сменам */}
                <div className="shift-stats">
                  <div className="shift-stat">
                    <div className="shift-stat-number shift-stat-1">{stats.shift1}</div>
                    <div>Классов в 1 смену</div>
                  </div>
                  <div className="shift-stat">
                    <div className="shift-stat-number shift-stat-2">{stats.shift2}</div>
                    <div>Классов во 2 смену</div>
                  </div>
                </div>
                
                {/* Предупреждение о классах без руководителей */}
                {stats.classesWithoutTeacher > 0 && (
                  <div className="warning-box">
                    <strong>Внимание:</strong> {stats.classesWithoutTeacher} класс(ов) без классного руководителя
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SuperAdminDashboard;