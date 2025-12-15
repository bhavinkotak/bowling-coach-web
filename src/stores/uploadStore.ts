import { create } from 'zustand';
import type { VideoUpload } from '../types';

interface UploadStore {
  uploads: VideoUpload[];
  currentUpload: VideoUpload | null;
  addUpload: (upload: VideoUpload) => void;
  updateUpload: (id: string, updates: Partial<VideoUpload>) => void;
  removeUpload: (id: string) => void;
  setCurrentUpload: (upload: VideoUpload | null) => void;
  clearUploads: () => void;
}

export const useUploadStore = create<UploadStore>((set) => ({
  uploads: [],
  currentUpload: null,
  
  addUpload: (upload) =>
    set((state) => ({
      uploads: [...state.uploads, upload],
    })),
  
  updateUpload: (id, updates) =>
    set((state) => ({
      uploads: state.uploads.map((upload) =>
        upload.id === id ? { ...upload, ...updates } : upload
      ),
      currentUpload:
        state.currentUpload?.id === id
          ? { ...state.currentUpload, ...updates }
          : state.currentUpload,
    })),
  
  removeUpload: (id) =>
    set((state) => ({
      uploads: state.uploads.filter((upload) => upload.id !== id),
      currentUpload: state.currentUpload?.id === id ? null : state.currentUpload,
    })),
  
  setCurrentUpload: (upload) => set({ currentUpload: upload }),
  
  clearUploads: () => set({ uploads: [], currentUpload: null }),
}));
