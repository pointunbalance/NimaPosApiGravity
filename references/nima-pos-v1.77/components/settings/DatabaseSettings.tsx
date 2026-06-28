import React, { useState } from "react";
import {
  Server,
  AlertTriangle,
  Plus,
  HardDrive,
  Network,
  Trash2,
  FileCode,
  FolderOpen,
  RotateCcw,
  Play,
  Loader2,
  Shield,
  Download,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { AppSettings, DatabaseProfile } from "../../types";
import { SectionTitle, ToggleSwitch } from "./settingsUtils";
import {
  db,
  exportFullDatabase,
  downloadBackup,
  performBackupToDirectory,
} from "../../db";
import { t } from "../../utils/i18n";

interface DatabaseSettingsProps {
  formData: AppSettings;
  setFormData: (data: AppSettings) => void;
  handleSettingChange: (key: keyof AppSettings, value: any) => void;
}

const DatabaseSettings: React.FC<DatabaseSettingsProps> = ({
  formData,
  setFormData,
  handleSettingChange,
}) => {
  const [newProfileName, setNewProfileName] = useState("");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleAddProfile = () => {
    if (!newProfileName.trim() || !formData) return;
    const newProfile: DatabaseProfile = {
      id: crypto.randomUUID(),
      name: newProfileName,
      provider: "sqlite", // Default to SQLite for Desktop
      databaseName: "nima_pos.db",
    };

    const updatedConfig = {
      ...formData.dbConfig,
      profiles: [...(formData.dbConfig?.profiles || []), newProfile],
    };

    setFormData({ ...formData, dbConfig: updatedConfig as any });
    setNewProfileName("");
  };

  const handleDeleteProfile = (id: string) => {
    if (!formData || !formData.dbConfig) return;
    const updatedConfig = {
      ...formData.dbConfig,
      profiles: formData.dbConfig.profiles.filter((p) => p.id !== id),
    };
    setFormData({ ...formData, dbConfig: updatedConfig as any });
  };

  const handleProfileChange = (
    profileId: string,
    field: keyof DatabaseProfile,
    value: string,
  ) => {
    if (!formData || !formData.dbConfig) return;
    const updatedProfiles = formData.dbConfig.profiles.map((p) => {
      if (p.id === profileId) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setFormData({
      ...formData,
      dbConfig: { ...formData.dbConfig, profiles: updatedProfiles } as any,
    });
  };

  const handleSelectBackupDir = async () => {
    try {
      if ("showDirectoryPicker" in window) {
        const handle = await (window as any).showDirectoryPicker();
        if (handle) {
          await db.directoryHandles.put(
            { id: "backupDir", handle },
            "backupDir",
          );
          await handleSettingChange("backupDirectoryLabel", handle.name);
          await handleSettingChange("autoBackupOnClose", true);
          alert("تم تحديد مجلد النسخ الاحتياطي بنجاح: " + handle.name);
        }
      } else {
        alert(
          "عذراً، متصفحك لا يدعم اختيار المجلدات. يرجى استخدام Chrome أو Edge.",
        );
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error("Directory picker error:", e);
        alert("حدث خطأ أثناء اختيار المجلد: " + e.message);
      }
    }
  };

  const handleTestBackup = async () => {
    setIsBackingUp(true);
    try {
      const success = await performBackupToDirectory();
      if (success) alert("تم إنشاء نسخة تجريبية بنجاح في المجلد المختار");
      else alert("فشل النسخ الاحتياطي. تأكد من تحديد المجلد ومنح الصلاحيات.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleManualBackup = async () => {
    const blob = await exportFullDatabase();
    downloadBackup(blob);
  };

  const handleImportDB = async () => {
    if (!importFile) return;
    if (!window.confirm(t("overwriteConfirm", "ar"))) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        await (db as any).transaction("rw", (db as any).tables, async () => {
          const tables = (db as any).tables;
          for (const table of tables) {
            if (table.name !== "directoryHandles") {
              await table.clear();
            }
          }
          for (const tableName in data) {
            const table = (db as any).table(tableName);
            if (table) await table.bulkAdd(data[tableName]);
          }
        });
        alert("تم استعادة البيانات بنجاح. سيتم إعادة تحميل الصفحة.");
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert("ملف غير صالح أو تالف");
      }
    };
    reader.readAsText(importFile);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      {/* Database Profiles */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
        <SectionTitle
          icon={Server}
          title="إدارة قواعد البيانات (Database Profiles)"
          desc="التبديل بين الوضع المحلي وقواعد البيانات المركزية (Server)"
        />

        <div className="space-y-6">
          {/* Active Profile Selection */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <label className="block text-xs font-bold text-slate-500 mb-2">
              مصدر البيانات النشط (Active Profile)
            </label>
            <div className="flex gap-2">
              <select
                value={formData.dbConfig?.activeProfileId || "local"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dbConfig: {
                      ...formData.dbConfig,
                      activeProfileId: e.target.value,
                    } as any,
                  })
                }
                className="flex-1 p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="local">
                  Local Storage (IndexedDB - Default)
                </option>
                {formData.dbConfig?.profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.provider})
                  </option>
                ))}
              </select>
              <button
                onClick={() =>
                  handleSettingChange("dbConfig", formData.dbConfig)
                }
                className="bg-indigo-600 text-white px-6 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                تفعيل الحساب
              </button>
            </div>
            <div className="mt-3 flex gap-2 text-[10px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" /> سيتم إعادة
                تحميل التطبيق عند التغيير.
              </span>
            </div>
          </div>

          {/* Add New Profile UI */}
          <div className="border-t border-slate-100 pt-6">
            <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> إضافة ملف اتصال جديد
            </h4>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="اسم الملف (مثلاً: سيرفر الشركة الرئيسي)"
                className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
              />
              <button
                onClick={handleAddProfile}
                className="bg-slate-800 text-white px-4 rounded-xl font-bold text-sm hover:bg-slate-900 transition-colors"
              >
                إضافة
              </button>
            </div>

            {/* Profiles List */}
            {formData.dbConfig?.profiles &&
              formData.dbConfig.profiles.length > 0 && (
                <div className="space-y-4">
                  {formData.dbConfig.profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${profile.id === "local" ? "bg-emerald-100 text-emerald-700" : "bg-indigo-50 text-indigo-700"}`}
                          >
                            {profile.provider === "local" ? (
                              <HardDrive className="w-5 h-5" />
                            ) : (
                              <Network className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">
                              {profile.name}
                            </h4>
                            <p className="text-xs text-slate-400 uppercase font-bold">
                              {profile.provider}
                            </p>
                          </div>
                        </div>
                        {profile.id !== "local" && (
                          <button
                            onClick={() => handleDeleteProfile(profile.id)}
                            className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Configuration Fields based on Provider */}
                      {profile.id !== "local" && (
                        <div className="space-y-3">
                          {/* Provider Select */}
                          <div className="grid grid-cols-1 gap-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              نوع قاعدة البيانات
                            </label>
                            <select
                              className="p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-sm font-bold outline-none focus:border-indigo-500"
                              value={profile.provider}
                              onChange={(e) =>
                                handleProfileChange(
                                  profile.id,
                                  "provider",
                                  e.target.value,
                                )
                              }
                            >
                              <option value="sqlite">
                                SQLite (Desktop File)
                              </option>
                              <option value="sqlserver">
                                Microsoft SQL Server
                              </option>
                              <option value="mysql">MySQL / MariaDB</option>
                              <option value="postgres">PostgreSQL</option>
                            </select>
                          </div>

                          {/* SQLite Specific: File Path */}
                          {profile.provider === "sqlite" && (
                            <div className="grid grid-cols-1 gap-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                <FileCode className="w-3 h-3" /> مسار الملف
                                (File Path)
                              </label>
                              <input
                                type="text"
                                placeholder="C:\Users\Admin\Documents\NimaPOS\database.db"
                                className="p-2.5 border border-slate-200 rounded-lg text-sm font-mono dir-ltr outline-none focus:border-indigo-500"
                                value={profile.filePath || ""}
                                onChange={(e) =>
                                  handleProfileChange(
                                    profile.id,
                                    "filePath",
                                    e.target.value,
                                  )
                                }
                              />
                              <p className="text-[10px] text-slate-400">
                                تأكد من أن التطبيق لديه صلاحية الوصول للمجلد.
                              </p>
                            </div>
                          )}

                          {/* Server Based: Host, Port, Auth */}
                          {["mysql", "postgres", "sqlserver"].includes(
                            profile.provider,
                          ) && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="col-span-2 md:col-span-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                  Host / IP
                                </label>
                                <input
                                  placeholder="127.0.0.1"
                                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:border-indigo-500"
                                  value={profile.host || ""}
                                  onChange={(e) =>
                                    handleProfileChange(
                                      profile.id,
                                      "host",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div className="col-span-2 md:col-span-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                  Port
                                </label>
                                <input
                                  placeholder={
                                    profile.provider === "sqlserver"
                                      ? "1433"
                                      : profile.provider === "postgres"
                                        ? "5432"
                                        : "3306"
                                  }
                                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:border-indigo-500"
                                  value={profile.port || ""}
                                  onChange={(e) =>
                                    handleProfileChange(
                                      profile.id,
                                      "port",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                  Database Name
                                </label>
                                <input
                                  placeholder="nima_pos_db"
                                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                                  value={profile.databaseName || ""}
                                  onChange={(e) =>
                                    handleProfileChange(
                                      profile.id,
                                      "databaseName",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div className="col-span-2 md:col-span-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                  Username
                                </label>
                                <input
                                  placeholder="sa / root"
                                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                                  value={profile.username || ""}
                                  onChange={(e) =>
                                    handleProfileChange(
                                      profile.id,
                                      "username",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div className="col-span-2 md:col-span-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                  Password
                                </label>
                                <input
                                  type="password"
                                  placeholder="••••••"
                                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                                  value={profile.password || ""}
                                  onChange={(e) =>
                                    handleProfileChange(
                                      profile.id,
                                      "password",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
        <SectionTitle
          icon={FolderOpen}
          title="النسخ الاحتياطي التلقائي"
          desc="حفظ البيانات عند الإغلاق"
        />
        <div className="flex flex-col gap-6">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-800">
                  تفعيل النسخ عند الخروج
                </p>
                <p className="text-xs text-slate-500">
                  سيتم حفظ نسخة بتاريخ اليوم والساعة عند الضغط على زر "خروج"
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={formData.autoBackupOnClose || false}
              onChange={() =>
                handleSettingChange(
                  "autoBackupOnClose",
                  !formData.autoBackupOnClose,
                )
              }
            />
          </div>
          <div className="p-5 bg-white border-2 border-dashed border-slate-300 rounded-2xl">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-bold text-slate-700">
                مجلد الحفظ المختار
              </p>
              <button
                onClick={handleTestBackup}
                className="text-xs text-indigo-600 font-bold hover:underline disabled:opacity-50 flex items-center gap-1"
                disabled={!formData.backupDirectoryLabel || isBackingUp}
              >
                {isBackingUp ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3" />
                )}{" "}
                تجربة النسخ
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex-1 bg-slate-100 p-3 rounded-xl text-sm font-mono text-slate-600 truncate border border-slate-200"
                dir="ltr"
              >
                {formData.backupDirectoryLabel || "لم يتم تحديد مجلد"}
              </div>
              <button
                onClick={handleSelectBackupDir}
                className="px-4 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-colors shadow-lg"
              >
                تغيير المجلد
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> ملاحظة: يتطلب دعم File
              System Access API (متصفح حديث)
            </p>
          </div>

          {/* Backup Strategy Configuration */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
            <h4 className="font-bold text-slate-850 text-sm text-right">
              استراتيجية النسخ الاحتياطي والمزامنة التلقائية
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 text-right">
                  مكان النسخ الاحتياطي التلقائي
                </label>
                <select
                  value={formData.backupType || "local"}
                  onChange={(e) =>
                    handleSettingChange("backupType", e.target.value)
                  }
                  className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-right"
                >
                  <option value="local">
                    نسخ احتياطي محلي (على الجهاز فقط)
                  </option>
                  <option value="cloud">
                    نسخ احتياطي سحابي تلقائي (Cloud Backup)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 text-right">
                  دورية التكرار التلقائي
                </label>
                <select
                  value={formData.backupAutoInterval || "daily"}
                  onChange={(e) =>
                    handleSettingChange("backupAutoInterval", e.target.value)
                  }
                  className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-right"
                >
                  <option value="manual">يدوي فقط عند الطلب</option>
                  <option value="hourly">كل ساعة (تحديث مستمر)</option>
                  <option value="daily">يومياً (تلقائي)</option>
                  <option value="weekly">أسبوعياً (تلقائي)</option>
                </select>
              </div>
            </div>

            {formData.backupType === "cloud" && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-bold text-slate-600 mb-1.5 text-right">
                  رابط خادم النسخ الاحتياطي السحابي (Cloud Sync API)
                </label>
                <input
                  type="url"
                  value={formData.backupServerUrl || ""}
                  onChange={(e) =>
                    handleSettingChange("backupServerUrl", e.target.value)
                  }
                  placeholder="https://backup.your-domain.com/v1/sync"
                  className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 font-mono text-left"
                  dir="ltr"
                />
                <p className="text-[10px] text-slate-500 mt-1 text-right">
                  سيقوم النظام بضغط وتأمين البيانات بصيغة مشفرة على خادم السحاب
                  المعين تلقائياً طبقاً للجدولة المختارة.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
        <SectionTitle
          icon={Shield}
          title="النسخ الاحتياطي اليدوي"
          desc="حماية البيانات من الفقدان (تحميل ملف)"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={handleManualBackup}
            className="py-6 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex flex-col items-center justify-center gap-3 group"
          >
            <div className="p-4 bg-slate-100 rounded-full group-hover:bg-white transition-all text-indigo-600">
              <Download className="w-8 h-8" />
            </div>
            <span>تحميل نسخة احتياطية (.json)</span>
          </button>
          <div className="relative h-full">
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              accept=".json"
            />
            <div
              className={`w-full h-full py-6 border-2 border-dashed rounded-2xl font-bold transition-all flex flex-col items-center justify-center gap-3 ${importFile ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-300 text-slate-500 hover:border-emerald-400"}`}
            >
              <div className="p-4 bg-slate-50 rounded-full text-emerald-600 shadow-sm">
                <Upload className="w-8 h-8" />
              </div>
              <span>
                {importFile ? importFile.name : "استعادة نسخة من ملف"}
              </span>
            </div>
          </div>
        </div>
        {importFile && (
          <button
            onClick={handleImportDB}
            className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" /> تأكيد الاستعادة
          </button>
        )}
      </div>
    </div>
  );
};

export default DatabaseSettings;
