// LessonsTab.jsx
import React, { useState } from 'react';
import { 
    FaBook, FaPlus, FaFileExcel, FaDownload, FaTrash, FaEye, FaEdit, 
    FaSave, FaTimes, FaUpload, FaSpinner, FaCheck, FaExclamationTriangle, 
    FaSearch, FaChevronDown, FaChevronUp, FaInfoCircle
} from 'react-icons/fa';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Стили для компонента
const styles = {
  // Контейнер
  container: {
    padding: '0',
  },
  // Карточка с кнопками
  actionsCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    background: '#ffffff',
    borderRadius: '16px',
    padding: '1rem 1.25rem',
    marginBottom: '1.5rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  actionsLeft: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  actionsRight: {
    minWidth: '250px',
  },
  // Стили кнопок
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.55rem 1.2rem',
    background: 'linear-gradient(135deg, #21435A 0%, #2c5a7a 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '30px',
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    fontFamily: 'inherit',
  },
  btnExcel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.55rem 1.2rem',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '30px',
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    fontFamily: 'inherit',
  },
  btnExport: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.55rem 1.2rem',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '30px',
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    fontFamily: 'inherit',
  },
  btnDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.55rem 1.2rem',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '30px',
    fontSize: '0.8rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    fontFamily: 'inherit',
  },
  // Поиск
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    color: '#94a3b8',
    fontSize: '14px',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '0.55rem 1rem 0.55rem 2.5rem',
    border: '1px solid #e2e8f0',
    borderRadius: '30px',
    fontSize: '0.85rem',
    background: '#ffffff',
    color: '#1e293b',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  // Таблица
  tableCard: {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  tableTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  tableTitleText: {
    fontSize: '0.9rem',
    fontWeight: '600',
    margin: 0,
    color: '#1e293b',
  },
  stats: {
    display: 'flex',
    gap: '0.5rem',
  },
  statTotal: {
    padding: '0.25rem 0.7rem',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: '500',
    background: 'rgba(33, 67, 90, 0.1)',
    color: '#21435A',
  },
  statFiltered: {
    padding: '0.25rem 0.7rem',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: '500',
    background: 'rgba(59, 130, 246, 0.1)',
    color: '#3b82f6',
  },
  // Таблица
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '0.85rem 1rem',
    textAlign: 'left',
    fontSize: '0.7rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#64748b',
    letterSpacing: '0.5px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: '0.9rem 1rem',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '0.85rem',
    color: '#1e293b',
  },
  // Бейджи
  shortNameBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.85rem',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: '600',
    color: 'white',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
  // Иконки действий
  actionIconView: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginRight: '0.25rem',
    background: 'rgba(59, 130, 246, 0.1)',
    color: '#3b82f6',
  },
  actionIconDelete: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
  },
  footer: {
    padding: '0.75rem 1.25rem',
    background: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
  },
  footerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.7rem',
    color: '#64748b',
  },
  // Уведомление
  notification: (type) => ({
    position: 'fixed',
    top: '20px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    borderRadius: '12px',
    fontSize: '0.85rem',
    zIndex: 10000,
    animation: 'slideInRight 0.3s ease',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
    background: type === 'success' ? '#10b981' : '#ef4444',
    color: 'white',
  }),
};

const LessonsTab = ({ lessons, token, onDataChange }) => {
    const [selectedLessons, setSelectedLessons] = useState([]);
    const [selectAllLessons, setSelectAllLessons] = useState(false);
    const [uploadLessonsModalOpen, setUploadLessonsModalOpen] = useState(false);
    const [addLessonModalOpen, setAddLessonModalOpen] = useState(false);
    const [viewLessonModalOpen, setViewLessonModalOpen] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const handleToggleLessonSelection = (lessonId) => {
        setSelectedLessons(prev => prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]);
        setSelectAllLessons(false);
    };

    const handleSelectAllLessons = () => {
        if (selectAllLessons) {
            setSelectedLessons([]);
        } else {
            setSelectedLessons(filteredLessons.map(l => l.id));
        }
        setSelectAllLessons(!selectAllLessons);
    };

    const handleBulkDeleteLessons = async () => {
        if (selectedLessons.length === 0) {
            showNotification('Выберите уроки для удаления', 'error');
            return;
        }
        if (!window.confirm(`Удалить ${selectedLessons.length} урок(ов)? Это действие нельзя отменить.`)) return;
        try {
            await axios.delete(`${API_URL}/superadmin/lessons/bulk`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { ids: selectedLessons }
            });
            showNotification(`Удалено ${selectedLessons.length} уроков`);
            setSelectedLessons([]);
            setSelectAllLessons(false);
            onDataChange();
        } catch (err) {
            console.error('Bulk delete error:', err);
            showNotification('Ошибка при удалении', 'error');
        }
    };

    const handleExportLessons = async () => {
        try {
            const response = await axios.get(`${API_URL}/superadmin/lessons/export`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'lessons_export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showNotification('Экспорт выполнен успешно');
        } catch (err) {
            console.error('Export lessons error:', err);
            showNotification('Ошибка при экспорте', 'error');
        }
    };

    const handleAddLessonManually = async (lessonData) => {
        try {
            await axios.post(`${API_URL}/superadmin/lessons`, lessonData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Урок добавлен');
            onDataChange();
        } catch (err) {
            console.error('Add lesson error:', err);
            showNotification(err.response?.data?.message || 'Ошибка добавления урока', 'error');
            throw err;
        }
    };

    const handleUpdateLesson = async (lessonData) => {
        try {
            await axios.put(`${API_URL}/superadmin/lessons/${lessonData.id}`, lessonData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Урок обновлен');
            onDataChange();
        } catch (err) {
            console.error('Update lesson error:', err);
            showNotification('Ошибка обновления урока', 'error');
            throw err;
        }
    };

    const handleDeleteLesson = async (id, name) => {
        if (!window.confirm(`Удалить урок "${name}"?`)) return;
        try {
            await axios.delete(`${API_URL}/superadmin/lessons/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification(`Урок "${name}" удалён`);
            onDataChange();
        } catch (err) {
            console.error('Delete lesson error:', err);
            showNotification('Ошибка удаления', 'error');
        }
    };

    const handleUploadLessons = async (formData) => {
        try {
            const response = await axios.post(`${API_URL}/superadmin/lessons/upload`, formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            showNotification(response.data?.message || 'Уроки успешно загружены');
            onDataChange();
            return response;
        } catch (err) {
            console.error('Upload lessons error:', err);
            showNotification(err.response?.data?.message || 'Ошибка загрузки уроков', 'error');
            throw err;
        }
    };

    const lessonsArray = Array.isArray(lessons) ? lessons : [];
    
    const filteredLessons = lessonsArray.filter(lesson => 
        lesson.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lesson.shortName || lesson.short_name)?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedLessons = [...filteredLessons].sort((a, b) => {
        let aVal = a[sortField] || a[sortField === 'shortName' ? 'short_name' : sortField] || '';
        let bVal = b[sortField] || b[sortField === 'shortName' ? 'short_name' : sortField] || '';
        
        if (sortField === 'id') {
            aVal = parseInt(aVal) || 0;
            bVal = parseInt(bVal) || 0;
        }
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <FaChevronDown size={10} style={{ opacity: 0.3 }} />;
        return sortDirection === 'asc' ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />;
    };

    const selectedCount = selectedLessons.length;

    return (
        <>
            {/* Уведомление */}
            {notification.message && (
                <div style={styles.notification(notification.type)}>
                    {notification.type === 'success' ? <FaCheck size={14} /> : <FaExclamationTriangle size={14} />}
                    <span>{notification.message}</span>
                </div>
            )}
            
            <div style={styles.container}>
                {/* Кнопки действий */}
                <div style={styles.actionsCard}>
                    <div style={styles.actionsLeft}>
                        <button 
                            style={styles.btnPrimary}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            onClick={() => setAddLessonModalOpen(true)}
                        >
                            <FaPlus size={14} /> Добавить вручную
                        </button>
                        <button 
                            style={styles.btnExcel}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            onClick={() => setUploadLessonsModalOpen(true)}
                        >
                            <FaFileExcel size={14} /> Загрузить из Excel
                        </button>
                        <button 
                            style={styles.btnExport}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            onClick={handleExportLessons}
                        >
                            <FaDownload size={14} /> Экспорт
                        </button>
                        {selectedCount > 0 && (
                            <button 
                                style={styles.btnDanger}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                onClick={handleBulkDeleteLessons}
                            >
                                <FaTrash size={14} /> Удалить выбранные ({selectedCount})
                            </button>
                        )}
                    </div>
                    <div style={styles.actionsRight}>
                        <div style={styles.searchWrapper}>
                            <FaSearch style={styles.searchIcon} />
                            <input 
                                type="text" 
                                placeholder="Поиск уроков..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={styles.searchInput}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#21435A';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(33, 67, 90, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e2e8f0';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Таблица уроков */}
                <div style={styles.tableCard}>
                    <div style={styles.tableHeader}>
                        <div style={styles.tableTitle}>
                            <FaBook size={18} color="#21435A" />
                            <h3 style={styles.tableTitleText}>Список уроков</h3>
                        </div>
                        <div style={styles.stats}>
                            <span style={styles.statTotal}>{lessonsArray.length} всего</span>
                            <span style={styles.statFiltered}>{filteredLessons.length} отфильтровано</span>
                        </div>
                    </div>
                    
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={{...styles.th, width: '40px', textAlign: 'center'}}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectAllLessons && filteredLessons.length > 0}
                                            onChange={handleSelectAllLessons}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#21435A' }}
                                        />
                                    </th>
                                    <th style={styles.th} className="sortable" onClick={() => handleSort('id')}>
                                        ID <SortIcon field="id" />
                                    </th>
                                    <th style={styles.th} className="sortable" onClick={() => handleSort('name')}>
                                        Название урока <SortIcon field="name" />
                                    </th>
                                    <th style={styles.th} className="sortable" onClick={() => handleSort('shortName')}>
                                        Краткое название <SortIcon field="shortName" />
                                    </th>
                                    <th style={{...styles.th, width: '100px'}}>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedLessons.length > 0 ? sortedLessons.map(lesson => (
                                    <tr key={lesson.id} style={{ transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{...styles.td, textAlign: 'center', width: '40px'}}>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedLessons.includes(lesson.id)}
                                                onChange={() => handleToggleLessonSelection(lesson.id)}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#21435A' }}
                                            />
                                        </td>
                                        <td style={{...styles.td, fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b', width: '60px'}}>
                                            #{lesson.id}
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'rgba(33, 67, 90, 0.1)', borderRadius: '10px', color: '#21435A' }}>
                                                    <FaBook size={14} />
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{lesson.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={styles.shortNameBadge}>{lesson.shortName || lesson.short_name || '—'}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <button 
                                                onClick={() => { setSelectedLesson(lesson); setViewLessonModalOpen(true); }} 
                                                style={styles.actionIconView}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.transform = 'scale(1)'; }}
                                                title="Просмотр"
                                            >
                                                <FaEye size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteLesson(lesson.id, lesson.name)} 
                                                style={styles.actionIconDelete}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'scale(1)'; }}
                                                title="Удалить"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', background: 'rgba(33, 67, 90, 0.05)', borderRadius: '50%', marginBottom: '1rem', color: '#94a3b8' }}>
                                                    <FaBook size={48} />
                                                </div>
                                                <h4 style={{ fontSize: '1rem', margin: '0 0 0.5rem 0', color: '#1e293b' }}>Нет загруженных уроков</h4>
                                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1.5rem 0' }}>Добавьте уроки вручную или загрузите из Excel файла</p>
                                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                                    <button style={styles.btnPrimary} onClick={() => setAddLessonModalOpen(true)}>
                                                        <FaPlus size={14} /> Добавить вручную
                                                    </button>
                                                    <button style={styles.btnExcel} onClick={() => setUploadLessonsModalOpen(true)}>
                                                        <FaFileExcel size={14} /> Загрузить из Excel
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    <div style={styles.footer}>
                        <div style={styles.footerInfo}>
                            <FaInfoCircle size={12} />
                            <span>Краткое название отображается в карточке урока в расписании</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Модальные окна - оставлены без изменений для краткости */}
            <AddLessonModal 
                isOpen={addLessonModalOpen} 
                onClose={() => setAddLessonModalOpen(false)} 
                onSave={handleAddLessonManually} 
                showNotification={showNotification}
            />
            
            <ViewLessonModal 
                isOpen={viewLessonModalOpen} 
                onClose={() => setViewLessonModalOpen(false)} 
                onUpdate={handleUpdateLesson} 
                onDelete={handleDeleteLesson} 
                lesson={selectedLesson}
                showNotification={showNotification}
            />
            
            <UploadLessonsModal 
                isOpen={uploadLessonsModalOpen} 
                onClose={() => setUploadLessonsModalOpen(false)} 
                onUpload={handleUploadLessons}
                showNotification={showNotification}
            />
        </>
    );
};

// Модальные окна (упрощённые версии с инлайн-стилями)
const AddLessonModal = ({ isOpen, onClose, onSave, showNotification }) => {
    const [formData, setFormData] = useState({ name: '', shortName: '' });
    const [saving, setSaving] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setFormData({ name: '', shortName: '' });
            setSaving(false);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            showNotification('Введите название урока', 'error');
            return;
        }
        if (!formData.shortName.trim()) {
            showNotification('Введите краткое название урока', 'error');
            return;
        }
        setSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
        }} onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
            <div style={{
                background: 'white',
                borderRadius: '20px',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'modalSlideIn 0.3s ease',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 1.25rem',
                    background: 'linear-gradient(135deg, #21435A 0%, #2c5a7a 100%)',
                    color: 'white',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '10px' }}>
                        <FaPlus size={18} />
                    </div>
                    <h3 style={{ flex: 1, fontSize: '1rem', fontWeight: 600, margin: 0 }}>Добавить урок вручную</h3>
                    <button style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => !saving && onClose()} disabled={saving}>
                        <FaTimes />
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Название урока *</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Например: Математика" autoFocus disabled={saving} style={{ padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Краткое название *</label>
                        <input type="text" value={formData.shortName} onChange={e => setFormData({...formData, shortName: e.target.value})} placeholder="Например: Мат." disabled={saving} style={{ padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem' }} />
                        <small style={{ fontSize: '0.65rem', color: '#64748b' }}>Будет отображаться в расписании</small>
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.25rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <button style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }} onClick={() => !saving && onClose()} disabled={saving}>
                        Отмена
                    </button>
                    <button style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#21435A', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }} onClick={handleSubmit} disabled={saving}>
                        <FaSave /> {saving ? 'Сохранение...' : 'Добавить'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ViewLessonModal = ({ isOpen, onClose, onUpdate, onDelete, lesson, showNotification }) => {
    const [formData, setFormData] = useState({ name: '', shortName: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    React.useEffect(() => {
        if (lesson && isOpen) {
            setFormData({
                name: lesson.name || '',
                shortName: lesson.shortName || lesson.short_name || ''
            });
            setIsEditing(false);
            setSaving(false);
        }
    }, [lesson, isOpen]);

    const handleUpdate = async () => {
        if (!formData.name.trim()) {
            showNotification('Введите название урока', 'error');
            return;
        }
        if (!formData.shortName.trim()) {
            showNotification('Введите краткое название урока', 'error');
            return;
        }
        setSaving(true);
        try {
            await onUpdate({ ...formData, id: lesson.id });
            setIsEditing(false);
            onClose();
        } catch (err) {
            console.error('Update error:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm(`Удалить урок "${lesson?.name}"? Это действие нельзя отменить.`)) {
            setSaving(true);
            try {
                await onDelete(lesson.id, lesson.name);
                onClose();
            } catch (err) {
                console.error('Delete error:', err);
            } finally {
                setSaving(false);
            }
        }
    };

    if (!isOpen || !lesson) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
        }} onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
            <div style={{
                background: 'white',
                borderRadius: '20px',
                width: '90%',
                maxWidth: '550px',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 1.25rem',
                    background: isEditing ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #21435A 0%, #2c5a7a 100%)',
                    color: 'white',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '10px' }}>
                        {isEditing ? <FaEdit size={18} /> : <FaBook size={18} />}
                    </div>
                    <h3 style={{ flex: 1, fontSize: '1rem', fontWeight: 600, margin: 0 }}>{isEditing ? 'Редактирование урока' : lesson.name}</h3>
                    <button style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => !saving && onClose()} disabled={saving}>
                        <FaTimes />
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
                    {isEditing ? (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Название урока *</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={saving} autoFocus style={{ padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Краткое название *</label>
                                <input type="text" value={formData.shortName} onChange={e => setFormData({...formData, shortName: e.target.value})} disabled={saving} placeholder="Например: Мат." style={{ padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem' }} />
                                <small style={{ fontSize: '0.65rem', color: '#64748b' }}>Будет отображаться в расписании</small>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0', borderBottom: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Название</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1e293b', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{lesson.name}</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0', borderBottom: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Краткое название</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1e293b', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{lesson.shortName || lesson.short_name || '—'}</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0', borderBottom: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>ID</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1e293b', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{lesson.id}</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>Дата создания</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1e293b', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{lesson.created_at ? new Date(lesson.created_at).toLocaleString('ru-RU') : '-'}</div>
                            </div>
                        </>
                    )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.25rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    {isEditing ? (
                        <>
                            <button style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }} onClick={() => setIsEditing(false)} disabled={saving}>
                                Отмена
                            </button>
                            <button style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#21435A', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }} onClick={handleUpdate} disabled={saving}>
                                <FaSave /> {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }} onClick={() => !saving && onClose()} disabled={saving}>
                                Закрыть
                            </button>
                            <button style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }} onClick={() => setIsEditing(true)} disabled={saving}>
                                <FaEdit /> Редактировать
                            </button>
                            <button style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }} onClick={handleDelete} disabled={saving}>
                                <FaTrash /> Удалить
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// UploadLessonsModal (упрощённая версия)
const UploadLessonsModal = ({ isOpen, onClose, onUpload, showNotification }) => {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState(null);

    React.useEffect(() => {
        if (!isOpen) {
            setFile(null);
            setPreviewData([]);
            setUploading(false);
            setUploadProgress(0);
            setUploadStatus(null);
            setDragActive(false);
        }
    }, [isOpen]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.match(/\.(xlsx|xls)$/)) {
            processFile(droppedFile);
        } else {
            showNotification('Пожалуйста, загрузите файл Excel (.xlsx или .xls)', 'error');
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.name.match(/\.(xlsx|xls)$/)) {
            processFile(selectedFile);
        } else if (selectedFile) {
            showNotification('Пожалуйста, выберите файл Excel (.xlsx или .xls)', 'error');
        }
    };

    const processFile = (selectedFile) => {
        setFile(selectedFile);
        setUploadStatus(null);
        setUploadProgress(0);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });

                if (rows.length < 2) {
                    showNotification('Файл должен содержать заголовки и данные', 'error');
                    setFile(null);
                    return;
                }

                const parsedData = rows.slice(1)
                    .filter(row => row[0] && row[0].toString().trim())
                    .map(row => ({
                        name: row[0]?.toString().trim() || '',
                        shortName: row[1]?.toString().trim() || ''
                    }))
                    .filter(item => item.name);

                if (parsedData.length === 0) {
                    showNotification('Не найдено данных для загрузки', 'error');
                    setFile(null);
                    return;
                }

                setPreviewData(parsedData);
            } catch (err) {
                console.error('Error parsing Excel:', err);
                showNotification('Ошибка при чтении файла. Проверьте формат данных.', 'error');
                setFile(null);
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) {
            showNotification('Выберите файл', 'error');
            return;
        }

        if (previewData.length === 0) {
            showNotification('Нет данных для загрузки', 'error');
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        setUploadStatus(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            await onUpload(formData);

            clearInterval(progressInterval);
            setUploadProgress(100);
            setUploadStatus('success');

            setTimeout(() => {
                setFile(null);
                setPreviewData([]);
                setUploadProgress(0);
                onClose();
            }, 1500);
        } catch (err) {
            console.error('Upload error:', err);
            setUploadStatus('error');
            setUploading(false);
        } finally {
            setTimeout(() => {
                setUploading(false);
            }, 500);
        }
    };

    const downloadTemplate = () => {
        const wsData = [
            ['Название урока', 'Краткое название'],
            ['Математика', 'Мат.'],
            ['Русский язык', 'Рус.'],
            ['Английский язык', 'Англ.'],
            ['Физика', 'Физ.'],
            ['Химия', 'Хим.'],
            ['Биология', 'Биол.'],
            ['История', 'Ист.'],
            ['География', 'Геог.'],
            ['Информатика', 'Инф.']
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{wch:25}, {wch:15}];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Уроки');
        XLSX.writeFile(wb, 'template_lessons.xlsx');
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
        }} onClick={(e) => { if (e.target === e.currentTarget && !uploading) onClose(); }}>
            <div style={{
                background: 'white',
                borderRadius: '24px',
                width: '90%',
                maxWidth: '650px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.25rem 1.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '14px' }}>
                        <FaFileExcel size={28} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.2rem 0' }}>Загрузка уроков из Excel</h3>
                        <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>Импортируйте список уроков из файла Excel</p>
                    </div>
                    <button style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => !uploading && onClose()} disabled={uploading}>
                        <FaTimes />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.75rem', color: '#1e293b' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'rgba(33, 67, 90, 0.1)', borderRadius: '8px', color: '#21435A' }}>
                                <FaBook />
                            </div>
                            <span>Инструкция по загрузке</span>
                        </div>
                        <ul style={{ margin: '0 0 1rem 1.5rem', padding: 0, fontSize: '0.8rem', color: '#64748b' }}>
                            <li>Файл должен быть в формате <strong>.xlsx</strong> или <strong>.xls</strong></li>
                            <li>Первая строка — заголовки: <strong>Название урока</strong>, <strong>Краткое название</strong></li>
                            <li>Краткое название будет отображаться в карточке урока</li>
                        </ul>
                        <button style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }} onClick={downloadTemplate}>
                            <FaDownload /> Скачать шаблон Excel
                        </button>
                    </div>

                    <div style={{
                        border: `2px dashed ${dragActive ? '#21435A' : '#e2e8f0'}`,
                        borderRadius: '16px',
                        transition: 'all 0.2s',
                        marginBottom: '1rem',
                        background: dragActive ? 'rgba(33, 67, 90, 0.05)' : 'transparent',
                    }} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                        <input type="file" id="excel-upload" accept=".xlsx,.xls" onChange={handleFileChange} style={{ display: 'none' }} />
                        <label htmlFor="excel-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '2rem', textAlign: 'center', position: 'relative' }}>
                            {!file ? (
                                <>
                                    <FaFileExcel style={{ fontSize: '3rem', color: '#21435A' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1e293b' }}>Перетащите файл сюда или кликните для выбора</span>
                                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Поддерживаются файлы .xlsx и .xls</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <FaFileExcel style={{ fontSize: '3rem', color: '#10b981' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#21435A' }}>{file.name}</span>
                                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{(file.size / 1024).toFixed(2)} KB</span>
                                    </div>
                                    <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#ef4444', border: 'none', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { e.preventDefault(); setFile(null); setPreviewData([]); setUploadStatus(null); }}>
                                        <FaTimes />
                                    </button>
                                </>
                            )}
                        </label>
                    </div>

                    {uploading && (
                        <div style={{ margin: '1rem 0' }}>
                            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: 'linear-gradient(90deg, #21435A, #10b981)', transition: 'width 0.3s ease', borderRadius: '4px', width: `${uploadProgress}%` }} />
                            </div>
                            <span style={{ display: 'block', textAlign: 'center', fontSize: '0.7rem', marginTop: '0.5rem', color: '#64748b' }}>{uploadProgress}%</span>
                        </div>
                    )}

                    {uploadStatus === 'success' && (
                        <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', background: '#d1fae5', color: '#065f46' }}>
                            <FaCheck /> <span>Уроки успешно загружены!</span>
                        </div>
                    )}
                    
                    {uploadStatus === 'error' && (
                        <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', background: '#fee2e2', color: '#991b1b' }}>
                            <FaExclamationTriangle /> <span>Ошибка при загрузке. Попробуйте снова.</span>
                        </div>
                    )}

                    {previewData.length > 0 && !uploadStatus && (
                        <div style={{ marginTop: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                            <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>
                                    <FaBook /> <span>Предпросмотр ({previewData.length} уроков)</span>
                                </div>
                                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Будут добавлены следующие уроки:</span>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>#</th>
                                            <th style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Название урока</th>
                                            <th style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', textAlign: 'left', fontWeight: 600, color: '#64748b' }}>Краткое название</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.slice(0, 10).map((lesson, idx) => (
                                            <tr key={idx}>
                                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>{idx + 1}</td>
                                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#1e293b' }}>{lesson.name}</td>
                                                <td style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #e2e8f0', color: '#1e293b' }}>{lesson.shortName || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {previewData.length > 10 && (
                                <div style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.7rem', color: '#64748b', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                                    и ещё {previewData.length - 10} уроков...
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <button style={{ padding: '0.6rem 1.25rem', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }} onClick={() => !uploading && onClose()} disabled={uploading}>
                        Отмена
                    </button>
                    <button style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, opacity: !file || uploading ? 0.5 : 1, cursor: !file || uploading ? 'not-allowed' : 'pointer' }} onClick={handleUpload} disabled={!file || uploading}>
                        {uploading ? <><FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Загрузка...</> : <><FaUpload /> Загрузить уроки</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LessonsTab;