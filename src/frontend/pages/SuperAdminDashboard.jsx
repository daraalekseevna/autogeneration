// SuperAdminDashboard.jsx - исправленная версия с красивым выбором предметов
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaTrash, FaCheck, FaTimes, FaSun, FaMoon, FaUserPlus, FaChalkboardTeacher, FaSchool, FaUsers, FaSync, FaSearch, FaBook, FaChevronDown, FaChevronUp, FaEdit } from 'react-icons/fa';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/MainContent.css';
import '../styles/SuperAdmin.css';

const API_URL = 'http://localhost:5000/api';

// Компонент модального окна для выбора предметов
const SubjectSelectorModal = ({ isOpen, onClose, subjects, selectedIds, onSave, teacherName }) => {
  const [tempSelectedIds, setTempSelectedIds] = useState(selectedIds);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTempSelectedIds(selectedIds);
      setSearchTerm('');
      setSelectAll(false);
    }
  }, [isOpen, selectedIds]);

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSubject = (subjectId) => {
    setTempSelectedIds(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setTempSelectedIds([]);
    } else {
      setTempSelectedIds(filteredSubjects.map(s => s.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSave = () => {
    onSave(tempSelectedIds);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="subject-modal-overlay" onClick={onClose}>
      <div className="subject-modal-content" onClick={e => e.stopPropagation()}>
        <div className="subject-modal-header">
          <h3><FaBook /> Выбор предметов для {teacherName}</h3>
          <button className="subject-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="subject-modal-search">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Поиск предметов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="subject-modal-select-all">
          <label className="select-all-label">
            <input
              type="checkbox"
              checked={selectAll && filteredSubjects.length > 0}
              onChange={handleSelectAll}
            />
            <span>Выбрать все ({filteredSubjects.length})</span>
          </label>
        </div>
        
        <div className="subject-modal-list">
          {filteredSubjects.length === 0 ? (
            <div className="subject-modal-empty">Предметы не найдены</div>
          ) : (
            filteredSubjects.map(subject => (
              <label key={subject.id} className="subject-modal-item">
                <input
                  type="checkbox"
                  checked={tempSelectedIds.includes(subject.id)}
                  onChange={() => toggleSubject(subject.id)}
                />
                <span className="subject-modal-item-name">{subject.name}</span>
              </label>
            ))
          )}
        </div>
        
        <div className="subject-modal-footer">
          <div className="subject-modal-selected-count">
            Выбрано: {tempSelectedIds.length}
          </div>
          <div className="subject-modal-actions">
            <button className="subject-modal-cancel" onClick={onClose}>
              Отмена
            </button>
            <button className="subject-modal-save" onClick={handleSave}>
              <FaCheck /> Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('admins');
  const [admins, setAdmins] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });
  
  // Модальное окно для предметов
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [tempSubjectIds, setTempSubjectIds] = useState([]);

  // Формы
  const [newAdmin, setNewAdmin] = useState({ login: '', password: '', name: '', email: '' });
  const [newTeacher, setNewTeacher] = useState({
    lastName: '', firstName: '', middleName: '',
    subjectIds: [],
    login: '', password: ''
  });
  const [newClass, setNewClass] = useState({
    number: '', letter: '', shift: 1, teacherId: '',
    login: '', password: ''
  });

  const token = localStorage.getItem('token');

  // Тема
  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkTheme]);

  const toggleTheme = () => setIsDarkTheme(!isDarkTheme);

  // Загрузка данных
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [adminsRes, teachersRes, classesRes, subjectsRes] = await Promise.all([
        axios.get(`${API_URL}/superadmin/admins`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/superadmin/teachers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/superadmin/classes`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/superadmin/subjects`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setAdmins(Array.isArray(adminsRes.data) ? adminsRes.data : []);
      setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : []);
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
    } catch (err) {
      console.error('Load error:', err);
      showNotification('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  // Администраторы
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.login || !newAdmin.password || !newAdmin.name || !newAdmin.email) {
      showNotification('Заполните все поля');
      return;
    }
    try {
      await axios.post(`${API_URL}/superadmin/admins`, newAdmin, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Администратор добавлен');
      setNewAdmin({ login: '', password: '', name: '', email: '' });
      loadData();
    } catch (err) {
      console.error('Add admin error:', err);
      showNotification(err.response?.data?.message || 'Ошибка');
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!window.confirm('Удалить администратора?')) return;
    try {
      await axios.delete(`${API_URL}/superadmin/admins/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Администратор удалён');
      loadData();
    } catch (err) {
      console.error('Delete admin error:', err);
      showNotification('Ошибка удаления');
    }
  };

  // Учителя
  const openSubjectModal = (teacher = null) => {
    if (teacher) {
      setCurrentTeacher(teacher);
      setTempSubjectIds(teacher.subjectIds || []);
    } else {
      setCurrentTeacher(null);
      setTempSubjectIds(newTeacher.subjectIds);
    }
    setSubjectModalOpen(true);
  };

  const handleSaveSubjects = async (selectedIds) => {
    if (currentTeacher) {
      // Обновляем существующего учителя
      try {
        await axios.put(`${API_URL}/superadmin/teachers/${currentTeacher.id}`, {
          ...currentTeacher,
          subjectIds: selectedIds
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showNotification('Предметы обновлены');
        loadData();
      } catch (err) {
        console.error('Update subjects error:', err);
        showNotification('Ошибка обновления предметов');
      }
    } else {
      // Для нового учителя сохраняем в форму
      setNewTeacher(prev => ({ ...prev, subjectIds: selectedIds }));
    }
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    if (!newTeacher.lastName || !newTeacher.firstName || !newTeacher.login || !newTeacher.password) {
      showNotification('Заполните фамилию, имя, логин и пароль');
      return;
    }
    try {
      await axios.post(`${API_URL}/superadmin/teachers`, newTeacher, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Учитель добавлен');
      setNewTeacher({ lastName: '', firstName: '', middleName: '', subjectIds: [], login: '', password: '' });
      loadData();
    } catch (err) {
      console.error('Add teacher error:', err);
      showNotification(err.response?.data?.message || 'Ошибка');
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm('Удалить учителя?')) return;
    try {
      await axios.delete(`${API_URL}/superadmin/teachers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Учитель удалён');
      loadData();
    } catch (err) {
      console.error('Delete teacher error:', err);
      showNotification('Ошибка удаления');
    }
  };

  // Классы
  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClass.number || !newClass.letter || !newClass.login || !newClass.password) {
      showNotification('Заполните номер, букву, логин и пароль');
      return;
    }
    try {
      await axios.post(`${API_URL}/superadmin/classes`, newClass, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Класс добавлен');
      setNewClass({ number: '', letter: '', shift: 1, teacherId: '', login: '', password: '' });
      loadData();
    } catch (err) {
      console.error('Add class error:', err);
      showNotification(err.response?.data?.message || 'Ошибка');
    }
  };

  const handleChangeShift = async (classId, currentShift) => {
    const newShift = currentShift === 1 ? 2 : 1;
    try {
      await axios.put(`${API_URL}/superadmin/classes/${classId}`, { shift: newShift }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Смена изменена');
      loadData();
    } catch (err) {
      console.error('Change shift error:', err);
      showNotification('Ошибка');
    }
  };

  const handleToggleTeacher = async (classId, currentTeacherId) => {
    try {
      if (currentTeacherId) {
        await axios.put(`${API_URL}/superadmin/classes/${classId}`, { teacherId: null }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showNotification('Классный руководитель отвязан');
      } else {
        if (teachers.length === 0) {
          showNotification('Нет учителей для назначения');
          return;
        }
        await axios.put(`${API_URL}/superadmin/classes/${classId}`, { teacherId: teachers[0].id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showNotification('Классный руководитель назначен');
      }
      loadData();
    } catch (err) {
      console.error('Toggle teacher error:', err);
      showNotification('Ошибка');
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Удалить класс?')) return;
    try {
      await axios.delete(`${API_URL}/superadmin/classes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Класс удалён');
      loadData();
    } catch (err) {
      console.error('Delete class error:', err);
      showNotification('Ошибка удаления');
    }
  };

  // Статистика
  const stats = useMemo(() => ({
    admins: admins.length,
    teachers: teachers.length,
    classes: classes.length,
    classesWithoutTeacher: classes.filter(c => !c.teacher_name).length,
    shift1: classes.filter(c => c.shift === 1).length,
    shift2: classes.filter(c => c.shift === 2).length
  }), [admins, teachers, classes]);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Загрузка...</p>
    </div>
  );

  return (
    <div className={`main-content-page ${isDarkTheme ? 'dark-theme' : ''}`}>
      <div className="animated-bg">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="glass-circle"></div>
        ))}
      </div>
      
      <Header />
      
      <div className="theme-toggle-superadmin">
        <button className="theme-btn-superadmin" onClick={toggleTheme}>
          {isDarkTheme ? <FaSun /> : <FaMoon />}
          <span>{isDarkTheme ? 'Светлая тема' : 'Темная тема'}</span>
        </button>
      </div>

      <main className="superadmin-container">
        {notification && <div className="notification">{notification}</div>}

        <div className="superadmin-header">
          <h1 className="superadmin-title">Панель управления</h1>
          <p className="superadmin-subtitle">Управление администраторами, учителями и классами</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card"><div className="stat-number">{stats.admins}</div><div className="stat-label">Администраторов</div></div>
          <div className="stat-card"><div className="stat-number">{stats.teachers}</div><div className="stat-label">Учителей</div></div>
          <div className="stat-card"><div className="stat-number">{stats.classes}</div><div className="stat-label">Классов</div></div>
        </div>

        <div className="tabs-container">
          <button onClick={() => setActiveTab('admins')} className={`tab-button ${activeTab === 'admins' ? 'active' : ''}`}>
            <FaUsers /> Администраторы
          </button>
          <button onClick={() => setActiveTab('teachers')} className={`tab-button ${activeTab === 'teachers' ? 'active' : ''}`}>
            <FaChalkboardTeacher /> Учителя
          </button>
          <button onClick={() => setActiveTab('classes')} className={`tab-button ${activeTab === 'classes' ? 'active' : ''}`}>
            <FaSchool /> Классы
          </button>
        </div>

        {activeTab === 'admins' && (
          <div className="content-grid">
            <div className="form-container">
              <h3 className="form-title"><FaUserPlus /> Новый администратор</h3>
              <form onSubmit={handleAddAdmin}>
                <div className="form-group">
                  <label className="form-label">Логин *</label>
                  <input type="text" value={newAdmin.login} onChange={(e) => setNewAdmin({...newAdmin, login: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Пароль *</label>
                  <input type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">ФИО *</label>
                  <input type="text" value={newAdmin.name} onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})} className="form-input" />
                </div>
                <button type="submit" className="submit-button">Добавить администратора</button>
              </form>
            </div>
            <div className="table-container">
              <h3 className="table-title">Список администраторов ({admins.length})</h3>
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr><th>Логин</th><th>ФИО</th><th>Email</th><th>Действия</th></tr></thead>
                  <tbody>
                    {admins.map(a => (
                      <tr key={a.id}>
                        <td>{a.login}</td>
                        <td>{a.name}</td>
                        <td>{a.email}</td>
                        <td>
                          <button onClick={() => handleDeleteAdmin(a.id)} className="action-button delete-button">
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

        {activeTab === 'teachers' && (
          <div className="content-grid">
            <div className="form-container">
              <h3 className="form-title"><FaUserPlus /> Новый учитель</h3>
              <form onSubmit={handleAddTeacher}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Фамилия *</label>
                    <input type="text" value={newTeacher.lastName} onChange={e => setNewTeacher({...newTeacher, lastName: e.target.value})} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Имя *</label>
                    <input type="text" value={newTeacher.firstName} onChange={e => setNewTeacher({...newTeacher, firstName: e.target.value})} className="form-input" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Отчество</label>
                  <input type="text" value={newTeacher.middleName} onChange={e => setNewTeacher({...newTeacher, middleName: e.target.value})} className="form-input" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Логин *</label>
                    <input type="text" value={newTeacher.login} onChange={e => setNewTeacher({...newTeacher, login: e.target.value})} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Пароль *</label>
                    <input type="password" value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})} className="form-input" />
                  </div>
                </div>
                
                {/* КРАСИВАЯ КНОПКА ВЫБОРА ПРЕДМЕТОВ */}
                <div className="form-group">
                  <label className="form-label">Предметы</label>
                  <div 
                    className="subject-selector-button"
                    onClick={() => openSubjectModal(null)}
                  >
                    <div className="subject-selector-content">
                      <FaBook className="subject-selector-icon" />
                      <span className="subject-selector-text">
                        {newTeacher.subjectIds.length === 0 
                          ? 'Выберите предметы...' 
                          : `Выбрано предметов: ${newTeacher.subjectIds.length}`}
                      </span>
                    </div>
                    <FaChevronDown className="subject-selector-arrow" />
                  </div>
                  
                  {/* Предпросмотр выбранных предметов */}
                  {newTeacher.subjectIds.length > 0 && (
                    <div className="subject-preview">
                      {newTeacher.subjectIds.map(id => {
                        const subject = subjects.find(s => s.id === id);
                        return subject ? (
                          <span key={id} className="subject-preview-tag">
                            {subject.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                
                <button type="submit" className="submit-button">Добавить учителя</button>
              </form>
            </div>
            
            <div className="table-container">
              <h3 className="table-title">Список учителей ({teachers.length})</h3>
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr><th>ФИО</th><th>Предметы</th><th>Действия</th></tr></thead>
                  <tbody>
                    {teachers.map(t => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 500 }}>{t.name}</td>
                        <td>
                          <div className="subjects-tags">
                            {t.subjects && t.subjects.length > 0 ? (
                              t.subjects.map(s => (
                                <span key={s.id} className="subject-tag">
                                  {s.name}
                                </span>
                              ))
                            ) : (
                              <span className="no-subjects">Нет предметов</span>
                            )}
                            <button 
                              className="edit-subjects-btn"
                              onClick={() => openSubjectModal(t)}
                              title="Редактировать предметы"
                            >
                              <FaEdit /> Изменить
                            </button>
                          </div>
                        </td>
                        <td>
                          <button onClick={() => handleDeleteTeacher(t.id)} className="action-button delete-button">
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

        {activeTab === 'classes' && (
          <div className="content-grid">
            <div className="form-container">
              <h3 className="form-title"><FaUserPlus /> Новый класс</h3>
              <form onSubmit={handleAddClass}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Номер *</label>
                    <input type="number" min="1" max="11" value={newClass.number} onChange={e => setNewClass({...newClass, number: e.target.value})} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Буква *</label>
                    <input type="text" maxLength="1" value={newClass.letter} onChange={e => setNewClass({...newClass, letter: e.target.value.toUpperCase()})} className="form-input" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Логин *</label>
                    <input type="text" value={newClass.login} onChange={e => setNewClass({...newClass, login: e.target.value})} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Пароль *</label>
                    <input type="password" value={newClass.password} onChange={e => setNewClass({...newClass, password: e.target.value})} className="form-input" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Смена</label>
                    <select value={newClass.shift} onChange={e => setNewClass({...newClass, shift: parseInt(e.target.value)})} className="form-select">
                      <option value="1">1 смена</option>
                      <option value="2">2 смена</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Классный руководитель</label>
                    <select value={newClass.teacherId} onChange={e => setNewClass({...newClass, teacherId: e.target.value})} className="form-select">
                      <option value="">Не назначен</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="submit-button">Добавить класс</button>
              </form>
            </div>
            <div className="table-container">
              <h3 className="table-title">Список классов ({classes.length})</h3>
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr><th>Класс</th><th>Смена</th><th>Руководитель</th><th>Действия</th></tr></thead>
                  <tbody>
                    {classes.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.name}</strong></td>
                        <td>
                          <div className="shift-control">
                            <span className={`shift-badge shift-${c.shift}`}>{c.shift} смена</span>
                            <button onClick={() => handleChangeShift(c.id, c.shift)} className="action-button shift-button">
                              <FaSync /> Сменить
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="teacher-control">
                            <span>{c.teacher_name || 'Не назначен'}</span>
                            <button onClick={() => handleToggleTeacher(c.id, c.teacher_id)} className={`action-button ${c.teacher_name ? 'unassign-button' : 'assign-button'}`}>
                              {c.teacher_name ? <FaTimes /> : <FaCheck />} {c.teacher_name ? 'Отвязать' : 'Назначить'}
                            </button>
                          </div>
                        </td>
                        <td>
                          <button onClick={() => handleDeleteClass(c.id)} className="action-button delete-button">
                            <FaTrash /> Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              {stats.classesWithoutTeacher > 0 && (
                <div className="warning-box">
                  <strong>Внимание!</strong> {stats.classesWithoutTeacher} класс(ов) без классного руководителя
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* Модальное окно выбора предметов */}
      <SubjectSelectorModal
        isOpen={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        subjects={subjects}
        selectedIds={tempSubjectIds}
        onSave={handleSaveSubjects}
        teacherName={currentTeacher ? currentTeacher.name : 'нового учителя'}
      />
      
      <Footer />
    </div>
  );
};

export default SuperAdminDashboard;