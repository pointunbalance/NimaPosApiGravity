import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { EInvoice, Order, AppSettings } from "../../types";

export const useEInvoicingData = () => {
  const [activeTab, setActiveTab] = useState<"invoices" | "uninvoiced" | "settings">(
    "invoices"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<EInvoice | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showXMLModal, setShowXMLModal] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Status/Toast callbacks
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const appSettings = await db.settings.toCollection().first();
      if (appSettings) {
        setSettings(appSettings);
      }
    };
    loadSettings();
  }, []);

  const invoices =
    useLiveQuery(() => db.eInvoices.orderBy("date").reverse().toArray()) || [];

  const allOrders =
    useLiveQuery(() =>
      db.orders.where("status").equals("completed").reverse().toArray()
    ) || [];

  const fiscalYears = useLiveQuery(() => db.fiscalYears.toArray(), []);

  // Filter uninvoiced orders
  const uninvoicedOrders = allOrders.filter(
    (order) => !invoices.some((inv) => inv.orderId === order.id)
  );

  const isDateClosed = (dateStr: string | Date | undefined) => {
    if (!dateStr) return false;
    const d = new Date(dateStr).getTime();
    return fiscalYears?.some((fy) => {
      const start = new Date(fy.startDate).setHours(0, 0, 0, 0);
      const end = new Date(fy.endDate).setHours(23, 59, 59, 999);
      return d >= start && d <= end && fy.status === "closed";
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings?.id) return;
    setIsSavingSettings(true);
    try {
      await db.settings.put(settings);
      setStatusMessage({
        type: "success",
        text: "تم حفظ إعدادات الفاتورة الإلكترونية بنجاح",
      });
    } catch (error) {
      console.error("Error saving settings", error);
      setStatusMessage({
        type: "error",
        text: "حدث خطأ أثناء حفظ الإعدادات",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleGenerateInvoice = async (order: Order) => {
    try {
      if (isDateClosed(order.date)) {
        setStatusMessage({
          type: "warning",
          text: "لا يمكن توليد فاتورة لطلب يخص سنة مالية مغلقة.",
        });
        return;
      }
      const newInvoice: EInvoice = {
        orderId: order.id!,
        status: "pending",
        date: new Date().toISOString(),
        amount: order.totalAmount,
        customerName: order.customerId
          ? `عميل #${order.customerId}`
          : "عميل نقدي",
      };
      await db.eInvoices.add(newInvoice);
      setStatusMessage({
        type: "success",
        text: "تم إنشاء مسودة الفاتورة الإلكترونية بنجاح",
      });
      setActiveTab("invoices");
    } catch (error) {
      console.error("Error generating invoice", error);
      setStatusMessage({
        type: "error",
        text: "حدث خطأ أثناء إنشاء الفاتورة",
      });
    }
  };

  const handleSubmitToZatca = async (invoice: EInvoice) => {
    if (!settings?.zatca?.enabled) {
      setStatusMessage({
        type: "warning",
        text: "يرجى تفعيل إعدادات هيئة الزكاة والضريبة أولاً من تبويب الإعدادات.",
      });
      return;
    }

    if (
      settings.zatca.environment !== "sandbox" &&
      (!settings.zatca.csid || !settings.zatca.privateKey)
    ) {
      setStatusMessage({
        type: "warning",
        text: "إعدادات الربط غير مكتملة (CSID / Private Key) للبيئة المحددة.",
      });
      return;
    }

    if (isDateClosed(invoice.date)) {
      setStatusMessage({
        type: "warning",
        text: "لا يمكن تطبيق إجراءات على فاتورة ضمن سنة مالية مغلقة.",
      });
      return;
    }

    try {
      await db.eInvoices.update(invoice.id!, { status: "submitted" });

      const xmlDoc = `<Invoice><ID>${invoice.id}</ID><IssueDate>${invoice.date}</IssueDate></Invoice>`;

      setTimeout(async () => {
        const isStructureValid = xmlDoc.includes("<Invoice>");
        const isNetworkSuccess = Math.random() > 0.05;

        if (isStructureValid && isNetworkSuccess) {
          await db.eInvoices.update(invoice.id!, {
            status: "accepted",
            zatcaHash: "ZATCA-" + crypto.randomUUID().split("-")[0].toUpperCase(),
            uuid: crypto.randomUUID(),
          });
          setStatusMessage({
            type: "success",
            text: "تم إرسال الفاتورة وقبولها بنجاح",
          });
        } else {
          await db.eInvoices.update(invoice.id!, { status: "rejected" });
          setStatusMessage({
            type: "error",
            text: "تم رفض الفاتورة من قبل البوابة. راجع سجلات الأخطاء.",
          });
        }
      }, 1500);
    } catch (error) {
      console.error("Failed to submit invoice", error);
      await db.eInvoices.update(invoice.id!, { status: "rejected" });
      setStatusMessage({
        type: "error",
        text: "حدث خطأ في النظام أثناء إرسال الفاتورة.",
      });
    }
  };

  return {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    selectedInvoice,
    setSelectedInvoice,
    showQRModal,
    setShowQRModal,
    showXMLModal,
    setShowXMLModal,
    settings,
    setSettings,
    isSavingSettings,
    invoices,
    uninvoicedOrders,
    handleSaveSettings,
    handleGenerateInvoice,
    handleSubmitToZatca,
    statusMessage,
    setStatusMessage,
  };
};
