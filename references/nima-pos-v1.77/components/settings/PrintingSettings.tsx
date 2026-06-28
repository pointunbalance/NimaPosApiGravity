import React, { useState } from "react";
import {
  LayoutTemplate,
  Printer,
  QrCode,
  ScrollText,
  GripVertical,
  Eye,
  EyeOff,
  Usb,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { AppSettings, ReceiptSection } from "../../types";
import { SectionTitle, ToggleSwitch } from "./settingsUtils";
import { hardwareService } from "../../utils/hardware";
import NetworkPrintersManager from "./NetworkPrintersManager";

interface PrintingSettingsProps {
  formData: AppSettings;
  setFormData: (data: AppSettings) => void;
  handleSettingChange: (key: keyof AppSettings, value: any) => void;
  layout: ReceiptSection[];
  setLayout: (layout: ReceiptSection[]) => void;
  draggedItemIndex: number | null;
  setDraggedItemIndex: (index: number | null) => void;
}

const PrintingSettings: React.FC<PrintingSettingsProps> = ({
  formData,
  setFormData,
  handleSettingChange,
  layout,
  setLayout,
  draggedItemIndex,
  setDraggedItemIndex,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newLayout = [...layout];
    const draggedItem = newLayout[draggedItemIndex];
    newLayout.splice(draggedItemIndex, 1);
    newLayout.splice(index, 0, draggedItem);

    setDraggedItemIndex(index);
    setLayout(newLayout);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
    setFormData({ ...formData, receiptLayout: layout });
  };

  const toggleSectionVisibility = (index: number) => {
    const newLayout = [...layout];
    newLayout[index].visible = !newLayout[index].visible;
    setLayout(newLayout);
    setFormData({ ...formData, receiptLayout: newLayout });
  };

  const connectHardwarePrinter = async () => {
    setIsConnecting(true);
    setConnectionError("");
    try {
      await hardwareService.connectReceiptPrinter();
      handleSettingChange("useHardwarePrinter", true);
    } catch (error: any) {
      setConnectionError(error.message || "فشل الاتصال بالطابعة");
      handleSettingChange("useHardwarePrinter", false);
    } finally {
      setIsConnecting(false);
    }
  };

  const testCashDrawer = async () => {
    try {
      await hardwareService.openCashDrawer();
    } catch (error: any) {
      alert("فشل فتح الدرج: " + error.message);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-8">
      {/* Hardware Printing Setup */}
      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <Printer className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
              إعدادات الطابعة والورق
            </h2>
            <p className="text-slate-500 mt-1">
              تكوين اتصال الطابعة وأحجام الورق المستخدمة
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Connection Settings */}
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50 -mr-16 -mt-16 pointer-events-none"></div>
              <div className="relative z-10 flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Usb className="w-5 h-5 text-indigo-500" />
                      الطباعة المباشرة (ESC/POS)
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-2 max-w-[280px]">
                      تجاوز نافذة طباعة المتصفح وإرسال الأوامر مباشرة للطابعة
                      عبر USB. يدعم فتح درج النقود.
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={formData.useHardwarePrinter || false}
                    onChange={() => {
                      if (!formData.useHardwarePrinter) {
                        connectHardwarePrinter();
                      } else {
                        handleSettingChange("useHardwarePrinter", false);
                        hardwareService.disconnect();
                      }
                    }}
                  />
                </div>

                {isConnecting && (
                  <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 bg-indigo-50 p-3 rounded-xl">
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    جاري الاتصال بالطابعة...
                  </div>
                )}

                {formData.useHardwarePrinter && !isConnecting && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      الطابعة متصلة بنجاح
                    </div>
                    <button
                      onClick={testCashDrawer}
                      className="w-full py-3 bg-white border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 hover:border-emerald-300 transition-colors shadow-sm"
                    >
                      اختبار درج النقود
                    </button>
                  </div>
                )}

                {connectionError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="font-medium">{connectionError}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 transition-all hover:shadow-md">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    الطباعة المزدوجة
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
                    إصدار نسختين من كل فاتورة تلقائياً (نسخة للعميل وللتحضير).
                  </p>
                </div>
                <ToggleSwitch
                  checked={formData.enableDualPrinting || false}
                  onChange={() =>
                    handleSettingChange(
                      "enableDualPrinting",
                      !formData.enableDualPrinting,
                    )
                  }
                />
              </div>

              {formData.enableDualPrinting && formData.useHardwarePrinter && (
                <div className="mt-4 p-4 border border-indigo-200 bg-white rounded-2xl">
                  <div className="flex flex-col gap-3">
                    <h4 className="font-bold text-slate-700 text-sm">
                      طابعة إضافية (اختياري)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      أو سيتم طباعة نسختين على نفس الطابعة.
                    </p>
                    <button
                      className="w-full bg-indigo-50 text-indigo-700 border border-indigo-100 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors"
                      onClick={async () => {
                        try {
                          await hardwareService.connectReceiptPrinter(true);
                          alert("تم توصيل الطابعة الثانية بنجاح");
                        } catch (err: any) {
                          alert("فشل توصيل الطابعة الإضافية: " + err.message);
                        }
                      }}
                    >
                      توصيل طابعة إضافية
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Default Printers Definition */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 transition-all hover:shadow-md">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                <Printer className="w-4 h-4 text-indigo-500" />
                تعريف أجهزة الطباعة الافتراضية
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 text-right">
                    طابعة الفواتير الحرارية الافتراضية (80mm)
                  </label>
                  <input
                    type="text"
                    value={formData.thermalPrinterName || ""}
                    onChange={(e) =>
                      handleSettingChange("thermalPrinterName", e.target.value)
                    }
                    placeholder="مثلاً: POS-80, XP-80, Thermal-Printer"
                    className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 font-medium text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 text-right">
                    طابعة ملصقات الباركود (Barcode Label Printer)
                  </label>
                  <input
                    type="text"
                    value={formData.barcodePrinterName || ""}
                    onChange={(e) =>
                      handleSettingChange("barcodePrinterName", e.target.value)
                    }
                    placeholder="مثلاً: XP-365B, Barcode-Printer"
                    className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 font-medium text-right font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Paper & Print Settings */}
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 transition-all hover:shadow-md">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-indigo-500" />
                حجم ورق الفاتورة
              </h3>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleSettingChange("printerWidth", "80mm")}
                  className={`flex-1 py-4 px-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${formData.printerWidth === "80mm" || !formData.printerWidth ? "border-indigo-600 bg-white text-indigo-700 shadow-md ring-4 ring-indigo-50" : "border-slate-200 bg-transparent text-slate-500 hover:border-slate-300 hover:bg-slate-100"}`}
                >
                  <span className="font-black text-xl">80</span>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    mm / قياسي
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSettingChange("printerWidth", "58mm")}
                  className={`flex-1 py-4 px-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${formData.printerWidth === "58mm" ? "border-indigo-600 bg-white text-indigo-700 shadow-md ring-4 ring-indigo-50" : "border-slate-200 bg-transparent text-slate-500 hover:border-slate-300 hover:bg-slate-100"}`}
                >
                  <span className="font-black text-xl">58</span>
                  <span className="text-xs font-bold uppercase tracking-wider">
                    mm / صغير
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-indigo-200 transition-colors cursor-pointer group"
                onClick={() =>
                  handleSettingChange("autoPrint", !formData.autoPrint)
                }
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Printer className="w-5 h-5" />
                  </div>
                  <ToggleSwitch
                    checked={formData.autoPrint || false}
                    onChange={() =>
                      handleSettingChange("autoPrint", !formData.autoPrint)
                    }
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    طباعة تلقائية
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    عند إتمام الطلب مباشرة
                  </p>
                </div>
              </div>

              <div
                className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-indigo-200 transition-colors cursor-pointer group"
                onClick={() =>
                  handleSettingChange("enableQr", !formData.enableQr)
                }
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <ToggleSwitch
                    checked={formData.enableQr || false}
                    onChange={() =>
                      handleSettingChange("enableQr", !formData.enableQr)
                    }
                  />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    رمز QR الزاتكا
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    تضمين رمز QR المتوافق
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NetworkPrintersManager />

      {/* Content & Layout Setting */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
        {/* Form Fields */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-sm">
              <ScrollText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                محتوى الإيصال
              </h2>
              <p className="text-sm text-slate-500">محتوى الطباعة الثابت</p>
            </div>
          </div>

          <div className="flex-1 space-y-5 flex flex-col">
            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                الرسالة الترحيبية (أعلى)
              </label>
              <textarea
                value={formData.receiptHeader || ""}
                onChange={(e) =>
                  setFormData({ ...formData, receiptHeader: e.target.value })
                }
                className="w-full flex-1 min-h-[80px] p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none transition-all placeholder:text-slate-400 font-medium"
                placeholder="أهلاً بك في متجرنا..."
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                رسالة الوداع (أسفل)
              </label>
              <textarea
                value={formData.receiptFooter || ""}
                onChange={(e) =>
                  setFormData({ ...formData, receiptFooter: e.target.value })
                }
                className="w-full flex-1 min-h-[80px] p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none transition-all placeholder:text-slate-400 font-medium"
                placeholder="شكراً لزيارتكم..."
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                شروط A4 (ورق كبير)
              </label>
              <textarea
                value={formData.termsAndConditions || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    termsAndConditions: e.target.value,
                  })
                }
                className="w-full flex-1 min-h-[80px] p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none transition-all placeholder:text-slate-400 font-medium text-sm"
                placeholder="تظهر في فواتير A4..."
              />
            </div>
          </div>
        </div>

        {/* Receipt Layout Designer */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <LayoutTemplate className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                ترتيب العناصر
              </h2>
            </div>
          </div>

          <p className="text-sm text-slate-500 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
            يمكنك سحب وإفلات العناصر لتغيير ترتيب ظهورها في إيصال الطباعة
            المصغر.
          </p>

          <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
            {layout.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-move group ${
                  draggedItemIndex === index
                    ? "opacity-50 bg-indigo-50 border-indigo-300 border-dashed scale-[1.02]"
                    : item.visible
                      ? "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md"
                      : "bg-slate-50 border-slate-100 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-slate-100 rounded text-slate-400 group-hover:text-indigo-400 transition-colors">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <span
                    className={`font-bold text-sm ${item.visible ? "text-slate-700" : "text-slate-400 line-through"}`}
                  >
                    {item.label}
                  </span>
                </div>
                <button
                  onClick={() => toggleSectionVisibility(index)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${item.visible ? "text-indigo-600 shadow-sm bg-indigo-50 hover:bg-indigo-100" : "text-slate-400 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300"}`}
                  title={item.visible ? "إخفاء العنصر" : "إظهار العنصر"}
                >
                  {item.visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-200 flex flex-col items-center justify-start p-6 overflow-hidden">
          <div className="w-full text-center font-bold text-slate-500 text-xs uppercase mb-4 bg-white py-2 rounded-xl border border-slate-200 shadow-sm">
            معاينة حية للمقاس {formData.printerWidth || "80mm"}
          </div>
          <div className="flex-1 w-full flex flex-col items-center justify-start overflow-y-auto custom-scrollbar">
            <div
              className="bg-white shadow-xl shadow-slate-200/50 border border-slate-200 p-4 text-center font-mono text-gray-800 text-sm flex flex-col gap-1 mx-auto transition-all"
              style={{
                width: formData.printerWidth === "58mm" ? "220px" : "280px",
                minHeight: "400px",
                fontSize: formData.printerWidth === "58mm" ? "10px" : "12px",
              }}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-b from-slate-100 to-transparent"></div>

              {layout.map((item) => {
                if (!item.visible) return null;
                switch (item.id) {
                  case "logo":
                    return (
                      <div
                        key={item.id}
                        className="w-12 h-12 bg-slate-100 rounded-lg mx-auto flex items-center justify-center text-slate-400 mb-1 shrink-0"
                      >
                        <Printer className="w-6 h-6" />
                      </div>
                    );
                  case "store_name":
                    return (
                      <div
                        key={item.id}
                        className="font-bold text-lg leading-tight mt-1 mb-1"
                      >
                        {formData.storeName || "أسم المتجر"}
                      </div>
                    );
                  case "header_msg":
                    return formData.receiptHeader ? (
                      <div
                        key={item.id}
                        className="text-slate-500 whitespace-pre-wrap mt-1 leading-tight"
                      >
                        {formData.receiptHeader}
                      </div>
                    ) : (
                      <div key={item.id} className="h-0 leading-none"></div>
                    );
                  case "divider_1":
                    return (
                      <div
                        key={item.id}
                        className="border-t-[1.5px] border-dashed border-slate-300 w-full my-2"
                      ></div>
                    );
                  case "invoice_info":
                    return (
                      <div
                        key={item.id}
                        className="flex justify-between w-full text-[11px] text-slate-600 my-1 font-bold"
                      >
                        <span>
                          التاريخ: {new Date().toLocaleDateString("ar-SA")}
                        </span>
                        <span>رقم: 10001</span>
                      </div>
                    );
                  case "items":
                    return (
                      <div key={item.id} className="w-full my-2 text-[11px]">
                        <div className="flex justify-between border-b-[1.5px] border-slate-300 pb-1 mb-1.5 font-bold text-slate-800">
                          <span>المنتج</span>
                          <span>القيمة</span>
                        </div>
                        <div className="flex justify-between font-medium text-slate-600 mb-0.5">
                          <span>قهوة مقطرة</span>
                          <span>16.00</span>
                        </div>
                        <div className="flex justify-between font-medium text-slate-600 mb-0.5">
                          <span>كيك شوكولاتة</span>
                          <span>24.00</span>
                        </div>
                      </div>
                    );
                  case "divider_2":
                    return (
                      <div
                        key={item.id}
                        className="border-t-[1.5px] border-dashed border-slate-300 w-full my-2"
                      ></div>
                    );
                  case "totals":
                    return (
                      <div key={item.id} className="w-full my-1">
                        <div className="flex justify-between font-black text-sm my-1 text-slate-800">
                          <span>الإجمالي (شامل الضريبة)</span>
                          <span>40.00</span>
                        </div>
                      </div>
                    );
                  case "qr_code":
                    return formData.enableQr !== false ? (
                      <div
                        key={item.id}
                        className="my-3 flex justify-center shrink-0"
                      >
                        <div className="p-1.5 bg-white border-2 border-slate-800 rounded-lg inline-block">
                          <QrCode className="w-16 h-16 text-slate-800" />
                        </div>
                      </div>
                    ) : (
                      <div key={item.id} className="h-0 leading-none"></div>
                    );
                  case "footer_msg":
                    return formData.receiptFooter ? (
                      <div
                        key={item.id}
                        className="text-slate-500 whitespace-pre-wrap mt-2 text-[10px] leading-tight"
                      >
                        {formData.receiptFooter}
                      </div>
                    ) : (
                      <div key={item.id} className="h-0 leading-none"></div>
                    );
                  case "barcode":
                    return (
                      <div
                        key={item.id}
                        className="mx-auto mt-3 h-10 w-full max-w-[200px] bg-slate-800 flex items-center justify-center shrink-0"
                      >
                        <div className="w-[80%] h-6 bg-slate-800 px-1 border-x-4 border-slate-800 relative">
                          <div className="absolute inset-y-0 inset-x-1 border-x-[3px] border-white before:absolute before:inset-y-0 before:left-2 before:w-[2px] before:bg-white after:absolute after:inset-y-0 after:right-3 after:w-1 after:bg-white flex justify-center">
                            <div className="w-[2px] h-full bg-white mx-1"></div>
                            <div className="w-1 h-full bg-white mx-1"></div>
                            <div className="w-[3px] h-full bg-white mx-1"></div>
                          </div>
                        </div>
                      </div>
                    );
                  default:
                    return (
                      <div key={item.id} className="text-slate-400 text-xs">
                        {item.label}
                      </div>
                    );
                }
              })}
            </div>
          </div>
          <div className="mt-4 px-4 py-3 bg-white border border-slate-200 text-slate-500 text-xs font-bold rounded-xl text-center w-full max-w-[280px]">
            شكل تقريبي يختلف حسب الطابعة.
          </div>
        </div>
      </div>

      {/* Live Preview Note (Optional: Add actual preview component if needed) */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] p-6 sm:p-8 text-white shadow-lg overflow-hidden relative">
        <div className="absolute -right-20 -top-40 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -left-20 -bottom-40 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">تطبيق الإعدادات بنجاح</h3>
            <p className="text-indigo-100 text-sm max-w-lg">
              يتم حفظ إعدادات الطباعة بشكل فوري. في حال واجهت مشكلة في طباعة
              المتصفح، حاول تمكين استخدام الطباعة המباشرة (ESC/POS) وتأكد من
              تثبيت تعريفات طابعتك الحرارية.
            </p>
          </div>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shrink-0 shadow-xl">
            <Printer className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintingSettings;
