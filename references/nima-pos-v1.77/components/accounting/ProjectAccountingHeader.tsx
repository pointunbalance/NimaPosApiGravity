import React from "react";
import { Briefcase, Plus } from "lucide-react";

interface ProjectAccountingHeaderProps {
  onNewProject: () => void;
}

const ProjectAccountingHeader: React.FC<ProjectAccountingHeaderProps> = ({ onNewProject }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-emerald-600 animate-pulse" />
          حسابات المشاريع (Project Accounting)
        </h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">
          إدارة التكاليف والإيرادات والمستخلصات الخاصة بكل مشروع بشكل مستقل
        </p>
      </div>
      <button
        onClick={onNewProject}
        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-bold text-sm shadow-sm"
      >
        <Plus className="w-4 h-4" />
        مشروع جديد
      </button>
    </div>
  );
};

export default ProjectAccountingHeader;
