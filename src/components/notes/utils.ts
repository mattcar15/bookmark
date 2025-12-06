import { Note } from './types';
import { NOTES_STORAGE_KEY } from './constants';

// Helper to generate unique IDs
export const generateId = () => `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Load notes from localStorage
export const loadNotes = (): Note[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(NOTES_STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((note: Note) => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    }));
  } catch {
    return [];
  }
};

// Save notes to localStorage
export const saveNotes = (notes: Note[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
};

// Format date for display
export const formatDate = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

