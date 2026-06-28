import { AlertCircle, Activity, Heart, Star, Target, UserCircle } from "lucide-react";

export const BEHAVIOR_TYPES = [
  {
    id: "hitting",
    label: "ضرب زملاء",
    icon: AlertCircle,
    color: "text-rose-600",
    bg: "bg-rose-100",
  },
  {
    id: "crying",
    label: "بكاء مستمر",
    icon: AlertCircle,
    color: "text-amber-600",
    bg: "bg-amber-100",
  },
  {
    id: "refuse_food",
    label: "رفض الطعام",
    icon: Target,
    color: "text-orange-600",
    bg: "bg-orange-100",
  },
  {
    id: "refuse_participate",
    label: "رفض المشاركة",
    icon: UserCircle,
    color: "text-slate-600",
    bg: "bg-slate-100",
  },
  {
    id: "hyperactive",
    label: "نشاط زائد",
    icon: Activity,
    color: "text-indigo-600",
    bg: "bg-indigo-100",
  },
  {
    id: "isolated",
    label: "عزلة",
    icon: Target,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    id: "fear",
    label: "خوف",
    icon: Heart,
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
  {
    id: "improvement",
    label: "تحسن ملحوظ",
    icon: Star,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
];
