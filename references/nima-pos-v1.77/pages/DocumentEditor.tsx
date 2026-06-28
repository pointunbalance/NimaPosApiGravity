import React, { useState, useRef, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import JoditEditor from "jodit-react";
import { db } from "../db";
import { RichDocument } from "../types";
import { useToast } from "../context/ToastContext";
import {
  FileEdit,
  FileCode,
  FileText as FileTextIcon,
  Download,
  Save,
  ArrowRight,
  Trash2,
  Plus,
  Clock,
  File,
  MoreVertical,
  Search,
  CheckCircle,
  SearchX,
  Calendar,
} from "lucide-react";
import html2pdf from "html2pdf.js";

export const DocumentEditor: React.FC = () => {
  const { showToast } = useToast();
  const documents = useLiveQuery(
    () => db.richDocuments.orderBy("updatedAt").reverse().toArray(),
    [],
  );

  const [currentDoc, setCurrentDoc] = useState<RichDocument | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<"draft" | "final">("draft");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<RichDocument | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  const editorRef = useRef(null);

  // Auto-save mechanism
  useEffect(() => {
    if (!currentDoc && !title && !content) return; // don't auto-save empty new doc completely
    
    const timeoutId = setTimeout(() => {
      // Only auto-save if there's actually content or title
      if (title.trim() === '' && content.trim() === '') return;
      saveDocument(true);
    }, 15000); // Auto save every 15 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [title, content, currentDoc, status]);

  const config = {
    readonly: false,
    minHeight: 500,
    height: "100%",
    direction: "rtl", // Support for Arabic
    language: "ar",
    placeholder: "ابدأ الكتابة هنا...",
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    hidePoweredByJodit: true,
    statusbar: false,
    toolbarButtonSize: "middle",
    toolbarSticky: true,
    theme: "default",
    buttons: [
      "bold",
      "strikethrough",
      "underline",
      "italic",
      "|",
      "ul",
      "ol",
      "|",
      "outdent",
      "indent",
      "|",
      "font",
      "fontsize",
      "brush",
      "paragraph",
      "|",
      "image",
      "table",
      "link",
      "|",
      "align",
      "undo",
      "redo",
      "|",
      "hr",
      "eraser",
      "copyformat",
      "|",
      "fullsize",
      "print",
    ],
  };

  const handleNewDocument = () => {
    setCurrentDoc(null);
    setTitle("مستند بدون عنوان");
    setContent("");
    setStatus("draft");
  };

  const handleOpenDocument = (doc: RichDocument) => {
    setCurrentDoc(doc);
    setTitle(doc.title);
    setContent(doc.content);
    setStatus(doc.status || "draft");
  };

  const saveDocument = async (isAutoSave = false) => {
    if (!isAutoSave) setIsSaving(true);
    if (!isAutoSave) setSaveSuccess(false);
    try {
      if (currentDoc && currentDoc.id) {
        await db.richDocuments.update(currentDoc.id, {
          title,
          content,
          status,
          updatedAt: new Date(),
        });

        setCurrentDoc({
          ...currentDoc,
          title,
          content,
          status,
          updatedAt: new Date(),
        });
      } else {
        const newId = await db.richDocuments.add({
          title: title || "مستند بدون عنوان",
          content,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: status,
        });

        const newDoc = await db.richDocuments.get(newId);
        if (newDoc) {
          setCurrentDoc(newDoc);
        }
      }

      setLastSavedTime(new Date());
      if (!isAutoSave) {
          setSaveSuccess(true);
          showToast("تم حفظ المستند بنجاح", "success");
          setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Error saving document:", err);
      if (!isAutoSave) showToast("حدث خطأ أثناء الحفظ", "error");
    } finally {
      if (!isAutoSave) setIsSaving(false);
    }
  };

  const deleteDocument = async (id: number | string) => {
    try {
      const numericId = typeof id === "string" ? parseInt(id, 10) : id;
      await db.richDocuments.delete(numericId);
      showToast("تم حذف المستند بنجاح", "success");
      if (currentDoc && currentDoc.id === numericId) {
        setCurrentDoc(null);
        setTitle("");
        setContent("");
      }
    } catch (err: any) {
      console.error("Error deleting document:", err);
      showToast(`حدث خطأ أثناء الحذف: ${err?.message || err}`, "error");
    } finally {
      setDocumentToDelete(null);
    }
  };

  const exportAsHTML = () => {
    const blob = new Blob([content], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title || "document"}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsTXT = () => {
    // Basic conversion to text: simply strip HTML tags
    const doc = new DOMParser().parseFromString(content, 'text/html');
    const textContext = doc.body.textContent || doc.body.innerText || "";

    const blob = new Blob([textContext], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title || "document"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = () => {
    // Safe parse HTML
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.body.innerHTML = content;
      iframeDoc.body.style.padding = "20px";
      iframeDoc.body.style.direction = "rtl";
      iframeDoc.body.style.fontFamily = "'Tajawal', 'Arial', sans-serif";

      const opt = {
        margin: 10,
        filename: `${title || "document"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      } as any;

      html2pdf().set(opt).from(iframeDoc.body).save().finally(() => {
        document.body.removeChild(iframe);
      });
    } else {
      document.body.removeChild(iframe);
    }
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || doc.body.innerText || "";
  };

  const filteredDocs =
    documents?.filter((doc) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      const docText = stripHtml(doc.content).toLowerCase();
      return (
        doc.title.toLowerCase().includes(search) || docText.includes(search)
      );
    }) || [];

  // If editor is active
  if (currentDoc !== null || title !== "") {
    return (
      <div className="absolute inset-0 flex flex-col bg-[#f3f4f6]">
        {/* Editor Toolbar Header */}
        <div className="bg-white p-2.5 px-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setCurrentDoc(null);
                setTitle("");
                setStatus("draft");
              }}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 flex items-center gap-2 font-bold text-sm"
            >
              <ArrowRight className="w-5 h-5" />
              العودة
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="بدون عنوان"
              className="text-xl font-black text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-slate-300 w-64 md:w-96"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setStatus("draft")}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${status === "draft" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
              >
                مسودة
              </button>
              <button
                onClick={() => setStatus("final")}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${status === "final" ? "bg-white shadow-sm text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                نهائي
              </button>
            </div>

            {saveSuccess && (
              <span className="text-sm font-bold text-emerald-600 animate-pulse flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                تم الحفظ
              </span>
            )}

            <div className="relative group">
              <button className="flex items-center gap-2 bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors font-bold text-sm border border-slate-200">
                <Download className="w-4 h-4" />
                تصدير
              </button>

              <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={exportAsPDF}
                  className="w-full text-right px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm font-bold text-slate-700 border-b border-slate-100"
                >
                  <FileTextIcon className="w-4 h-4 text-red-500" /> تصدير PDF
                </button>
                <button
                  onClick={exportAsHTML}
                  className="w-full text-right px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm font-bold text-slate-700 border-b border-slate-100"
                >
                  <FileCode className="w-4 h-4 text-blue-500" /> تصدير HTML
                </button>
                <button
                  onClick={exportAsTXT}
                  className="w-full text-right px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm font-bold text-slate-700 rounded-b-xl"
                >
                  <FileEdit className="w-4 h-4 text-slate-500" /> تصدير نص (TXT)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {lastSavedTime && (
                <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
                  آخر حفظ: {lastSavedTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                onClick={() => saveDocument(false)}
                disabled={isSaving}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-bold shadow-lg shadow-indigo-200/50 text-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "جاري الحفظ..." : "حفظ المستند"}
              </button>
            </div>
          </div>
        </div>

        {/* Editor Wrapper */}
        <div
          className="flex-1 bg-[#f3f4f6] border-y border-slate-200 overflow-hidden flex flex-col
          [&_.jodit-container]:!border-none [&_.jodit-container]:!flex-1 [&_.jodit-container]:!flex [&_.jodit-container]:!flex-col
          [&_.jodit-toolbar__box]:!w-full [&_.jodit-toolbar__box]:!shrink-0 [&_.jodit-toolbar__box]:!bg-white [&_.jodit-toolbar__box]:!border-b [&_.jodit-toolbar__box]:!border-slate-200 [&_.jodit-toolbar__box]:!shadow-sm [&_.jodit-toolbar__box]:!py-1.5 [&_.jodit-toolbar__box]:!px-4 [&_.jodit-toolbar__box]:!z-10
          [&_.jodit-toolbar-button]:!rounded-md [&_.jodit-toolbar-button:hover]:!bg-slate-100
          [&_.jodit-workplace]:!flex-1 [&_.jodit-workplace]:!overflow-y-auto [&_.jodit-workplace]:!bg-transparent [&_.jodit-workplace]:!p-4 md:[&_.jodit-workplace]:!p-8 [&_.jodit-workplace>.jodit-wysiwyg]:!min-h-0
          [&_.jodit-wysiwyg]:!bg-white [&_.jodit-wysiwyg]:!shadow-sm md:[&_.jodit-wysiwyg]:!shadow-md [&_.jodit-wysiwyg]:!max-w-[850px] [&_.jodit-wysiwyg]:!mx-auto [&_.jodit-wysiwyg]:!min-h-[1100px] [&_.jodit-wysiwyg]:!p-8 md:[&_.jodit-wysiwyg]:!p-16 md:[&_.jodit-wysiwyg]:!px-20 md:[&_.jodit-wysiwyg]:!my-8 [&_.jodit-wysiwyg]:!border [&_.jodit-wysiwyg]:!border-slate-200 md:[&_.jodit-wysiwyg]:!border-slate-300 [&_.jodit-wysiwyg:focus]:!outline-none
          [&_.jodit-status-bar]:!hidden
        "
        >
          <JoditEditor
            ref={editorRef}
            value={content}
            config={config as any}
            onBlur={(newContent) => setContent(newContent)}
            onChange={(newContent) => {}}
          />
        </div>

        {/* Quality of Life Footer */}
        <div className="bg-white border-t border-slate-200 text-slate-500 px-6 py-2 flex items-center justify-between text-[11px] font-bold shrink-0 z-20 shadow-[0_-1px_2px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4">
            <span>
              الكلمات:{" "}
              {
                stripHtml(content)
                  .split(/\s+/)
                  .filter((w) => w.length > 0).length
              }
            </span>
            <span>الحروف: {stripHtml(content).length}</span>
          </div>
          <div>محرر المستندات متوافق كلياً مع الطباعة</div>
        </div>
      </div>
    );
  }

  // Document List Dashboard
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            محرر المستندات
          </h2>
          <p className="text-slate-500 mt-1 font-medium">
            إنشاء وتحرير وتصدير المستندات والنصوص
          </p>
        </div>
        <button
          onClick={handleNewDocument}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 font-bold whitespace-nowrap shrink-0"
        >
          <Plus className="w-5 h-5" />
          مستند جديد
        </button>
      </div>

      {(documents && documents.length > 0) || searchTerm !== "" ? (
        <>
          <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ابحث في المستندات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-800 mt-6 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            المستندات المحفوظة
          </h3>

          {filteredDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-200 rounded-[2rem] hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col h-56 relative overflow-hidden"
                >
                  <div
                    onClick={() => handleOpenDocument(doc)}
                    className="p-6 flex-1 flex flex-col cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <FileTextIcon className="w-6 h-6" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDocumentToDelete(doc);
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors relative z-20 opacity-0 group-hover:opacity-100"
                        title="حذف المستند"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <h4 className="font-bold text-lg text-slate-800 mb-2 line-clamp-1 pr-1">
                      {doc.title || "بدون عنوان"}
                    </h4>
                    <p className="text-sm font-medium text-slate-400 line-clamp-2 mb-4 pr-1">
                      {stripHtml(doc.content) || "لا يوجد نص داخل المستند"}
                    </p>

                    <div className="mt-auto pt-4 border-t border-slate-50 text-xs font-bold flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {doc.updatedAt
                            ? new Date(doc.updatedAt).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-md ${doc.status === "final" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}
                      >
                        {doc.status === "final" ? "نهائي" : "مسودة"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-200">
              <SearchX className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                لا توجد نتائج تطابق بحثك
              </h3>
              <p className="text-slate-500">
                جرب البحث بكلمات أخرى أو تغيير العنوان.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white border text-center border-slate-200 border-dashed rounded-[2rem] p-16">
          <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileEdit className="w-10 h-10 text-indigo-500" />
          </div>
          <h4 className="text-2xl font-black text-slate-800 mb-3">
            لا توجد مستندات بعد
          </h4>
          <p className="text-slate-500 font-medium max-w-md mx-auto mb-8 text-lg">
            يمكنك إنشاء مستندات نصية وتحريرها وحفظها وتصديرها كملفات PDF أو HTML
            بكل سهولة.
          </p>
          <button
            onClick={handleNewDocument}
            className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            أنشئ أول مستند الآن
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {documentToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">حذف المستند</h3>
              <p className="text-slate-600">
                هل أنت متأكد من حذف المستند "{documentToDelete.title || 'بدون عنوان'}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 flex-row-reverse border-t border-slate-100">
              <button
                onClick={() => documentToDelete.id && deleteDocument(documentToDelete.id)}
                className="bg-red-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => setDocumentToDelete(null)}
                className="px-5 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentEditor;
