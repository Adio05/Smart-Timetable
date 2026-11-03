import { ClassItem, UserProfile } from '../types/timetable';

const STORAGE_KEY_CLASSES = 'engra_classes_v1';
const LEGACY_STORAGE_KEY_CLASSES = 'chronos_offline_classes_v1';
const STORAGE_KEY_PROFILE = 'engra_profile_v1';
const LEGACY_STORAGE_KEY_PROFILE = 'chronos_offline_profile_v1';

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'guest_user',
  notificationsEnabled: true,
  notificationLeadMinutes: 10,
  activeSemester: 'Fall 2026',
  showWeekends: false,
  soundEnabled: true,
};

// Default sample classes for demonstration
export const SAMPLE_COMPUTER_SCIENCE_CLASSES: Omit<ClassItem, 'id' | 'userId'>[] = [
  {
    courseCode: 'CSC 301',
    courseTitle: 'Data Structures & Algorithms',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '11:00',
    location: 'Turing Hall 101',
    instructor: 'Prof. Evelyn Reed',
    color: '#6366f1',
    notes: 'Bring laptops. Chapter 4 Graph Algorithms.',
  },
  {
    courseCode: 'MAT 215',
    courseTitle: 'Discrete Mathematics',
    dayOfWeek: 'Monday',
    startTime: '11:30',
    endTime: '13:00',
    location: 'Math Block Room 3',
    instructor: 'Dr. Marcus Vance',
    color: '#0ea5e9',
    notes: 'Homework 3 due at the beginning of class.',
  },
  {
    courseCode: 'CSC 340',
    courseTitle: 'Computer Systems Architecture',
    dayOfWeek: 'Tuesday',
    startTime: '10:00',
    endTime: '12:00',
    location: 'Hardware Lab B',
    instructor: 'Dr. Sarah Chen',
    color: '#10b981',
    notes: 'ARM processor pipeline exercises.',
  },
  {
    courseCode: 'CSC 390',
    courseTitle: 'Web Engineering & Cloud Systems',
    dayOfWeek: 'Tuesday',
    startTime: '13:30',
    endTime: '15:30',
    location: 'Silicon Wing 204',
    instructor: 'Prof. Liam O\'Connor',
    color: '#a855f7',
    notes: 'Group project sprint 2 kickoff.',
  },
  {
    courseCode: 'CSC 301',
    courseTitle: 'Data Structures Lab',
    dayOfWeek: 'Wednesday',
    startTime: '09:00',
    endTime: '11:00',
    location: 'Computer Lab 4',
    instructor: 'TA Alex Rivera',
    color: '#6366f1',
    notes: 'Binary search tree profiling practical test.',
  },
  {
    courseCode: 'ENG 202',
    courseTitle: 'Technical Communications & Ethics',
    dayOfWeek: 'Wednesday',
    startTime: '12:00',
    endTime: '13:30',
    location: 'Humanities Hall 12',
    instructor: 'Dr. Diana Prince',
    color: '#f59e0b',
    notes: 'Ethics in AI case study presentation.',
  },
  {
    courseCode: 'CSC 340',
    courseTitle: 'Systems Architecture Recitation',
    dayOfWeek: 'Thursday',
    startTime: '10:00',
    endTime: '11:30',
    location: 'Hardware Lab B',
    instructor: 'Dr. Sarah Chen',
    color: '#10b981',
    notes: 'Cache coherence and branch prediction.',
  },
  {
    courseCode: 'MAT 215',
    courseTitle: 'Discrete Math Problem Session',
    dayOfWeek: 'Thursday',
    startTime: '14:00',
    endTime: '15:30',
    location: 'Math Block Room 3',
    instructor: 'Dr. Marcus Vance',
    color: '#0ea5e9',
    notes: 'Combinatorics and recurrence relations review.',
  },
  {
    courseCode: 'CSC 390',
    courseTitle: 'Cloud Deployment Workshop',
    dayOfWeek: 'Friday',
    startTime: '09:30',
    endTime: '11:30',
    location: 'Silicon Wing 204',
    instructor: 'Prof. Liam O\'Connor',
    color: '#a855f7',
    notes: 'Containerization and CI/CD pipelines.',
  },
  {
    courseCode: 'RES 399',
    courseTitle: 'Undergraduate Seminar & Guest Lecture',
    dayOfWeek: 'Friday',
    startTime: '13:00',
    endTime: '14:30',
    location: 'Main Auditorium',
    instructor: 'Distinguished Guest Speakers',
    color: '#f43f5e',
    notes: 'Industry leaders discussing next-gen distributed systems.',
  },
];

/**
 * Reads classes from localStorage cache
 */
export function getLocalClasses(): ClassItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLASSES) || localStorage.getItem(LEGACY_STORAGE_KEY_CLASSES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local classes:', e);
    return [];
  }
}

/**
 * Saves classes to localStorage cache
 */
export function saveLocalClasses(classes: ClassItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(classes));
  } catch (e) {
    console.error('Error saving local classes:', e);
  }
}

/**
 * Reads user profile from localStorage cache
 */
export function getLocalProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE) || localStorage.getItem(LEGACY_STORAGE_KEY_PROFILE);
    if (!raw) return DEFAULT_USER_PROFILE;
    return { ...DEFAULT_USER_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER_PROFILE;
  }
}

/**
 * Saves user profile to localStorage cache
 */
export function saveLocalProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving local profile:', e);
  }
}
