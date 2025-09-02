import { create } from 'zustand';

export interface UploadItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed' | 'paused';
  progress: number;
  error?: string;
  masterKey?: string;
  assetId?: string;
  jobId?: string;
  playHref?: string;
  tusUpload?: { abort: () => void };
  stagingKey?: string;
}

interface UploadStore {
  uploads: UploadItem[];
  isUploading: boolean;
  addFiles: (files: File[]) => void;
  removeUpload: (id: string) => void;
  updateUpload: (id: string, updates: Partial<UploadItem>) => void;
  retryUpload: (id: string) => void;
  pauseUpload: (id: string) => void;
  resumeUpload: (id: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
}

export const useUploadStore = create<UploadStore>((set, get) => ({
  uploads: [],
  isUploading: false,

  addFiles: (files: File[]) => {
    const newUploads: UploadItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending',
      progress: 0,
    }));

    set((state) => ({
      uploads: [...state.uploads, ...newUploads],
    }));
  },

  removeUpload: (id: string) => {
    const { uploads } = get();
    const upload = uploads.find((u) => u.id === id);
    
    // Abort upload if it exists
    if (upload?.tusUpload) {
      upload.tusUpload.abort();
    }

    set((state) => ({
      uploads: state.uploads.filter((u) => u.id !== id),
    }));
  },

  updateUpload: (id: string, updates: Partial<UploadItem>) => {
    set((state) => ({
      uploads: state.uploads.map((upload) =>
        upload.id === id ? { ...upload, ...updates } : upload
      ),
    }));
  },

  retryUpload: (id: string) => {
    set((state) => ({
      uploads: state.uploads.map((upload) =>
        upload.id === id 
          ? { ...upload, status: 'pending', progress: 0, error: undefined, tusUpload: undefined }
          : upload
      ),
    }));
  },

  pauseUpload: (id: string) => {
    const { uploads } = get();
    const upload = uploads.find((u) => u.id === id);
    
    if (upload?.tusUpload) {
      upload.tusUpload.abort();
    }

    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.id === id ? { ...u, status: 'paused', tusUpload: undefined } : u
      ),
    }));
  },

  resumeUpload: (id: string) => {
    set((state) => ({
      uploads: state.uploads.map((upload) =>
        upload.id === id 
          ? { ...upload, status: 'pending', tusUpload: undefined }
          : upload
      ),
    }));
  },

  clearCompleted: () => {
    set((state) => ({
      uploads: state.uploads.filter((u) => u.status !== 'completed'),
    }));
  },

  clearAll: () => {
    const { uploads } = get();
    
    // Abort all active uploads
    uploads.forEach((upload) => {
      if (upload.tusUpload) {
        upload.tusUpload.abort();
      }
    });

    set({ uploads: [] });
  },
}));