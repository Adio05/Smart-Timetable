import React from 'react';
import {
  Sparkles,
  X,
  Code2,
  Stethoscope,
  Briefcase,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { ClassItem } from '../types/timetable';
import { SAMPLE_COMPUTER_SCIENCE_CLASSES } from '../lib/offlineStorage';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (preset: Omit<ClassItem, 'id' | 'userId'>[]) => void;
  onClearAll: () => void;
  classCount: number;
}

const MEDICAL_PRESET: Omit<ClassItem, 'id' | 'userId'>[] = [
  {
    courseCode: 'ANA 201',
    courseTitle: 'Human Anatomy & Histology',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '11:00',
    location: 'Anatomy Lab 1',
    instructor: 'Dr. Gregory House',
    color: '#0ea5e9',
    notes: 'Dissection toolkit and sterile gloves required.',
  },
  {
    courseCode: 'BIO 210',
    courseTitle: 'Medical Biochemistry',
    dayOfWeek: 'Monday',
    startTime: '12:00',
    endTime: '14:00',
    location: 'Science Lecture Hall A',
    instructor: 'Prof. Meredith Grey',
    color: '#10b981',
    notes: 'Enzyme kinetics and metabolic pathways.',
  },
  {
    courseCode: 'PHY 204',
    courseTitle: 'Cardiovascular Physiology',
    dayOfWeek: 'Tuesday',
    startTime: '09:30',
    endTime: '11:30',
    location: 'Clinical Amphitheater',
    instructor: 'Dr. Sanjay Gupta',
    color: '#f43f5e',
    notes: 'ECG interpretation lecture.',
  },
  {
    courseCode: 'PHA 301',
    courseTitle: 'Introduction to Pharmacology',
    dayOfWeek: 'Wednesday',
    startTime: '10:00',
    endTime: '12:00',
    location: 'Pharmacy Building 202',
    instructor: 'Dr. Lisa Cuddy',
    color: '#a855f7',
    notes: 'Receptor agonists and drug clearance mechanics.',
  },
  {
    courseCode: 'ANA 201',
    courseTitle: 'Histology Laboratory Practicum',
    dayOfWeek: 'Thursday',
    startTime: '13:00',
    endTime: '15:30',
    location: 'Microscopy Lab 4',
    instructor: 'Dr. Gregory House',
    color: '#0ea5e9',
    notes: 'Tissue slide identification quiz.',
  },
  {
    courseCode: 'ETH 105',
    courseTitle: 'Bioethics & Patient Communication',
    dayOfWeek: 'Friday',
    startTime: '09:00',
    endTime: '11:00',
    location: 'Medical Center Hall 5',
    instructor: 'Dr. John Watson',
    color: '#f59e0b',
    notes: 'Informed consent case study discussion.',
  },
];

const BUSINESS_PRESET: Omit<ClassItem, 'id' | 'userId'>[] = [
  {
    courseCode: 'ACC 201',
    courseTitle: 'Financial Accounting & Reporting',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '11:00',
    location: 'Business Wing 101',
    instructor: 'Prof. Warren Buffett',
    color: '#10b981',
    notes: 'Bring financial calculator. Cash flow statement analysis.',
  },
  {
    courseCode: 'ECO 202',
    courseTitle: 'Intermediate Microeconomics',
    dayOfWeek: 'Monday',
    startTime: '13:00',
    endTime: '15:00',
    location: 'Executive Auditorium',
    instructor: 'Dr. Janet Yellen',
    color: '#6366f1',
    notes: 'Consumer equilibrium and game theory pricing models.',
  },
  {
    courseCode: 'MKT 301',
    courseTitle: 'Strategic Brand Marketing',
    dayOfWeek: 'Tuesday',
    startTime: '10:00',
    endTime: '12:00',
    location: 'Innovation Studio B',
    instructor: 'Prof. Philip Kotler',
    color: '#f59e0b',
    notes: 'Omnichannel customer journey deck review.',
  },
  {
    courseCode: 'FIN 310',
    courseTitle: 'Corporate Financial Modeling',
    dayOfWeek: 'Wednesday',
    startTime: '13:00',
    endTime: '15:30',
    location: 'Finance Computer Lab 2',
    instructor: 'Dr. Ray Dalio',
    color: '#0ea5e9',
    notes: 'DCF model building in Excel.',
  },
  {
    courseCode: 'LAW 240',
    courseTitle: 'Business Law & Corporate Governance',
    dayOfWeek: 'Thursday',
    startTime: '09:30',
    endTime: '11:30',
    location: 'Moot Court 3',
    instructor: 'Prof. Harvey Specter',
    color: '#a855f7',
    notes: 'Fiduciary duties of board members and mergers.',
  },
  {
    courseCode: 'MGT 350',
    courseTitle: 'Organizational Leadership',
    dayOfWeek: 'Friday',
    startTime: '10:00',
    endTime: '12:00',
    location: 'Leadership Suite 404',
    instructor: 'Dr. Simon Sinek',
    color: '#f43f5e',
    notes: 'Negotiation simulation exercise.',
  },
];

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onApplyPreset,
  onClearAll,
  classCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Timetable Schedule Presets
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instantly load sample 9am-4pm schedules or reset
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {/* Preset 1: Computer Science */}
          <div
            onClick={() => {
              onApplyPreset(SAMPLE_COMPUTER_SCIENCE_CLASSES);
              onClose();
            }}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 cursor-pointer transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition">
                  Computer Science & Engineering
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data Structures, Discrete Math, System Architecture, Web Eng, Ethics (10 lectures)
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
              Load Preset →
            </span>
          </div>

          {/* Preset 2: Health / Pre-Med */}
          <div
            onClick={() => {
              onApplyPreset(MEDICAL_PRESET);
              onClose();
            }}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 cursor-pointer transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
                  Pre-Med & Health Sciences
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Human Anatomy, Biochemistry, Pharmacology, Physiology Labs (6 lectures)
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
              Load Preset →
            </span>
          </div>

          {/* Preset 3: Business & Finance */}
          <div
            onClick={() => {
              onApplyPreset(BUSINESS_PRESET);
              onClose();
            }}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 cursor-pointer transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 transition">
                  Business & Corporate Finance
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Financial Accounting, Microeconomics, Marketing, Law & Modeling (6 lectures)
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 shrink-0">
              Load Preset →
            </span>
          </div>
        </div>

        {/* Clear Timetable option */}
        {classCount > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Have {classCount} class{classCount > 1 ? 'es' : ''} currently scheduled
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your entire timetable?')) {
                  onClearAll();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Entire Schedule</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
