import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';

export const useSchoolCommunication = () => {
    const [activeTab, setActiveTab] = useState<'send' | 'logs'>('send');
    
    const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
    const guardians = useLiveQuery(() => db.guardians?.toArray()) || [];
    const classes = useLiveQuery(() => db.schoolClassesList?.toArray()) || [];
    const logs = useLiveQuery(() => db.communicationLogs?.toArray()) || [];

    // Send State
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
    const [classFilter, setClassFilter] = useState<number>(0);
    const [searchStudent, setSearchStudent] = useState('');
    const [messageTemplate, setMessageTemplate] = useState<string>('');
    const [customMessage, setCustomMessage] = useState<string>('');
    const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'app'>('whatsapp');

    // Dialog/alert feedback state
    const [feedback, setFeedback] = useState<{
        type: 'success' | 'error' | 'warning';
        message: string;
    } | null>(null);

    const templates = [
        { id: 'absence', name: 'غياب الطفل', content: 'السيد ولي أمر الطالب {student_name} المكرم، نود إعلامكم بغياب ابنكم/ابنتكم عن الحضور اليوم. نرجو التواصل لتوضيح السبب وتزويدنا بأي معلومات صحية إن لزم الأمر.' },
        { id: 'late_payment', name: 'تأخير السداد', content: 'السيد ولي أرم الطالب {student_name} المكرم، نود تذكيركم بوجود مبالغ مستحقة لم يتم سدادها حتى تاريخه. نرجو المبادرة بالسداد ولكم جزيل الشكر.' },
        { id: 'activity', name: 'نشاط اليوم', content: 'يسعدنا إخباركم أن الطالب {student_name} قد تفاعل بشكل ممتاز في أنشطة اليوم وكان أداؤه رائعاً.' },
        { id: 'trip', name: 'رحلة مدرسية', content: 'السادة أولياء الأمور، نود إعلامكم بوجود رحلة مدرسية قادمة. يرجى مراجعة الإدارة أو تطبيق المدرسة للموافقة والتفاصيل.' },
        { id: 'meeting', name: 'اجتماع ولي أمر', content: 'رسالة تذكيرية بموعد اجتماع أولياء الأمور. نتطلع لحضوركم ومشاركتكم الفعالة لما فيه مصلحة أبنائنا.' },
        { id: 'health', name: 'ملاحظة صحية', content: 'السيد ولي أمر الطالب {student_name} المكرم، نرجو لفت انتباهكم لملاحظة صحية بسيطة عن الطفل اليوم. يرجى مراجعة إدارة العيادة أو التطبيق للمزيد من التفاصيل.' },
        { id: 'monthly_eval', name: 'تقييم شهري', content: 'السيد ولي أمر الطالب {student_name} المكرم، تم إصدار التقييم الشهري للطفل. يمكنكم الاطلاع عليه عبر تطبيق ولي الأمر.' },
    ];

    const filteredStudents = students.filter(s => {
        const matchesClass = classFilter === 0 || s.classroomId === classFilter;
        const matchesSearch = s.name.includes(searchStudent) || (s.code && s.code.includes(searchStudent));
        return matchesClass && matchesSearch;
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedStudents(filteredStudents.map(s => s.id!));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleSelectStudent = (id: number) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(selectedStudents.filter(sId => sId !== id));
        } else {
            setSelectedStudents([...selectedStudents, id]);
        }
    };

    const handleTemplateChange = (tplId: string) => {
        setMessageTemplate(tplId);
        if (tplId) {
            const tpl = templates.find(t => t.id === tplId);
            if (tpl) setCustomMessage(tpl.content);
        } else {
            setCustomMessage('');
        }
    };

    const handleSendMessage = async () => {
        if (selectedStudents.length === 0) {
            setFeedback({
                type: 'warning',
                message: 'الرجاء تحديد طالب واحد على الأقل من القائمة اليمنى.'
            });
            return;
        }
        if (!customMessage.trim()) {
            setFeedback({
                type: 'warning',
                message: 'الرجاء كتابة نص الرسالة الإشعارية أولاً.'
            });
            return;
        }

        try {
            for (const studentId of selectedStudents) {
                const student = students.find(s => s.id === studentId);
                let messageToSend = customMessage;
                if (student) {
                    messageToSend = messageToSend.replace('{student_name}', student.name);
                }

                await db.communicationLogs.add({
                    studentId: studentId,
                    type: messageTemplate || 'custom',
                    channel: channel,
                    date: new Date().toISOString(),
                    status: 'sent',
                    messageContent: messageToSend
                });
            }
            
            setFeedback({
                type: 'success',
                message: 'تم إرسال الرسائل بنجاح لجميع أولياء الأمور وتسجيلها بالسجل.'
            });
            setCustomMessage('');
            setSelectedStudents([]);
            setMessageTemplate('');
        } catch (err) {
            setFeedback({
                type: 'error',
                message: 'حدث خطأ غير متوقع أثناء إرسال المراسلات.'
            });
        }
    };

    return {
        activeTab,
        setActiveTab,
        students,
        guardians,
        classes,
        logs,
        selectedStudents,
        setSelectedStudents,
        classFilter,
        setClassFilter,
        searchStudent,
        setSearchStudent,
        messageTemplate,
        setMessageTemplate,
        customMessage,
        setCustomMessage,
        channel,
        setChannel,
        feedback,
        setFeedback,
        templates,
        filteredStudents,
        handleSelectAll,
        handleSelectStudent,
        handleTemplateChange,
        handleSendMessage,
    };
};
