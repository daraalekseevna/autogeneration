import './styles/global-theme.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import MainContent from './pages/MainContent';
import ExcelGenerator from './pages/ExcelGenerator';
import ScheduleViewer from './pages/ScheduleViewer';
import ExtracurricularActivities from './pages/ExtracurricularActivities';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import TeacherSchedule from './pages/TeacherSchedule';
import TeacherMySchedule from './pages/TeacherMySchedule';
import TeacherClassManagement from './pages/TeacherClassManagement';
import ClassSchedule from './pages/ClassSchedule';
import AdminScheduleEditor from './pages/AdminScheduleEditor';
import AdminFullScheduleEditor from './pages/AdminFullScheduleEditor';

import './App.css';

function App() {
    return (
        <Router>
            <div className="app">
                <main className="main-wrapper">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        
                        <Route path="/" element={
                            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                                <MainContent />
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/generate" element={
                            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                                <ExcelGenerator />
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/admin/schedule" element={
                            <ProtectedRoute allowedRoles={['admin', 'superadmin', 'teacher', 'class']}>
                                <ScheduleViewer />
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/admin/schedule-editor" element={
                            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                                <AdminScheduleEditor />
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/extracurricular" element={
                            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                                <ExtracurricularActivities />
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/class/extracurricular" element={
                            <ProtectedRoute allowedRoles={['class']}>
                                <ExtracurricularActivities />
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/superadmin" element={
                            <ProtectedRoute allowedRoles={['superadmin']}>
                                <SuperAdminDashboard />
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/teacher" element={
                            <ProtectedRoute allowedRoles={['teacher']}>
                                <TeacherSchedule />
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/teacher/my-schedule" element={
                            <ProtectedRoute allowedRoles={['teacher']}>
                                <TeacherMySchedule />
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/teacher/class-management" element={
                            <ProtectedRoute allowedRoles={['teacher']}>
                                <TeacherClassManagement />
                            </ProtectedRoute>
                        } />
                       
                        <Route path="/admin/full-schedule" element={
                            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                                <AdminFullScheduleEditor />
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/class" element={
                            <ProtectedRoute allowedRoles={['class']}>
                                <ClassSchedule />
                            </ProtectedRoute>
                        } />
                        
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
