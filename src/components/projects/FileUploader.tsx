import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';
import { supabase } from '../../services/supabase';
import Button from '../common/Button';

interface FileUploaderProps {
  projectId: string;
  onUploadComplete: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ projectId, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file types
    const invalidFiles = selectedFiles.filter(file => {
      const type = file.type.toLowerCase();
      return !type.match(/^(image\/(jpeg|png)|application\/pdf)$/);
    });

    if (invalidFiles.length > 0) {
      setError('Solo se permiten archivos JPG, PNG y PDF');
      return;
    }

    // Validate file sizes (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    const oversizedFiles = selectedFiles.filter(file => file.size > MAX_SIZE);

    if (oversizedFiles.length > 0) {
      setError('Los archivos no deben superar los 10MB');
      return;
    }

    setFiles(prev => [...prev, ...selectedFiles]);
    setError(null);
    
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    }
    return <FileText className="w-5 h-5 text-orange-500" />;
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (const file of files) {
        // Upload file to storage
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${projectId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('project-files')
          .getPublicUrl(filePath);

        // Save file reference in database
        const { error: dbError } = await supabase
          .from('project_files')
          .insert({
            project_id: projectId,
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            file_kind: file.type.startsWith('image/') ? 'image' : 'document'
          });

        if (dbError) throw dbError;
      }

      setFiles([]);
      onUploadComplete();
    } catch (err) {
      console.error('Error uploading files:', err);
      setError('Error al subir los archivos');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label
              htmlFor="file-upload"
              className="cursor-pointer rounded-md font-medium text-black hover:text-gray-600"
            >
              <span>Subir un archivo</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept=".jpg,.jpeg,.png,.pdf"
                multiple
                onChange={handleFileSelect}
                ref={fileInputRef}
              />
            </label>
            <p className="text-xs text-gray-500">
              Solo archivos JPG, PNG y PDF hasta 10MB
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div className="flex items-center space-x-3">
                {getFileIcon(file)}
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-sm text-gray-500">
                  ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? 'Subiendo...' : 'Subir archivos'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;