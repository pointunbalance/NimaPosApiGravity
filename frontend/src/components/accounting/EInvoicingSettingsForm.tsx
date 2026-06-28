import React from "react";
import { AlertCircle } from "lucide-react";
import { AppSettings } from "../../types";

interface EInvoicingSettingsFormProps {
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const EInvoicingSettingsForm: React.FC<EInvoicingSettingsFormProps> = ({
  settings,
  setSettings,
  isSaving,
  onSubmit,
}) => {
  return (
    <div className="p-6 max-w-2xl font-bold">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.zatca?.enabled || false}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  zatca: {
                    ...settings.zatca,
                    enabled: e.target.checked,
                    environment: settings.zatca?.environment || "sandbox",
                  },
                })
              }
              className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <span className="font-bold text-slate-800 text-sm">
              تفعيل الربط مع هيئة الزكاة والضريبة والجمارك (ZATCA)
            </span>
          </label>
        </div>

        {settings.zatca?.enabled && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">بيئة العمل</label>
              <select
                value={settings.zatca.environment}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    zatca: {
                      ...settings.zatca!,
                      environment: e.target.value as any,
                    },
                  })
                }
                className="w-full p-2.5 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold"
              >
                <option value="sandbox">بيئة التطوير (Sandbox)</option>
                <option value="simulation">بيئة المحاكاة (Simulation)</option>
                <option value="production">بيئة الإنتاج الفعلي (Production)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                الرقم الضريبي للمنشأة (VAT Number)
              </label>
              <input
                type="text"
                value={settings.taxNumber || ""}
                onChange={(e) => setSettings({ ...settings, taxNumber: e.target.value })}
                className="w-full p-2.5 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold"
                placeholder="مثال: 312345678900003"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">معرف التشفير (CSID)</label>
              <input
                type="text"
                value={settings.zatca.csid || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    zatca: { ...settings.zatca!, csid: e.target.value },
                  })
                }
                className="w-full p-2.5 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                placeholder="سيتم توليده تلقائياً عند إتمام الربط"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                المفتاح الخاص (Private Key)
              </label>
              <textarea
                value={settings.zatca.privateKey || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    zatca: {
                      ...settings.zatca!,
                      privateKey: e.target.value,
                    },
                  })
                }
                className="w-full p-2.5 border border-slate-200 bg-white text-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                rows={3}
                placeholder="-----BEGIN EC PRIVATE KEY-----..."
              />
            </div>

            <div className="bg-amber-50 text-amber-800 p-4 rounded-lg text-sm flex gap-2 border border-amber-100 font-medium">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>
                هذه الإعدادات حساسة جداً. تأكد من إدخال بيانات الربط الصحيحة المستخرجة من بوابة
                فاتورة (Fatoora Portal).
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-bold"
          >
            {isSaving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EInvoicingSettingsForm;
