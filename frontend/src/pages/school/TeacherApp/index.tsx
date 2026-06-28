import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { TeacherAppLogin } from './TeacherAppLogin';
import { TeacherAppLayout } from './TeacherAppLayout';
import { TeacherAppDashboard } from './TeacherAppDashboard';
import { StudentProfileView } from './StudentProfileView';

export const TeacherAppRouter = () => {
    return (
        <Routes>
            <Route path="login" element={<TeacherAppLogin />} />
            <Route path="" element={<TeacherAppLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<TeacherAppDashboard />} />
                <Route path="student/:id" element={<StudentProfileView />} />
            </Route>
        </Routes>
    );
};

export default TeacherAppRouter;
