import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Clock, CheckCircle2, Timer } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/common/Button';
import ProjectInvitations from '../../../components/projects/ProjectInvitations';
import type { Project } from './types';

const ProjectDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch projects where user is owner
      const { data: ownedProjects, error: ownedProjectsError } = await supabase
        .from('projects')
        .select(`
          *,
          members:project_members(user_id)
        `)
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (ownedProjectsError) throw ownedProjectsError;

      // Fetch projects where user is a member
      const { data: memberProjects, error: memberProjectsError } = await supabase
        .from('projects')
        .select(`
          *,
          members:project_members(user_id)
        `)
        .eq('members.user_id', user?.id)
        .order('created_at', { ascending: false });

      if (memberProjectsError) throw memberProjectsError;

      // Combine projects and remove duplicates
      const allProjects = [...(ownedProjects || []), ...(memberProjects || [])];
      const uniqueProjects = Array.from(new Map(allProjects.map(project => [project.id, project])).values());

      // Fetch pending invitations in a single query with project details
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('project_invitations')
        .select(`
          id,
          project_id,
          project:projects!project_invitations_project_id_fkey(
            id,
            name
          ),
          invited_by,
          status,
          created_at
        `)
        .eq('status', 'pending')
        .eq('invited_email', user?.email);

      if (invitationsError) throw invitationsError;

      setProjects(uniqueProjects);
      setInvitations(invitationsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finished':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Timer className="w-5 h-5 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Proyectos</h1>
        <Button
          variant="primary"
          onClick={() => navigate('/dashboard/projects/new')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {invitations.length > 0 && (
        <div className="mb-8">
          <ProjectInvitations
            invitations={invitations}
            onUpdate={fetchData}
          />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FolderKanban className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay proyectos</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza creando tu primer proyecto.
          </p>
          <div className="mt-6">
            <Button
              variant="primary"
              onClick={() => navigate('/dashboard/projects/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {project.name}
                  </h2>
                  {getStatusIcon(project.status)}
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {project.description || 'Sin descripción'}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-gray-100 rounded-full h-2 w-24">
                      <div
                        className="bg-black rounded-full h-2"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {project.progress}%
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                  >
                    Ver detalles
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectDashboard;