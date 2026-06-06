// LessonsTab.jsx
import React, { useState } from 'react';
import { FaBook, FaPlus, FaFileExcel, FaDownload, FaTrash, FaEye, FaEdit, FaSave, FaTimes, FaUpload, FaSpinner, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LessonsTab = ({ lessons, token, onDataChange }) => {
    const [selectedLessons, setSelectedLessons] = useState([]);
    const [selectAllLessons, setSelectAllLessons] = useState(false);
    const [uploadLessonsModalOpen, setUploadLessonsModalOpen] = useState(false);
    const [addLessonModalOpen, setAddLessonModalOpen] = useState(false);
    const [viewLessonModalOpen, setViewLessonModalOpen] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [notification, setNotification] = useState('');

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    const handleToggleLessonSelection = (lessonId) => {
        setSelectedLessons(prev => prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]);
        setSelectAllLessons(false);
    };

    const handleSelectAllLessons = () => {
        if (selectAllLessons) {
            setSelectedLessons([]);
        } else {
            setSelectedLessons(lessons.map(l => l.id));
        }
        setSelectAllLessons(!selectAllLessons);
    };

    const handleBulkDeleteLessons = async () => {
        if (selectedLessons.length === 0) {
            showNotification('Выберите уроки для удаления');
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
            showNotification('Ошибка при удалении');
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
            showNotification('Ошибка при экспорте');
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
            showNotification(err.response?.data?.message || 'Ошибка добавления урока');
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
            showNotification('Ошибка обновления урока');
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
            showNotification('Ошибка удаления');
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
            showNotification(err.response?.data?.message || 'Ошибка загрузки уроков');
            throw err;
        }
    };

    const AddLessonModal = ({ isOpen, onClose, onSave }) => {
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
                alert('Введите название урока');
                return;
            }
            if (!formData.shortName.trim()) {
                alert('Введите краткое название урока');
                return;
            }
            setSaving(true);
            try {
                await onSave(formData);
                onClose();
            } catch (err) {
                console.error('Save error:', err);
                alert(err.response?.data?.message || 'Ошибка при сохранении');
            } finally {
                setSaving(false);
            }
        };

        if (!isOpen) return null;

        return (
            <div className="modal-overlay-fixed" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
                <div className="modal-content-fixed" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                    <div className="modal-header-fixed">
                        <h3><FaPlus /> Добавить урок вручную</h3>
                        <button className="modal-close-fixed" onClick={() => !saving && onClose()} disabled={saving}><FaTimes /></button>
                    </div>
                    <div className="modal-body-fixed">
                        <div className="form-group">
                            <label>Название урока *</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Напр: Математика" autoFocus disabled={saving} />
                        </div>
                        <div className="form-group">
                            <label>Краткое название (отображается в карточке) *</label>
                            <input type="text" value={formData.shortName} onChange={e => setFormData({...formData, shortName: e.target.value})} placeholder="Напр: Мат." disabled={saving} />
                            <small>Будет отображаться в расписании</small>
                        </div>
                    </div>
                    <div className="modal-footer-fixed">
                        <button className="btn-cancel-modal" onClick={() => !saving && onClose()} disabled={saving}>Отмена</button>
                        <button className="btn-save-modal" onClick={handleSubmit} disabled={saving}><FaSave /> {saving ? 'Сохранение...' : 'Добавить'}</button>
                    </div>
                </div>
            </div>
        );
    };

    const ViewLessonModal = ({ isOpen, onClose, onUpdate, onDelete, lesson }) => {
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
                alert('Введите название урока');
                return;
            }
            if (!formData.shortName.trim()) {
                alert('Введите краткое название урока');
                return;
            }
            setSaving(true);
            try {
                await onUpdate({ ...formData, id: lesson.id });
                setIsEditing(false);
                onClose();
            } catch (err) {
                console.error('Update error:', err);
                alert(err.response?.data?.message || 'Ошибка при обновлении');
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
                    alert('Ошибка при удалении');
                } finally {
                    setSaving(false);
                }
            }
        };

        if (!isOpen || !lesson) return null;

        return (
            <div className="modal-overlay-fixed" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
                <div className="modal-content-fixed" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
                    <div className={`modal-header-fixed ${isEditing ? 'editing' : ''}`} style={{ background: isEditing ? '#f59e0b' : '#21435A' }}>
                        <h3>{isEditing ? <FaEdit /> : <FaBook />}{isEditing ? 'Редактирование урока' : lesson.name}</h3>
                        <button className="modal-close-fixed" onClick={() => !saving && onClose()} disabled={saving}><FaTimes /></button>
                    </div>
                    <div className="modal-body-fixed">
                        {isEditing ? (
                            <>
                                <div className="form-group"><label>Название урока *</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={saving} autoFocus /></div>
                                <div className="form-group"><label>Краткое название (отображается в карточке) *</label><input type="text" value={formData.shortName} onChange={e => setFormData({...formData, shortName: e.target.value})} disabled={saving} placeholder="Напр: Мат." /><small>Будет отображаться в расписании</small></div>
                            </>
                        ) : (
                            <>
                                <div className="lesson-detail-item"><strong>Название:</strong><p>{lesson.name}</p></div>
                                <div className="lesson-detail-item"><strong>Краткое название:</strong><p>{lesson.shortName || lesson.short_name || '—'}</p></div>
                                <div className="lesson-detail-item"><strong>ID:</strong><p>{lesson.id}</p></div>
                                <div className="lesson-detail-item"><strong>Дата создания:</strong><p>{lesson.created_at ? new Date(lesson.created_at).toLocaleString('ru-RU') : '-'}</p></div>
                            </>
                        )}
                    </div>
                    <div className="modal-footer-fixed">
                        {isEditing ? (
                            <>
                                <button className="btn-cancel-modal" onClick={() => setIsEditing(false)} disabled={saving}>Отмена</button>
                                <button className="btn-save-modal" onClick={handleUpdate} disabled={saving}><FaSave /> {saving ? 'Сохранение...' : 'Сохранить'}</button>
                            </>
                        ) : (
                            <>
                                <button className="btn-cancel-modal" onClick={() => !saving && onClose()} disabled={saving}>Закрыть</button>
                                <button className="btn-edit-modal" onClick={() => setIsEditing(true)} disabled={saving}><FaEdit /> Редактировать</button>
                                <button className="btn-delete-modal" onClick={handleDelete} disabled={saving} style={{ background: '#dc2626' }}><FaTrash /> Удалить</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const UploadLessonsModal = ({ isOpen, onClose, onUpload }) => {
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
                alert('Пожалуйста, загрузите файл Excel (.xlsx или .xls)');
            }
        };

        const handleFileChange = (e) => {
            const selectedFile = e.target.files[0];
            if (selectedFile && selectedFile.name.match(/\.(xlsx|xls)$/)) {
                processFile(selectedFile);
            } else if (selectedFile) {
                alert('Пожалуйста, выберите файл Excel (.xlsx или .xls)');
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
                        alert('Файл должен содержать заголовки и данные');
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
                        alert('Не найдено данных для загрузки');
                        setFile(null);
                        return;
                    }

                    setPreviewData(parsedData);
                } catch (err) {
                    console.error('Error parsing Excel:', err);
                    alert('Ошибка при чтении файла. Проверьте формат данных.');
                    setFile(null);
                }
            };
            reader.readAsArrayBuffer(selectedFile);
        };

        const handleUpload = async () => {
            if (!file) {
                alert('Выберите файл');
                return;
            }

            if (previewData.length === 0) {
                alert('Нет данных для загрузки');
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
            <div className="upload-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !uploading) onClose(); }}>
                <div className="upload-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="upload-modal-header">
                        <div className="upload-header-icon"><FaFileExcel /></div>
                        <h3>Загрузка уроков из Excel</h3>
                        <button className="upload-modal-close" onClick={() => !uploading && onClose()} disabled={uploading}><FaTimes /></button>
                    </div>

                    <div className="upload-modal-body">
                        <div className="upload-instructions-card">
                            <div className="instructions-header"><FaFileExcel className="instructions-icon" /><span>Инструкция по загрузке</span></div>
                            <ul className="instructions-list">
                                <li>Файл должен быть в формате <strong>.xlsx</strong> или <strong>.xls</strong></li>
                                <li>Первая строка — заголовки: <strong>Название урока</strong>, <strong>Краткое название</strong></li>
                                <li>Краткое название будет отображаться в карточке урока</li>
                            </ul>
                            <button className="download-template-btn" onClick={downloadTemplate}><FaDownload /> Скачать шаблон Excel</button>
                        </div>

                        <div className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${file ? 'file-selected' : ''}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                            <input type="file" id="excel-upload" accept=".xlsx,.xls" onChange={handleFileChange} style={{ display: 'none' }} />
                            <label htmlFor="excel-upload" className="upload-dropzone-label">
                                {!file ? (
                                    <>
                                        <FaFileExcel className="dropzone-icon" />
                                        <div className="dropzone-text">
                                            <span className="dropzone-title">Перетащите файл сюда или кликните для выбора</span>
                                            <span className="dropzone-subtitle">Поддерживаются файлы .xlsx и .xls</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <FaFileExcel className="dropzone-icon file-icon" />
                                        <div className="dropzone-text">
                                            <span className="dropzone-file-name">{file.name}</span>
                                            <span className="dropzone-file-size">{(file.size / 1024).toFixed(2)} KB</span>
                                        </div>
                                        <button className="remove-file-btn" onClick={(e) => { e.preventDefault(); setFile(null); setPreviewData([]); setUploadStatus(null); }}><FaTimes /></button>
                                    </>
                                )}
                            </label>
                        </div>

                        {uploading && (
                            <div className="upload-progress-container">
                                <div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadProgress}%` }} /></div>
                                <span className="progress-text">{uploadProgress}%</span>
                            </div>
                        )}

                        {uploadStatus === 'success' && <div className="upload-status success"><FaCheck /><span>Уроки успешно загружены!</span></div>}
                        {uploadStatus === 'error' && <div className="upload-status error"><FaExclamationTriangle /><span>Ошибка при загрузке. Попробуйте снова.</span></div>}

                        {previewData.length > 0 && !uploadStatus && (
                            <div className="upload-preview">
                                <div className="preview-header"><span className="preview-title"><FaBook /> Предпросмотр ({previewData.length} уроков)</span><span className="preview-note">Будут добавлены следующие уроки:</span></div>
                                <div className="preview-table-wrapper">
                                    <table className="preview-table">
                                        <thead>
                                            <tr><th>#</th><th>Название урока</th><th>Краткое название</th></tr>
                                        </thead>
                                        <tbody>
                                            {previewData.slice(0, 10).map((lesson, idx) => (
                                                <tr key={idx}><td>{idx + 1}</td><td><strong>{lesson.name}</strong></td><td>{lesson.shortName || '—'}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {previewData.length > 10 && <div className="preview-more">и ещё {previewData.length - 10} уроков...</div>}
                            </div>
                        )}
                    </div>

                    <div className="upload-modal-footer">
                        <button className="btn-cancel" onClick={() => !uploading && onClose()} disabled={uploading}>Отмена</button>
                        <button className={`btn-upload ${!file || uploading ? 'disabled' : ''}`} onClick={handleUpload} disabled={!file || uploading}>
                            {uploading ? <><FaSpinner className="spinner" /> Загрузка...</> : <><FaUpload /> Загрузить уроки</>}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {notification && <div className="notification">{notification}</div>}
            <div className="lessons-container">
                <div className="lessons-actions">
                    <button className="add-room-btn upload-btn" onClick={() => setUploadLessonsModalOpen(true)}><FaFileExcel /> Загрузить из Excel</button>
                    <button className="add-room-btn" onClick={() => setAddLessonModalOpen(true)}><FaPlus /> Добавить вручную</button>
                    <button className="add-room-btn" onClick={handleExportLessons} style={{ background: '#10b981' }}><FaDownload /> Экспорт в Excel</button>
                    {selectedLessons.length > 0 && (<button className="add-room-btn" onClick={handleBulkDeleteLessons} style={{ background: '#dc2626' }}><FaTrash /> Удалить выбранные ({selectedLessons.length})</button>)}
                </div>
                <div className="table-container">
                    <h3 className="table-title">
                        <FaBook /> Список уроков ({lessons.length})
                        {lessons.length > 0 && (<label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                            <input type="checkbox" checked={selectAllLessons} onChange={handleSelectAllLessons} /> Выбрать все
                        </label>)}
                    </h3>
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr><th style={{ width: '40px' }}></th><th>ID</th><th>Название урока</th><th>Краткое название</th><th>Действия</th></tr>
                            </thead>
                            <tbody>
                                {lessons.length > 0 ? lessons.map(lesson => (
                                    <tr key={lesson.id}>
                                        <td><input type="checkbox" checked={selectedLessons.includes(lesson.id)} onChange={() => handleToggleLessonSelection(lesson.id)} style={{ accentColor: 'var(--primary)' }} /></td>
                                        <td>{lesson.id}</td>
                                        <td><strong>{lesson.name}</strong></td>
                                        <td>{lesson.shortName || lesson.short_name || '—'}</td>
                                        <td className="action-cell">
                                            <button onClick={() => { setSelectedLesson(lesson); setViewLessonModalOpen(true); }} className="action-button view-button"><FaEye /> Просмотр</button>
                                            <button onClick={() => handleDeleteLesson(lesson.id, lesson.name)} className="action-button delete-button" style={{ background: '#dc2626' }}><FaTrash /> Удалить</button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="5" className="empty-row"><FaBook /><p>Нет загруженных уроков</p><div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}><button onClick={() => setUploadLessonsModalOpen(true)}>Загрузить из Excel</button><button onClick={() => setAddLessonModalOpen(true)}>Добавить вручную</button></div></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <AddLessonModal isOpen={addLessonModalOpen} onClose={() => setAddLessonModalOpen(false)} onSave={handleAddLessonManually} />
            <ViewLessonModal isOpen={viewLessonModalOpen} onClose={() => setViewLessonModalOpen(false)} onUpdate={handleUpdateLesson} onDelete={handleDeleteLesson} lesson={selectedLesson} />
            <UploadLessonsModal isOpen={uploadLessonsModalOpen} onClose={() => setUploadLessonsModalOpen(false)} onUpload={handleUploadLessons} />
        </>
    );
};

export default LessonsTab;