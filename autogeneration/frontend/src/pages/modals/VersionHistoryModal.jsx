// modals/VersionHistoryModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaHistory, FaTimes, FaEye, FaCloudUploadAlt, FaCheckCircle, 
  FaEdit, FaSpinner, FaExclamationTriangle, FaCalendarAlt, 
  FaUser, FaFileAlt 
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const VersionHistoryModal = ({ 
  isOpen, 
  onClose, 
  versions, 
  onLoadVersion, 
  onPublishVersion, 
  currentVersionId,
  onDeleteVersion,
  onCompareVersions
}) => {
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Фильтрация версий
  const filteredVersions = React.useMemo(() => {
    let filtered = [...versions];
    
    if (searchTerm) {
      filtered = filtered.filter(v => 
        v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `v${v.version_number}`.includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }
    
    return filtered;
  }, [versions, searchTerm, statusFilter]);

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <span className="status-badge published"><FaCheckCircle /> Опубликовано</span>;
      case 'draft':
        return <span className="status-badge draft"><FaEdit /> Черновик</span>;
      case 'archived':
        return <span className="status-badge archived"><FaHistory /> Архив</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published': return <FaCheckCircle />;
      case 'draft': return <FaEdit />;
      case 'archived': return <FaHistory />;
      default: return <FaFileAlt />;
    }
  };

  const handleLoadVersion = async (version) => {
    if (loading) return;
    setLoading(true);
    try {
      await onLoadVersion(version);
      onClose();
    } catch (err) {
      console.error('Error loading version:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishVersion = async (version) => {
    if (loading) return;
    if (!window.confirm(`Опубликовать версию "${version.name || 'версия ' + version.version_number}"?`)) return;
    
    setLoading(true);
    try {
      await onPublishVersion(version);
    } catch (err) {
      console.error('Error publishing version:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVersion = async (version) => {
    if (!window.confirm(`Удалить версию "${version.name || 'версия ' + version.version_number}"? Это действие нельзя отменить.`)) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/schedule/version/${version.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Обновить список версий
      if (onDeleteVersion) {
        await onDeleteVersion(version.id);
      }
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting version:', err);
      alert('Ошибка при удалении версии');
    } finally {
      setLoading(false);
    }
  };

  const handleCompareToggle = (versionId) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      }
      if (prev.length >= 2) {
        alert('Можно сравнить только две версии');
        return prev;
      }
      return [...prev, versionId];
    });
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2 && onCompareVersions) {
      onCompareVersions(selectedVersions);
      onClose();
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="version-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><FaHistory /> История версий расписания</h3>
          <button className="close-modal" onClick={onClose}><FaTimes /></button>
        </div>
        
        <div className="modal-content">
          {/* Фильтры */}
          <div className="version-filters">
            <div className="search-wrapper">
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="all">Все статусы</option>
              <option value="published">Опубликованные</option>
              <option value="draft">Черновики</option>
              <option value="archived">Архивные</option>
            </select>
            
            {(searchTerm || statusFilter !== 'all') && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                <FaTimes /> Очистить
              </button>
            )}
          </div>

          {/* Кнопка сравнения */}
          {selectedVersions.length === 2 && (
            <div className="compare-bar">
              <span>Выбрано для сравнения: {selectedVersions.length} версии</span>
              <button className="compare-btn" onClick={handleCompare}>
                <FaHistory /> Сравнить
              </button>
              <button className="cancel-compare-btn" onClick={() => setSelectedVersions([])}>
                <FaTimes /> Отмена
              </button>
            </div>
          )}

          {/* Таблица версий */}
          {filteredVersions.length === 0 ? (
            <div className="empty-versions">
              <FaHistory />
              <p>Нет версий расписания</p>
              {searchTerm && <p className="hint">Попробуйте изменить параметры поиска</p>}
            </div>
          ) : (
            <div className="versions-table-wrapper">
              <table className="versions-table">
                <thead>
                  <tr>
                    {onCompareVersions && <th></th>}
                    <th>Версия</th>
                    <th>Название</th>
                    <th>Дата</th>
                    <th>Статус</th>
                    <th>Уроков</th>
                    <th>Автор</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVersions.map(v => (
                    <tr key={v.id} className={currentVersionId === v.id ? 'current-version' : ''}>
                      {/* Чекбокс для сравнения */}
                      {onCompareVersions && (
                        <td className="checkbox-cell">
                          <input
                            type="checkbox"
                            checked={selectedVersions.includes(v.id)}
                            onChange={() => handleCompareToggle(v.id)}
                            disabled={v.status === 'archived' || loading}
                          />
                        </td>
                      )}
                      
                      {/* Номер версии */}
                      <td className="version-number">
                        <span className="version-badge">v{v.version_number}</span>
                        {currentVersionId === v.id && (
                          <span className="current-badge">Текущая</span>
                        )}
                      </td>
                      
                      {/* Название */}
                      <td className="version-name">
                        <strong>{v.name || `Черновик ${new Date(v.created_at).toLocaleDateString()}`}</strong>
                        {v.description && (
                          <div className="version-description">{v.description}</div>
                        )}
                      </td>
                      
                      {/* Дата */}
                      <td className="version-date">
                        <FaCalendarAlt />
                        <span>{formatDate(v.created_at)}</span>
                      </td>
                      
                      {/* Статус */}
                      <td className="version-status">
                        {getStatusBadge(v.status)}
                      </td>
                      
                      {/* Количество уроков */}
                      <td className="version-lessons">
                        <span className="lessons-count">{v.lessons_count || 0}</span>
                        <span className="lessons-label">уроков</span>
                      </td>
                      
                      {/* Автор */}
                      <td className="version-author">
                        <FaUser />
                        <span>{v.created_by_name || 'Система'}</span>
                      </td>
                      
                      {/* Действия */}
                      <td className="actions">
                        <button 
                          onClick={() => handleLoadVersion(v)} 
                          className="version-btn load" 
                          title="Загрузить версию"
                          disabled={loading}
                        >
                          <FaEye />
                        </button>
                        
                        {v.status !== 'published' && (
                          <button 
                            onClick={() => handlePublishVersion(v)} 
                            className="version-btn publish" 
                            title="Опубликовать"
                            disabled={loading}
                          >
                            <FaCloudUploadAlt />
                          </button>
                        )}
                        
                        {v.status !== 'published' && deleteConfirm === v.id ? (
                          <div className="delete-confirm">
                            <button 
                              onClick={() => handleDeleteVersion(v)}
                              className="version-btn confirm-delete"
                            >
                              Да
                            </button>
                            <button 
                              onClick={() => setDeleteConfirm(null)}
                              className="version-btn cancel-delete"
                            >
                              Нет
                            </button>
                          </div>
                        ) : (
                          v.status !== 'published' && (
                            <button 
                              onClick={() => setDeleteConfirm(v.id)} 
                              className="version-btn delete" 
                              title="Удалить"
                              disabled={loading}
                            >
                              <FaTimes />
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Статистика */}
          {versions.length > 0 && (
            <div className="versions-stats">
              <div className="stat-item">
                <FaHistory />
                <span>Всего версий: {versions.length}</span>
              </div>
              <div className="stat-item">
                <FaCheckCircle />
                <span>Опубликовано: {versions.filter(v => v.status === 'published').length}</span>
              </div>
              <div className="stat-item">
                <FaEdit />
                <span>Черновиков: {versions.filter(v => v.status === 'draft').length}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Закрыть
          </button>
          {selectedVersions.length === 2 && (
            <button className="btn-primary" onClick={handleCompare}>
              <FaHistory /> Сравнить версии
            </button>
          )}
        </div>
      </div>
      
      {/* Индикатор загрузки */}
      {loading && (
        <div className="loading-overlay">
          <FaSpinner className="spinner" />
          <span>Загрузка...</span>
        </div>
      )}
    </div>
  );
};

// Сравнение пропсов для оптимизации
const areEqual = (prevProps, nextProps) => {
  return prevProps.isOpen === nextProps.isOpen &&
         prevProps.versions === nextProps.versions &&
         prevProps.currentVersionId === nextProps.currentVersionId;
};

export default React.memo(VersionHistoryModal, areEqual);