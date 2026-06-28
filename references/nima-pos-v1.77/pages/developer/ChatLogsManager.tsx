import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Search, 
  MessageSquare, 
  Bot, 
  Calendar, 
  History,
  RefreshCw,
  Info,
  Clock,
  Terminal,
  ArrowRight,
  Hash
} from 'lucide-react';
import toast from 'react-hot-toast';

const ChatLogsManager = () => {
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchChatLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch('/api/chat_logs');
      if (!response.ok) throw new Error('فشل تحميل المحادثات');
      const data = await response.json();
      setChatLogs(data);
      if (data.length > 0) {
        if (!selectedChat || !data.some((c: any) => c.id === selectedChat.id)) {
          setSelectedChat(data[0]);
        } else {
          const updatedSelected = data.find((c: any) => c.id === selectedChat.id);
          if (updatedSelected) {
            setSelectedChat(updatedSelected);
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء تحميل سجل المحادثات');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatLogs();

    // Auto-refresh logs every 6 seconds to capture new chat files immediately
    const interval = setInterval(() => {
      fetchChatLogs(true);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const parseInlineMarkdown = (text: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const codeRegex = /`(.*?)`/g;

    let parts: React.ReactNode[] = [];
    let keyIdx = 0;

    const tokens: { type: 'text' | 'bold' | 'code'; value: string; index: number }[] = [];
    
    text.replace(boldRegex, (match, p1, offset) => {
      tokens.push({ type: 'bold', value: p1, index: offset });
      return match;
    });

    text.replace(codeRegex, (match, p1, offset) => {
      tokens.push({ type: 'code', value: p1, index: offset });
      return match;
    });

    tokens.sort((a, b) => a.index - b.index);

    let currentPos = 0;
    for (const token of tokens) {
      if (token.index < currentPos) continue;
      
      if (token.index > currentPos) {
        parts.push(<span key={keyIdx++}>{text.substring(currentPos, token.index)}</span>);
      }
      
      if (token.type === 'bold') {
        parts.push(<strong key={keyIdx++} className="font-extrabold text-slate-100 border-b border-indigo-500/30">{token.value}</strong>);
        currentPos = token.index + token.value.length + 4;
      } else if (token.type === 'code') {
        parts.push(<code key={keyIdx++} className="bg-slate-800 text-brand-300 px-1.5 py-0.5 rounded font-mono text-xs border border-slate-700/50">{token.value}</code>);
        currentPos = token.index + token.value.length + 2;
      }
    }

    if (currentPos < text.length) {
      parts.push(<span key={keyIdx++}>{text.substring(currentPos)}</span>);
    }

    return parts.length > 0 ? parts : text;
  };

  const renderMarkdown = (md: string, isDARK = false) => {
    if (!md) return <div className="text-slate-400 italic text-center py-12">لا يوجد محتوى لعرضه.</div>;
    
    const lines = md.split('\n');
    let inCodeBlock = false;
    let codeLines: string[] = [];

    return (
      <div className={`space-y-4 leading-relaxed font-sans select-text rtl text-right ${isDARK ? 'text-slate-200' : 'text-slate-800'}`}>
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          
          if (trimmed.startsWith('```')) {
            if (inCodeBlock) {
              inCodeBlock = false;
              const blockContent = codeLines.join('\n');
              codeLines = [];
              return (
                <div key={idx} className="relative group my-2">
                  <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded uppercase">Code Block</div>
                  <pre className="bg-[#121824] text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-emerald-950/20 shadow-inner">
                    <code>{blockContent}</code>
                  </pre>
                </div>
              );
            } else {
              inCodeBlock = true;
              return null;
            }
          }

          if (inCodeBlock) {
            codeLines.push(line);
            return null;
          }

          if (trimmed.startsWith('# ')) {
            return (
              <h1 key={idx} className={`text-xl font-black border-r-4 border-brand-500 pr-3 pb-1 pt-4 mt-2 ${isDARK ? 'text-white' : 'text-slate-900'}`}>
                {trimmed.substring(2)}
              </h1>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h2 key={idx} className={`text-base font-extrabold border-b pb-1 pt-3 ${isDARK ? 'text-slate-200 border-slate-800' : 'text-slate-800 border-slate-100'}`}>
                {trimmed.substring(3)}
              </h2>
            );
          }
          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={idx} className={`text-sm font-bold pt-2 ${isDARK ? 'text-slate-300' : 'text-slate-700'}`}>
                {trimmed.substring(4)}
              </h3>
            );
          }

          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const listContent = trimmed.substring(2);
            if (listContent.startsWith('[ ] ')) {
              return (
                <div key={idx} className={`flex items-center gap-2 pr-4 py-0.5 ${isDARK ? 'text-slate-300' : 'text-slate-700'}`}>
                  <input type="checkbox" disabled className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 shrink-0 transition-all cursor-default" />
                  <span className="text-sm font-medium">{parseInlineMarkdown(listContent.substring(4))}</span>
                </div>
              );
            }
            if (listContent.startsWith('[x] ') || listContent.startsWith('[X] ')) {
              return (
                <div key={idx} className="flex items-center gap-2 pr-4 py-0.5 line-through text-slate-400">
                  <input type="checkbox" checked disabled className="rounded border-emerald-200 text-emerald-600 focus:ring-emerald-500 w-4 h-4 shrink-0 cursor-default" />
                  <span className="text-sm font-medium">{parseInlineMarkdown(listContent.substring(4))}</span>
                </div>
              );
            }
            return (
              <li key={idx} className={`list-disc list-inside pr-4 text-sm py-0.5 font-medium leading-relaxed ${isDARK ? 'text-slate-300' : 'text-slate-600'}`}>
                {parseInlineMarkdown(listContent)}
              </li>
            );
          }

          if (trimmed.startsWith('> ')) {
            return (
              <div key={idx} className={`p-4 rounded-l-xl text-sm font-medium leading-relaxed my-3 shadow-sm flex items-start gap-2.5 ${isDARK ? 'bg-slate-800/50 border-r-4 border-brand-400 text-slate-200' : 'bg-brand-50/50 border-r-4 border-brand-500 text-brand-900'}`}>
                <Info size={16} className="text-brand-400 mt-0.5 shrink-0" />
                <span>{parseInlineMarkdown(trimmed.substring(2))}</span>
              </div>
            );
          }

          if (trimmed === '') {
            return <div key={idx} className="h-2"></div>;
          }

          return (
            <p key={idx} className={`text-sm leading-relaxed font-medium whitespace-pre-wrap select-text ${isDARK ? 'text-slate-300' : 'text-slate-600'}`}>
              {parseInlineMarkdown(line)}
            </p>
          );
        })}
      </div>
    );
  };

  const filteredChatLogs = useMemo(() => {
    return chatLogs.filter(chat => {
      const matchSearch = 
        chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.userContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.aiContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.timestamp.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [chatLogs, searchTerm]);

  // Statistics
  const totalCharacters = useMemo(() => {
    return chatLogs.reduce((sum, c) => sum + (c.userContent?.length || 0) + (c.aiContent?.length || 0), 0);
  }, [chatLogs]);

  const activeReplies = useMemo(() => {
    return chatLogs.filter(c => c.aiContent).length;
  }, [chatLogs]);

  return (
    <div className="flex flex-col h-full gap-6 p-4 sm:p-6 bg-slate-50/50 max-w-7xl mx-auto w-full select-none" dir="rtl">
      
      {/* 1. Header Hero Panel */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600/10 to-indigo-600/10 pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10 text-right">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/10">
            <Terminal size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-wide">
              سجلات حوارات المطور وقرارات الذكاء الاصطناعي
            </h1>
            <p className="text-slate-400 text-xs mt-1 flex items-center gap-1.5 font-medium">
              <History size={14} className="text-brand-400" />
              تتبع، قراءة، وبحث سجلات الحوارات المسجلة تلقائياً لتوثيق المنطق البرمجي والمحاسبي.
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchChatLogs()}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white rounded-xl shadow-md shadow-brand-600/10 transition-all font-extrabold text-xs sm:text-sm shrink-0 z-10"
        >
          <RefreshCw size={16} className={loading && chatLogs.length === 0 ? "animate-spin" : ""} />
          <span>تحديث السجلات الفوري</span>
        </button>
      </div>

      {/* 2. Bento Style Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <MessageSquare size={20} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-400 font-bold">جلسات الحوار</span>
            <span className="text-base font-black text-slate-800 leading-tight mt-0.5">{chatLogs.length} جلسة</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Bot size={20} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-400 font-bold">الردود الفعالة</span>
            <span className="text-base font-black text-slate-800 leading-tight mt-0.5">{activeReplies} رد</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
            <Calendar size={20} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-400 font-bold">آخر تحديث للسجل</span>
            <span className="text-xs font-black text-brand-700 leading-tight mt-1 truncate max-w-[120px]">
              ⏱ {chatLogs[0]?.timestamp?.split(' ')[0] || 'مستمر'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Hash size={20} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-400 font-bold">إجمالي المحتوى</span>
            <span className="text-base font-black text-slate-800 leading-tight mt-0.5">{totalCharacters} حرف</span>
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-gradient-to-r from-emerald-600/5 to-indigo-600/5 border border-emerald-100/60 p-4 rounded-xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600/15 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-400 font-bold">حالة الرصد التلقائي</span>
            <span className="text-xs font-black text-emerald-700 leading-tight mt-1 flex items-center gap-1">
              مراقب ونشط 🟢
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0 relative">
        
        {/* Left Side: Sessions Sidebar */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200/100 p-4 flex flex-col gap-4 overflow-hidden min-h-[300px] lg:min-h-0 text-right">
          <div className="flex flex-col gap-2 shrink-0">
            <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <MessageSquare size={14} className="text-slate-400" />
              أرشيف جلسات الشات
            </span>
            <div className="relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ابحث بقارئ الشات والوجات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-brand-500 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-4 focus:ring-brand-50 text-slate-800 text-right font-sans"
                dir="rtl"
              />
            </div>
          </div>

          {/* Chat List Scrollable Area */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            {loading && chatLogs.length === 0 ? (
              <div className="text-center py-10">
                <RefreshCw size={24} className="mx-auto text-brand-500 animate-spin" />
                <p className="text-slate-400 text-xs font-bold mt-3">جاري تحميل سجل السجلات...</p>
              </div>
            ) : filteredChatLogs.length === 0 ? (
              <div className="text-center py-10">
                <AlertCircle size={24} className="mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-slate-400 text-xs font-semibold mt-3">لم نسجل محادثة تطابق البحث</p>
              </div>
            ) : (
              filteredChatLogs.map(chat => {
                const isActive = selectedChat?.id === chat.id;
                
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full text-right p-3 rounded-xl transition-all border flex items-center justify-between group ${
                      isActive
                        ? 'bg-[#f4f7fc] border-slate-200 text-brand-900 shadow-sm'
                        : 'bg-white hover:bg-slate-50/70 border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-2 rounded-lg shrink-0 transition-all ${
                        isActive 
                          ? 'bg-brand-600 text-white shadow-md' 
                          : 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100'
                      }`}>
                        <MessageSquare size={14} />
                      </div>
                      <div className="flex flex-col justify-center overflow-hidden">
                        <span className="text-xs font-extrabold truncate w-40 sm:w-48 text-slate-800 text-right">
                          {chat.title}
                        </span>
                        <span className="text-[9px] text-slate-400 font-extrabold mt-0.5 truncate w-36 text-right flex items-center gap-1 font-mono">
                          <Clock size={10} />
                          {chat.timestamp}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} className={`shrink-0 transition-transform ${isActive ? 'text-brand-600 translate-x-1' : 'text-slate-300'}`} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Deep Session Viewer Workspace */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 p-0 overflow-hidden flex flex-col min-h-[500px] lg:min-h-0">
          {selectedChat ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/10">
              
              {/* Workspace Top Headers */}
              <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 overflow-hidden w-full text-right">
                  <div className="p-1.5 bg-brand-50 text-brand-600 rounded-lg shrink-0">
                    <MessageSquare size={16} />
                  </div>
                  <span className="text-slate-800 font-extrabold text-[13px] truncate max-w-xs md:max-w-lg">
                    {selectedChat.title}
                  </span>
                  <span className="bg-slate-200/80 text-slate-800 text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 font-mono">
                    ⏱ {selectedChat.timestamp}
                  </span>
                </div>
              </div>

              {/* Main Timeline Dialog Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. User Prompt Bubble */}
                <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4 text-right">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3" dir="rtl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-black text-xs shadow-sm">
                        UA
                      </div>
                      <div className="text-right">
                        <span className="block text-xs font-black text-slate-800">أمر واستفسار المطور أو المستخدم</span>
                        <span className="block text-[10px] text-slate-400 font-bold mt-0.5">صيغة الطلب المباشرة والقرارات الموجهة</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2.5 py-0.5 rounded-full font-mono">
                      User_Prompt.txt
                    </span>
                  </div>
                  <div className="text-slate-700 font-medium leading-relaxed max-w-full overflow-hidden text-right">
                    {renderMarkdown(selectedChat.userContent || '', false)}
                  </div>
                </div>

                {/* 2. AI Assistant response bubble */}
                {selectedChat.aiContent && (
                  <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-md border border-slate-800 space-y-4 text-right">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3" dir="rtl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-black shadow-sm shadow-brand-500/20">
                          AI
                        </div>
                        <div className="text-right">
                          <span className="block text-xs font-black text-slate-200">استجابة ورد المساعد الذكي</span>
                          <span className="block text-[10px] text-brand-400 font-bold mt-0.5">المنطق البرمجي، رزمة التغييرات والإرشادات الهندسية</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2.5 py-0.5 rounded-full font-mono">
                        AI_Response.txt
                      </span>
                    </div>
                    <div className="text-slate-200 font-sans leading-relaxed text-sm select-text selection:bg-brand-500 selection:text-white text-right">
                      {renderMarkdown(selectedChat.aiContent || '', true)}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer status bar for Chat */}
              <div className="bg-slate-50 shrink-0 p-3 border-t border-slate-200/80 px-6 flex items-center justify-between text-[11px] text-slate-400 font-bold font-sans">
                <div className="flex items-center gap-4">
                  <span>طلب المستخدم: <span className="text-slate-600">{selectedChat.userContent?.length || 0} حرف</span></span>
                  {selectedChat.aiContent && (
                    <span>استجابة الذكاء: <span className="text-slate-600">{selectedChat.aiContent?.length || 0} حرف</span></span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <History size={12} />
                  <span>تم توثيق وحفظ لقطة التغيير بشكل دائم محلياً</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/15">
              <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 mb-4 border border-brand-100/55">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-sm font-black text-slate-700">لم يتم اختيار جلسة حوار</h3>
              <p className="text-xs text-slate-400 font-semibold max-w-xs mt-2 leading-relaxed">
                الرجاء تحديد أحد جلسات الحوار والقرارات المسجلة من القائمة الجانبية اليمنى لعرض وتحليل تفاصيل وسياقات التطوير.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default ChatLogsManager;
