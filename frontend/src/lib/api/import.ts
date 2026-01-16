import { apiClient } from './client';

export interface ImportResult {
  data: {
    success_count: number;
    failures: string[];
  };
}

export const importApi = {
  uploadCsv: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ImportResult>('import/csv', formData);
  },
};
