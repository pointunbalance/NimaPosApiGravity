import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { MessageSquare, Send, Search, UserCircle, Clock, Paperclip, Smile, MoreVertical, Check, CheckCheck, FileText, Image as ImageIcon, X } from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export const InternalCommunication: React.FC = () => {
  const users = useLiveQuery(() => db.users.toArray(), []) || [];
  const allMessages = useLiveQuery(() => db.messages.toArray(), []) || [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string, type: 'image' | 'document' } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // For testing purposes, we assume the current logged-in user is the first admin
  const currentUser = users.find(u => u.role === 'admin') || users[0];

  const messages = useLiveQuery(
    () => {
      if (!currentUser?.id || !selectedUser) return [];
      return db.messages
        .where('senderId').equals(currentUser.id).and(m => m.receiverId === selectedUser)
        .or('receiverId').equals(currentUser.id).and(m => m.senderId === selectedUser)
        .sortBy('timestamp');
    },
    [currentUser?.id, selectedUser]
  ) || [];

  // Mark messages as read when opening a chat
  useEffect(() => {
    if (selectedUser && currentUser?.id) {
      const unreadMessages = messages.filter(m => m.receiverId === currentUser.id && !m.isRead);
      if (unreadMessages.length > 0) {
        unreadMessages.forEach(async (msg) => {
          if (msg.id) {
            await db.messages.update(msg.id, { isRead: true });
          }
        });
      }
    }
  }, [selectedUser, messages, currentUser?.id]);

  const filteredUsers = users.filter(u => 
    u.id !== currentUser?.id &&
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !attachment) || !selectedUser || !currentUser?.id) return;
    
    await db.messages.add({
      senderId: currentUser.id,
      receiverId: selectedUser,
      content: message.trim(),
      timestamp: new Date(),
      isRead: false,
      ...(attachment ? {
        attachmentName: attachment.name,
        attachmentType: attachment.type,
        attachmentUrl: '#' // Mock URL
      } : {})
    });

    setMessage('');
    setAttachment(null);
    setShowEmojiPicker(false);
  };

  const handleAttachment = (type: 'image' | 'document') => {
    setAttachment({
      name: type === 'image' ? 'صورة_مرفقة.jpg' : 'مستند_مهم.pdf',
      type
    });
  };

  const getUnreadCount = (userId: number) => {
    if (!currentUser?.id) return 0;
    return allMessages.filter(m => m.senderId === userId && m.receiverId === currentUser.id && !m.isRead).length;
  };

  const getLastMessage = (userId: number) => {
    if (!currentUser?.id) return null;
    const userMsgs = allMessages.filter(m => 
      (m.senderId === userId && m.receiverId === currentUser.id) ||
      (m.receiverId === userId && m.senderId === currentUser.id)
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return userMsgs[0];
  };

  const isOnline = (userId: number) => {
    // Mock online status based on user ID for demonstration
    return userId % 2 === 0;
  };

  const groupMessagesByDate = () => {
    const groups: { [key: string]: typeof messages } = {};
    messages.forEach(msg => {
      const date = new Date(msg.timestamp);
      let dateKey = format(date, 'yyyy-MM-dd');
      if (isToday(date)) dateKey = 'اليوم';
      else if (isYesterday(date)) dateKey = 'الأمس';
      else dateKey = format(date, 'dd MMMM yyyy', { locale: ar });

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
    });
    return groups;
  };

  const groupedMessages = groupMessagesByDate();

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-indigo-600" />
          التواصل الداخلي
        </h1>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex overflow-hidden">
        {/* Users List */}
        <div className="w-1/3 border-l border-slate-100 flex flex-col bg-slate-50/30">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث عن موظف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.map(user => {
              const unreadCount = getUnreadCount(user.id!);
              const lastMsg = getLastMessage(user.id!);
              const online = isOnline(user.id!);

              return (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user.id!)}
                  className={`w-full flex items-center gap-3 p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                    selectedUser === user.id ? 'bg-indigo-50/50 border-r-4 border-r-indigo-600' : ''
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <UserCircle className="w-8 h-8" />
                    </div>
                    {online && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div className="text-right flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium text-slate-800 truncate">{user.name}</p>
                      {lastMsg && (
                        <span className="text-xs text-slate-400 shrink-0">
                          {formatDistanceToNow(new Date(lastMsg.timestamp), { addSuffix: true, locale: ar })}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-sm truncate ${unreadCount > 0 ? 'text-indigo-600 font-medium' : 'text-slate-500'}`}>
                        {lastMsg ? (lastMsg.attachmentType ? `[${lastMsg.attachmentType === 'image' ? 'صورة' : 'ملف'}] ${lastMsg.content}` : lastMsg.content) : user.role}
                      </p>
                      {unreadCount > 0 && (
                        <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                لا يوجد موظفين مطابقين للبحث
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50/50 relative">
          {selectedUser ? (
            <>
              <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <UserCircle className="w-8 h-8" />
                    </div>
                    {isOnline(selectedUser) && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-lg">
                      {users.find(u => u.id === selectedUser)?.name}
                    </h2>
                    <p className={`text-sm font-medium flex items-center gap-1 ${isOnline(selectedUser) ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {isOnline(selectedUser) ? 'متصل الآن' : 'غير متصل'}
                    </p>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <MessageSquare className="w-16 h-16 mb-4 text-slate-200" />
                    <p>لا توجد رسائل سابقة. ابدأ المحادثة الآن!</p>
                  </div>
                ) : (
                  Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date} className="space-y-6">
                      <div className="flex justify-center">
                        <span className="bg-slate-200/50 text-slate-500 text-xs px-3 py-1 rounded-full font-medium">
                          {date}
                        </span>
                      </div>
                      {msgs.map((msg, idx) => {
                        const isMe = msg.senderId === currentUser?.id;
                        return (
                          <div key={msg.id || idx} className={`flex gap-3 max-w-[80%] ${isMe ? 'mr-auto flex-row-reverse' : ''}`}>
                            {!isMe && (
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-auto">
                                <UserCircle className="w-5 h-5" />
                              </div>
                            )}
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              <div className={`p-4 rounded-2xl shadow-sm relative group ${
                                isMe 
                                  ? 'bg-indigo-600 text-white rounded-br-none' 
                                  : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                              }`}>
                                {msg.attachmentType && (
                                  <div className={`flex items-center gap-2 p-2 rounded-lg mb-2 ${isMe ? 'bg-indigo-500/50' : 'bg-slate-50 border border-slate-100'}`}>
                                    {msg.attachmentType === 'image' ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                    <span className="text-sm font-medium truncate max-w-[150px]">{msg.attachmentName}</span>
                                  </div>
                                )}
                                {msg.content && <p className="leading-relaxed">{msg.content}</p>}
                              </div>
                              <div className={`text-xs text-slate-400 mt-1.5 flex items-center gap-1 px-1 ${isMe ? 'justify-end' : ''}`}>
                                <Clock className="w-3 h-3" />
                                {format(msg.timestamp, 'hh:mm a')}
                                {isMe && (
                                  <span className="ml-1">
                                    {msg.isRead ? <CheckCheck className="w-3.5 h-3.5 text-blue-500" /> : <Check className="w-3.5 h-3.5" />}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Attachment Preview */}
              {attachment && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    {attachment.type === 'image' ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{attachment.name}</p>
                    <p className="text-xs text-slate-500">مرفق جاهز للإرسال</p>
                  </div>
                  <button onClick={() => setAttachment(null)} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="p-4 bg-white border-t border-slate-100 relative">
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-4 mb-2 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex gap-2 z-20">
                    {['👍', '❤️', '😂', '😮', '😢', '👏', '🔥', '🎉'].map(emoji => (
                      <button 
                        key={emoji}
                        type="button"
                        onClick={() => { setMessage(prev => prev + emoji); setShowEmojiPicker(false); }}
                        className="text-xl p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                  <div className="flex gap-1">
                    <button 
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    <div className="relative group">
                      <button 
                        type="button"
                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-full right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-lg p-1 hidden group-hover:flex flex-col gap-1 w-32 z-20">
                        <button type="button" onClick={() => handleAttachment('image')} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg text-right">
                          <ImageIcon className="w-4 h-4 text-indigo-500" /> صورة
                        </button>
                        <button type="button" onClick={() => handleAttachment('document')} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg text-right">
                          <FileText className="w-4 h-4 text-rose-500" /> مستند
                        </button>
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="اكتب رسالتك هنا..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() && !attachment}
                    className="bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors shadow-sm"
                  >
                    <Send className="w-5 h-5" />
                    <span className="hidden sm:inline">إرسال</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                <MessageSquare className="w-12 h-12 text-slate-300" />
              </div>
              <p className="text-lg font-medium text-slate-500">اختر محادثة للبدء</p>
              <p className="text-sm mt-2">يمكنك البحث عن الموظفين من القائمة الجانبية</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternalCommunication;
