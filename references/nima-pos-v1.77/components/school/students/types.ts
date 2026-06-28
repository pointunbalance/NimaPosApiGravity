import {
  User as UserIcon,
  Users,
  FileText,
  CreditCard,
  DollarSign,
  CalendarClock,
  ClipboardList,
  Activity,
  Brain,
  CheckSquare,
  Clock,
} from "lucide-react";

export const TABS = [
  { id: "info", label: "البيانات الأساسية", icon: UserIcon },
  { id: "parents", label: "بيانات الوالدين", icon: Users },
  { id: "guardian", label: "ولي الأمر", icon: Users },
  { id: "pickups", label: "المصرح لهم بالاستلام", icon: Users },
  { id: "attachments", label: "المرفقات", icon: FileText },
  { id: "subscriptions", label: "الاشتراكات والفواتير", icon: CreditCard },
  { id: "payments", label: "المدفوعات", icon: DollarSign },
  { id: "attendance", label: "الحضور والغياب", icon: CalendarClock },
  { id: "evaluations", label: "التقييمات", icon: ClipboardList },
  { id: "health", label: "الصحة والتغذية", icon: Activity },
  { id: "behavioral", label: "السلوك والتربية", icon: Brain },
  { id: "checklist", label: "المهام الإدارية", icon: CheckSquare },
  { id: "notes", label: "الملاحظات", icon: FileText },
  { id: "logs", label: "سجل العمليات", icon: Clock },
];

export interface SchoolStudentModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (val: boolean) => void;
  handleSaveStudent: (e: any) => void;
  studentFormData: any;
  setStudentFormData: (val: any) => void;
  levels: any[];
  filteredClassesForSelect: any[];
  parents: any[];
  handleClose: any;
  activeTab: any;
  setActiveTab: any;
  handleSaveInfo: any;
  guardianId: any;
  setGuardianId: any;
  guardians: any[];
  handleLinkGuardian: any;
  parentsForm: any;
  setParentsForm: any;
  handleSaveParents: any;
  newPickup: any;
  setNewPickup: any;
  handleAddPickup: any;
  handleRemovePickup: any;
  selectedChildId: number | null;
  medicalForm: any;
  setMedicalForm: any;
  handleSaveMedical: any;
  behavioralForm: any;
  setBehavioralForm: any;
  handleSaveBehavioral: any;
  checklistForm: any;
  setChecklistForm: any;
  handleSaveChecklist: any;
  childNotes: string;
  setChildNotes: (val: string) => void;
  handleSaveNotes: any;
  handleAddSubscription: any;
  subForm: any;
  setSubForm: any;
  paymentForm: any;
  setPaymentForm: any;
  handleAddPayment: any;
  evalForm: any;
  setEvalForm: any;
  handleAddEvaluation: any;
}
