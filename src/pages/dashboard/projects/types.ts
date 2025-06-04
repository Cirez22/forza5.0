export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface ProgressLog {
  date: string;
  description: string;
  progress: number;
}

export interface ProjectFile {
  id: string;
  file_name: string;
  file_url: string;
  file_kind: 'image' | 'document' | 'other';
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  client_id: string | null;
  client?: {
    name: string;
    email: string;
  };
  address: string;
  project_type: string;
  value: number;
  start_date: string;
  end_date: string | null;
  status: 'draft' | 'finished' | 'in_progress' | 'paused';
  progress: number;
  progress_logs?: ProgressLog[];
  workers?: string[];
  notes?: string[];
  owner_id: string;
  created_at: string;
  files?: ProjectFile[];
}