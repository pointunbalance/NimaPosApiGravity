import React from 'react';
import { Cpu } from 'lucide-react';

import { useAccessState } from '../../components/gym/useAccessState';
import { AccessMetrics } from '../../components/gym/AccessMetrics';
import { AccessTerminalHub } from '../../components/gym/AccessTerminalHub';
import { AccessScanLogTable } from '../../components/gym/AccessScanLogTable';
import { AccessRegistrationPanel } from '../../components/gym/AccessRegistrationPanel';
import { AccessIPRelayPanel } from '../../components/gym/AccessIPRelayPanel';
import { AccessPassesPanel } from '../../components/gym/AccessPassesPanel';
import { AccessLogsFormModal } from '../../components/gym/AccessLogsFormModal';

export const AccessControl = () => {
  const {
    search,
    setSearch,
    isModalOpen,
    setIsModalOpen,
    isEdit,
    mainTab,
    setMainTab,
    scannedActionType,
    setScannedActionType,
    scannerInputTab,
    setScannerInputTab,
    activeCameraId,
    setActiveCameraId,
    availableCameras,
    isCameraActive,
    cameraScanError,
    hwSettings,
    setHwSettings,
    lastWedgeInputInfo,
    selectedEnrollMemberId,
    setSelectedEnrollMemberId,
    customEnrollGateToken,
    setCustomEnrollGateToken,
    enrollScanSuccess,
    setEnrollScanSuccess,
    badgeMemberId,
    setBadgeMemberId,
    gateTestStatus,
    gateTestResponse,
    isFingerprintScanning,
    fingerprintProgress,
    lastScanResult,
    records,
    simulationMemberList,
    filteredRecords,
    statsCore,
    currentBadgeMember,
    toggleCameraReceiver,
    runNativeBiometricRegister,
    runNativeBiometricAuthentication,
    enrollCustomTokenKey,
    testIPRelayConnection,
    handleSaveHWSettings,
    handleOpenModal,
    handleSave,
    handleDelete,
    verifyAndTriggerAccessByCode,
    formData,
    setFormData
  } = useAccessState();

  return (
    <div className="p-6 space-y-6 text-right font-sans bg-slate-50/50 min-h-screen" dir="rtl">
      
      {/* Dynamic Keyframe Injection */}
      <style>{`
        @keyframes laser-swipe {
          0%, 100% { top: 4%; }
          50% { top: 96%; }
        }
        .scanner-lasers {
          animation: laser-swipe 2.2s infinite linear;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #gym-printable-badge-card, #gym-printable-badge-card * {
            visibility: visible;
          }
          #gym-printable-badge-card {
            position: absolute;
            left: 50% !important;
            top: 40% !important;
            transform: translate(-50%, -50%) scale(1.4) !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Page Header Area */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl border border-slate-800 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="p-6 md:p-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 border-b border-slate-800/60 relative z-10 flex-row-reverse">
          <div className="flex items-center gap-4.5 flex-row-reverse text-right">
            <span className="p-4 bg-indigo-650 text-indigo-300 border border-indigo-500/25 rounded-2xl flex shrink-0">
              <Cpu className="w-8 h-8 animate-pulse" />
            </span>
            <div className="text-right">
              <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center flex-wrap gap-2 justify-end flex-row-reverse text-right">
                <span>بوابة ربط الأجهزة والتحكم الذكي بالدخول</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                  منظومة نشطة
                </span>
              </h1>
              <p className="text-xs text-slate-300 mt-1.5 max-w-4xl font-semibold leading-relaxed">
                منصة متكاملة للمصادقة وتفعيل بوابات العبور الإلكترونية (Smart Lanes) عبر كاميرات الاستجابة السريعة (QR)، والمستشعرات البيومترية، والتحكم بمرحلات الشبكة المحلية.
              </p>
            </div>
          </div>
        </div>

        {/* Primary Screen Tabs */}
        <div className="flex flex-wrap gap-1 p-3 bg-slate-900/40 relative z-10 border-t border-slate-800/40 flex-row-reverse">
          {[
            { id: 'scanner', label: 'منصة الحضور والتحقق اللحظي' },
            { id: 'enrollment', label: 'برمجة وتشفير هويات المشتركين' },
            { id: 'gate-relays', label: 'الربط بمرحلات البوابات TCP/IP' },
            { id: 'passes', label: 'طباعة وتصدير بطاقات البوابات' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id as any)}
              className={`px-5 py-3 text-xs font-black rounded-xl transition-all duration-200 cursor-pointer ${
                mainTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of KPIs Summary Widgets */}
      <AccessMetrics statsCore={statsCore} />

      {/* Main Workspace Frame Router */}
      {mainTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5">
            <AccessTerminalHub
              scannedActionType={scannedActionType}
              setScannedActionType={setScannedActionType}
              scannerInputTab={scannerInputTab}
              setScannerInputTab={setScannerInputTab}
              isCameraActive={isCameraActive}
              toggleCameraReceiver={toggleCameraReceiver}
              availableCameras={availableCameras}
              activeCameraId={activeCameraId}
              setActiveCameraId={setActiveCameraId}
              cameraScanError={cameraScanError}
              lastWedgeInputInfo={lastWedgeInputInfo}
              hwSettings={hwSettings}
              isFingerprintScanning={isFingerprintScanning}
              fingerprintProgress={fingerprintProgress}
              runNativeBiometricAuthentication={runNativeBiometricAuthentication}
              simulationMemberList={simulationMemberList}
              verifyAndTriggerAccessByCode={verifyAndTriggerAccessByCode}
              lastScanResult={lastScanResult}
            />
          </div>
          <div className="lg:col-span-7">
            <AccessScanLogTable
              search={search}
              setSearch={setSearch}
              filteredRecords={filteredRecords}
              onDeleteLog={handleDelete}
              onManualLog={() => handleOpenModal(false)}
            />
          </div>
        </div>
      )}

      {mainTab === 'enrollment' && (
        <AccessRegistrationPanel
          simulationMemberList={simulationMemberList}
          selectedEnrollMemberId={selectedEnrollMemberId}
          setSelectedEnrollMemberId={setSelectedEnrollMemberId}
          customEnrollGateToken={customEnrollGateToken}
          setCustomEnrollGateToken={setCustomEnrollGateToken}
          enrollCustomTokenKey={enrollCustomTokenKey}
          enrollScanSuccess={enrollScanSuccess}
          setEnrollScanSuccess={setEnrollScanSuccess}
          runNativeBiometricRegister={runNativeBiometricRegister}
          hwSettings={hwSettings}
        />
      )}

      {mainTab === 'gate-relays' && (
        <AccessIPRelayPanel
          hwSettings={hwSettings}
          setHwSettings={setHwSettings}
          onSaveSettings={handleSaveHWSettings}
          gateTestStatus={gateTestStatus}
          gateTestResponse={gateTestResponse}
          testIPRelayConnection={testIPRelayConnection}
        />
      )}

      {mainTab === 'passes' && (
        <AccessPassesPanel
          simulationMemberList={simulationMemberList}
          badgeMemberId={badgeMemberId}
          setBadgeMemberId={setBadgeMemberId}
          currentBadgeMember={currentBadgeMember}
        />
      )}

      {/* Manual log modal alert dialog override */}
      <AccessLogsFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEdit={isEdit}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        simulationMemberList={simulationMemberList}
      />

    </div>
  );
};

export default AccessControl;
