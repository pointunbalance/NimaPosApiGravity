import React from 'react';
import { Bus, Users, MapPin, DollarSign } from 'lucide-react';
import { useTransport } from '../../components/school/transport/useTransport';
import { SchoolRouteModal } from '../../components/school/transport/SchoolRouteModal';
import { SchoolSubModal } from '../../components/school/transport/SchoolSubModal';
import { SchoolTripModal } from '../../components/school/transport/SchoolTripModal';
import { SchoolExpenseModal } from '../../components/school/transport/SchoolExpenseModal';
import ConfirmModal from '../../components/ui/ConfirmModal';

import { TransportRoutesTab } from '../../components/school/transport/TransportRoutesTab';
import { TransportSubscribersTab } from '../../components/school/transport/TransportSubscribersTab';
import { TransportTripsTab } from '../../components/school/transport/TransportTripsTab';
import { TransportExpensesTab } from '../../components/school/transport/TransportExpensesTab';

export const Transport = () => {
  const {
    activeTab,
    setActiveTab,
    students,
    staff,
    routes,
    subscribers,
    trips,
    logs,
    routeModalOpen,
    setRouteModalOpen,
    routeFormData,
    setRouteFormData,
    subModalOpen,
    setSubModalOpen,
    subFormData,
    setSubFormData,
    tripModalOpen,
    setTripModalOpen,
    tripFormData,
    setTripFormData,
    expenseModalOpen,
    setExpenseModalOpen,
    expenseFormData,
    setExpenseFormData,
    expenses,
    confirmOpen,
    setConfirmOpen,
    confirmParams,
    getStudentName,
    getStaffName,
    getRouteName,
    handleSaveRoute,
    handleSaveSub,
    handleStartTrip,
    handleCompleteTrip,
    handleStudentAction,
    handleSaveExpense,
  } = useTransport();

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة الباص والمواصلات</h1>
          <p className="text-slate-500 mt-1">المسارات، المشرفات، الطلاب، حركة السير، والمصروفات</p>
        </div>
      </div>

      <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab('routes')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'routes' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <MapPin className="w-5 h-5" /> المسارات وخطوط السير
        </button>
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'subscribers' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Users className="w-5 h-5" /> المشتركين والتجميع
        </button>
        <button
          onClick={() => setActiveTab('trips')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'trips' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Bus className="w-5 h-5" /> الرحلات والتوصيل المباشر
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'expenses' ? 'bg-rose-50 text-rose-700' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="w-5 h-5" /> تقرير المصروفات
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-6">
          {activeTab === 'routes' && (
            <TransportRoutesTab
              routes={routes}
              subscribers={subscribers}
              getStaffName={getStaffName}
              setRouteFormData={setRouteFormData}
              setRouteModalOpen={setRouteModalOpen}
            />
          )}

          {activeTab === 'subscribers' && (
            <TransportSubscribersTab
              subscribers={subscribers}
              getStudentName={getStudentName}
              getRouteName={getRouteName}
              setSubFormData={setSubFormData}
              setSubModalOpen={setSubModalOpen}
            />
          )}

          {activeTab === 'trips' && (
            <TransportTripsTab
              trips={trips}
              subscribers={subscribers}
              logs={logs}
              getRouteName={getRouteName}
              getStudentName={getStudentName}
              setTripFormData={setTripFormData}
              setTripModalOpen={setTripModalOpen}
              handleCompleteTrip={handleCompleteTrip}
              handleStudentAction={handleStudentAction}
            />
          )}

          {activeTab === 'expenses' && (
            <TransportExpensesTab
              expenses={expenses}
              setExpenseModalOpen={setExpenseModalOpen}
            />
          )}
        </div>
      </div>

      <SchoolRouteModal
        routeModalOpen={routeModalOpen}
        setRouteModalOpen={setRouteModalOpen}
        handleSaveRoute={handleSaveRoute}
        routeFormData={routeFormData}
        setRouteFormData={setRouteFormData}
        staff={staff}
      />

      <SchoolSubModal
        subModalOpen={subModalOpen}
        setSubModalOpen={setSubModalOpen}
        handleSaveSub={handleSaveSub}
        subFormData={subFormData}
        setSubFormData={setSubFormData}
        students={students}
        routes={routes}
      />

      <SchoolTripModal
        tripModalOpen={tripModalOpen}
        setTripModalOpen={setTripModalOpen}
        handleStartTrip={handleStartTrip}
        tripFormData={tripFormData}
        setTripFormData={setTripFormData}
        routes={routes}
      />

      <SchoolExpenseModal
        expenseModalOpen={expenseModalOpen}
        setExpenseModalOpen={setExpenseModalOpen}
        handleSaveExpense={handleSaveExpense}
        expenseFormData={expenseFormData}
        setExpenseFormData={setExpenseFormData}
        routes={routes}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        title={confirmParams?.title || ""}
        message={confirmParams?.message || ""}
        onConfirm={() => {
          if (confirmParams?.onConfirm) confirmParams.onConfirm();
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default Transport;
