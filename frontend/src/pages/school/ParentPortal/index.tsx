import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ParentPortalLogin } from './ParentPortalLogin';
import { ParentPortalLayout } from './ParentPortalLayout';
import { ParentPortalDashboard } from './ParentPortalDashboard';
import { ParentPortalRequests } from './ParentPortalRequests';

export const ParentPortalRouter = () => {
    return (
        <Routes>
            <Route path="login" element={<ParentPortalLogin />} />
            <Route path="" element={<ParentPortalLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<ParentPortalDashboard />} />
                <Route path="requests" element={<ParentPortalRequests />} />
            </Route>
        </Routes>
    );
};

export default ParentPortalRouter;
