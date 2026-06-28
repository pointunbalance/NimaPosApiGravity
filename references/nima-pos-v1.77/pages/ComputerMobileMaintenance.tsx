import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ComputerMobileDashboard from './maintenance/ComputerMobileDashboard';
import ComputerMobileOrders from './maintenance/ComputerMobileOrders';
import ComputerMobileExpress from './maintenance/ComputerMobileExpress';
import ComputerMobileParts from './maintenance/ComputerMobileParts';
import ComputerMobileTechnicians from './maintenance/ComputerMobileTechnicians';
import ComputerMobileFinancials from './maintenance/ComputerMobileFinancials';
import ComputerMobileDelivery from './maintenance/ComputerMobileDelivery';
import ComputerMobileShelves from './maintenance/ComputerMobileShelves';
import ComputerMobileApprovals from './maintenance/ComputerMobileApprovals';
import ComputerMobileRMA from './maintenance/ComputerMobileRMA';
import ComputerMobileAbandoned from './maintenance/ComputerMobileAbandoned';
import ComputerMobileOutsourcing from './maintenance/ComputerMobileOutsourcing';
import ComputerMobileCouriers from './maintenance/ComputerMobileCouriers';
import ComputerMobileB2BContracts from './maintenance/ComputerMobileB2BContracts';
import ComputerMobileInternalTools from './maintenance/ComputerMobileInternalTools';
import ComputerMobileOfflineSync from './maintenance/ComputerMobileOfflineSync';

const ComputerMobileMaintenance: React.FC = () => {
  const location = useLocation();
  const [subPageTab, setSubPageTab] = useState<'dashboard' | 'orders' | 'express' | 'parts' | 'technicians' | 'financials' | 'delivery' | 'shelves' | 'approvals' | 'rma' | 'abandoned' | 'outsourcing' | 'couriers' | 'b2b-contracts' | 'internal-tools' | 'offline-sync'>('dashboard');

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/orders')) {
      setSubPageTab('orders');
    } else if (path.includes('/express')) {
      setSubPageTab('express');
    } else if (path.includes('/parts')) {
      setSubPageTab('parts');
    } else if (path.includes('/technicians')) {
      setSubPageTab('technicians');
    } else if (path.includes('/financials')) {
      setSubPageTab('financials');
    } else if (path.includes('/delivery')) {
      setSubPageTab('delivery');
    } else if (path.includes('/shelves')) {
      setSubPageTab('shelves');
    } else if (path.includes('/approvals')) {
      setSubPageTab('approvals');
    } else if (path.includes('/rma')) {
      setSubPageTab('rma');
    } else if (path.includes('/abandoned')) {
      setSubPageTab('abandoned');
    } else if (path.includes('/outsourcing')) {
      setSubPageTab('outsourcing');
    } else if (path.includes('/couriers')) {
      setSubPageTab('couriers');
    } else if (path.includes('/b2b-contracts')) {
      setSubPageTab('b2b-contracts');
    } else if (path.includes('/internal-tools')) {
      setSubPageTab('internal-tools');
    } else if (path.includes('/offline-sync')) {
      setSubPageTab('offline-sync');
    } else {
      setSubPageTab('dashboard');
    }
  }, [location.pathname]);

  return (
    <>
      {subPageTab === 'dashboard' && <ComputerMobileDashboard />}
      {subPageTab === 'orders' && <ComputerMobileOrders />}
      {subPageTab === 'express' && <ComputerMobileExpress />}
      {subPageTab === 'parts' && <ComputerMobileParts />}
      {subPageTab === 'technicians' && <ComputerMobileTechnicians />}
      {subPageTab === 'financials' && <ComputerMobileFinancials />}
      {subPageTab === 'delivery' && <ComputerMobileDelivery />}
      {subPageTab === 'shelves' && <ComputerMobileShelves />}
      {subPageTab === 'approvals' && <ComputerMobileApprovals />}
      {subPageTab === 'rma' && <ComputerMobileRMA />}
      {subPageTab === 'abandoned' && <ComputerMobileAbandoned />}
      {subPageTab === 'outsourcing' && <ComputerMobileOutsourcing />}
      {subPageTab === 'couriers' && <ComputerMobileCouriers />}
      {subPageTab === 'b2b-contracts' && <ComputerMobileB2BContracts />}
      {subPageTab === 'internal-tools' && <ComputerMobileInternalTools />}
      {subPageTab === 'offline-sync' && <ComputerMobileOfflineSync />}
    </>
  );
};

export default ComputerMobileMaintenance;
