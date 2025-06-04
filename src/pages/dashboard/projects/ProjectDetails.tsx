import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Share2, 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign, 
  MapPin,
  BarChart3,
  FileText,
  Users,
  Upload,
  Image,
  File,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../../services/supabase';
import Button from '../../../components/common/Button';
import ShareProjectModal from '../../../components/projects/ShareProjectModal';
import ProgressUpdateModal from './ProgressUpdateModal';
import FileUploader from '../../../components/projects/FileUploader';
import type { Project, ProgressLog } from './types';

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      if (!id) return;

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients!projects_client_id_fkey(name, email),
          files:project_files(
            id,
            file_name,
            file_url,
            file_kind,
            created_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Error al cargar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project || !confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;
      navigate('/dashboard/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Error al eliminar el proyecto');
    }
  };

  const handleProgressUpdate = async (
    newProgress: number,
    newStatus: 'draft' | 'finished' | 'in_progress' | 'paused',
    progressLog: ProgressLog | null
  ) => {
    if (!project) return;

    try {
      const updates: any = {
        progress: newProgress,
        status: newStatus,
      };

      if (progressLog) {
        updates.progress_logs = [...(project.progress_logs || []), progressLog];
      }

      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', project.id);

      if (error) throw error;
      fetchProject();
    } catch (err) {
      console.error('Error updating progress:', err);
      setError('Error al actualizar el progreso');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;
      fetchProject();
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Error al eliminar el archivo');
    }
  };

  const getFileIcon = (fileKind: string) => {
    switch (fileKind) {
      case 'image':
        return <Image className="w-5 h-5 text-blue-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-orange-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error || 'Proyecto no encontrado'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowShareModal(true)}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartir
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/projects/${project.id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">Detalles del Proyecto</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Fecha de inicio</p>
                    <p className="font-medium">
                      {format(new Date(project.start_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                {project.end_date && (
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Fecha de finalización</p>
                      <p className="font-medium">
                        {format(new Date(project.end_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Valor</p>
                    <p className="font-medium">
                      ${project.value.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm text-gray-500">Dirección</p>
                    <p className="font-medium">{project.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Progreso</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowProgressModal(true)}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Actualizar Progreso
                </Button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-black rounded-full h-2"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="ml-4 font-medium">{project.progress}%</span>
                </div>
                {project.progress_logs && project.progress_logs.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Historial de Actualizaciones
                    </h3>
                    <div className="space-y-3">
                      {project.progress_logs.map((log, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-md p-3"
                        >
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">
                              Progreso: {log.progress}%
                            </span>
                            <span className="text-gray-500">
                              {format(new Date(log.date), 'dd/MM/yyyy HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {log.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <FileText className="w-5 h-5 text-gray-400 mr-2" />
                  <h2 className="text-lg font-medium">Descripción</h2>
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          {project.client && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <Users className="w-5 h-5 text-gray-400 mr-2" />
                  <h2 className="text-lg font-medium">Cliente</h2>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">{project.client.name}</p>
                  <p className="text-sm text-gray-500">{project.client.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Files */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Archivos</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadModal(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Subir
                </Button>
              </div>
              {project.files && project.files.length > 0 ? (
                <div className="space-y-2">
                  {project.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md group"
                    >
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center flex-1 min-w-0"
                      >
                        {getFileIcon(file.file_kind)}
                        <span className="ml-2 text-sm font-medium truncate">
                          {file.file_name}
                        </span>
                      </a>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="ml-2 text-gray-400 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay archivos adjuntos
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showShareModal && (
        <ShareProjectModal
          projectId={project.id}
          projectName={project.name}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showProgressModal && (
        <ProgressUpdateModal
          isOpen={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          currentProgress={project.progress}
          currentStatus={project.status}
          progressLogs={project.progress_logs || []}
          onUpdate={handleProgressUpdate}
        />
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Subir Archivos</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FileUploader
              projectId={project.id}
              onUploadComplete={() => {
                setShowUploadModal(false);
                fetchProject();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;