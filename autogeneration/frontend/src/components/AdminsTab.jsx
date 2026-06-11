// AdminsTab.jsx
import React, { useState } from 'react';
import { 
    FaUserPlus, FaUsers, FaEdit, FaTrash, FaSave, FaTimes, 
    FaCheck, FaExclamationTriangle, FaUserCog
} from 'react-icons/fa';
import axios from 'axios';
import '../styles/AdminsTab.css';
import '../styles/SuperAdmin.css';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminsTab = ({ admins, token, onDataChange }) => {
    const [newAdmin, setNewAdmin] = useState({ login: '', password: '', name: '' });
    const [editAdminModalOpen, setEditAdminModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: 'success' });

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const clearAdminForm = () => setNewAdmin({ login: '', password: '', name: '' });

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        if (!newAdmin.login || !newAdmin.password || !newAdmin.name) {
            showNotification('Заполните все поля', 'error');
            return;
        }
        try {
            await axios.post(`${API_URL}/superadmin/admins`, newAdmin, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Администратор добавлен');
            clearAdminForm();
            onDataChange();
        } catch (err) {
            console.error('Add admin error:', err);
            showNotification(err.response?.data?.message || 'Ошибка', 'error');
        }
    };

    const handleDeleteAdmin = async (id) => {
        if (!window.confirm('Удалить администратора?')) return;
        try {
            await axios.delete(`${API_URL}/superadmin/admins/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Администратор удалён');
            onDataChange();
        } catch (err) {
            console.error('Delete admin error:', err);
            showNotification('Ошибка удаления', 'error');
        }
    };

    const handleUpdateAdmin = async (adminData) => {
        try {
            await axios.put(`${API_URL}/superadmin/admins/${adminData.id}`, adminData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('Администратор обновлен');
            onDataChange();
            setEditAdminModalOpen(false);
            setEditingAdmin(null);
        } catch (err) {
            console.error('Update admin error:', err);
            showNotification(err.response?.data?.message || 'Ошибка обновления', 'error');
            throw err;
        }
    };

    // Модалка редактирования
    const EditAdminModal = ({ isOpen, onClose, onSave, admin }) => {
        const [formData, setFormData] = useState({ name: '', login: '' });
        const [saving, setSaving] = useState(false);

        React.useEffect(() => {
            if (admin && isOpen) {
                setFormData({ name: admin.name || '', login: admin.login || '' });
            }
        }, [admin, isOpen]);

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (saving) return;
            if (!formData.name) {
                showNotification('Заполните ФИО', 'error');
                return;
            }
            setSaving(true);
            try {
                await onSave({ ...formData, id: admin?.id });
                onClose();
            } catch (err) {
                console.error('Save error:', err);
            } finally {
                setSaving(false);
            }
        };

        if (!isOpen) return null;

        return (
            <div className="admins-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
                <div className="admins-modal-content">
                    <div className="admins-modal-header">
                        <FaEdit />
                        <h3>Редактировать администратора</h3>
                        <button className="admins-modal-close" onClick={() => !saving && onClose()} disabled={saving}>
                            <FaTimes />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="admins-modal-body">
                            <div className="admins-modal-form-group">
                                <label>ФИО *</label>
                                <input 
                                    type="text" 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                    disabled={saving} 
                                    placeholder="Иванов Иван Иванович"
                                />
                            </div>
                            <div className="admins-modal-form-group">
                                <label>Логин</label>
                                <input 
                                    type="text" 
                                    value={formData.login} 
                                    disabled 
                                />
                                <small>Логин нельзя изменить</small>
                            </div>
                        </div>
                        <div className="admins-modal-footer">
                            <button type="button" className="admins-modal-cancel" onClick={() => !saving && onClose()} disabled={saving}>
                                Отмена
                            </button>
                            <button type="submit" className="admins-modal-save" disabled={saving}>
                                <FaSave /> {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const adminsArray = Array.isArray(admins) ? admins : [];

    return (
        <>
            {notification.message && (
                <div className={`admins-notification ${notification.type}`}>
                    {notification.type === 'success' ? <FaCheck size={14} /> : <FaExclamationTriangle size={14} />}
                    <span>{notification.message}</span>
                </div>
            )}
            
            <div className="admins-container-modern">
                <div className="admins-content-grid">
                    {/* Форма добавления администратора */}
                    <div className="admins-form-card">
                        <div className="admins-form-header">
                            <FaUserPlus size={18} />
                            <h3>Новый администратор</h3>
                        </div>
                        <div className="admins-form-body">
                            <form onSubmit={handleAddAdmin}>
                                <div className="admins-form-group">
                                    <label>Логин *</label>
                                    <input 
                                        type="text" 
                                        value={newAdmin.login} 
                                        onChange={(e) => setNewAdmin({...newAdmin, login: e.target.value})} 
                                        required 
                                        placeholder="Введите логин"
                                    />
                                </div>
                                <div className="admins-form-group">
                                    <label>Пароль *</label>
                                    <input 
                                        type="password" 
                                        value={newAdmin.password} 
                                        onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})} 
                                        required 
                                        placeholder="Введите пароль"
                                    />
                                </div>
                                <div className="admins-form-group">
                                    <label>ФИО *</label>
                                    <input 
                                        type="text" 
                                        value={newAdmin.name} 
                                        onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})} 
                                        required 
                                        placeholder="Иванов Иван Иванович"
                                    />
                                </div>
                                <button type="submit" className="admins-submit-btn">
                                    <FaUserPlus size={14} /> Добавить администратора
                                </button>
                            </form>
                        </div>
                    </div>
                    
                    {/* Таблица администраторов */}
                    <div className="admins-table-card">
                        <div className="admins-table-header">
                            <div className="admins-table-title">
                                <FaUsers size={18} />
                                <h3>Список администраторов</h3>
                                <span className="admins-count-badge">{adminsArray.length}</span>
                            </div>
                        </div>
                        
                        <div className="admins-table-wrapper">
                            <table className="admins-table">
                                <thead>
                                    <tr>
                                        <th>Логин</th>
                                        <th>ФИО</th>
                                        <th style={{ width: '100px' }}>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {adminsArray.length > 0 ? adminsArray.map(a => (
                                        <tr key={a.id} className="admins-row">
                                            <td className="admins-login">{a.login}</td>
                                            <td className="admins-name">{a.name}</td>
                                            <td className="admins-actions-cell">
                                                <button 
                                                    onClick={() => { setEditingAdmin(a); setEditAdminModalOpen(true); }} 
                                                    className="admins-action-icon edit" 
                                                    title="Редактировать"
                                                >
                                                    <FaEdit size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteAdmin(a.id)} 
                                                    className="admins-action-icon delete" 
                                                    title="Удалить"
                                                >
                                                    <FaTrash size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr className="admins-empty-row">
                                            <td colSpan="3">
                                                <div className="admins-empty-state">
                                                    <div className="admins-empty-icon">
                                                        <FaUsers size={48} />
                                                    </div>
                                                    <h4>Нет администраторов</h4>
                                                    <p>Добавьте первого администратора, заполнив форму слева</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <EditAdminModal 
                isOpen={editAdminModalOpen} 
                onClose={() => setEditAdminModalOpen(false)} 
                onSave={handleUpdateAdmin} 
                admin={editingAdmin} 
            />
        </>
    );
};

export default AdminsTab;