import React from 'react';
import { format } from 'date-fns';
import { Check, X } from 'lucide-react';
import { supabase } from '../../services/supabase';
import Button from '../common/Button';

type ProjectInvitation = {
  id: string;
  project_id: string;
  project: {
    name: string;
  } | null;
  invited_by: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
};

interface ProjectInvitationsProps {
  invitations: ProjectInvitation[];
  onUpdate: () => void;
}

const ProjectInvitations: React.FC<ProjectInvitationsProps> = ({
  invitations,
  onUpdate,
}) => {
  const handleResponse = async (invitationId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('project_invitations')
        .update({ status })
        .eq('id', invitationId);

      if (error) throw error;
      onUpdate();
    } catch (err) {
      console.error('Error updating invitation:', err);
    }
  };

  if (invitations.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium">Invitaciones Pendientes</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{invitation.project?.name ?? 'Proyecto Desconocido'}</p>
              <p className="text-sm text-gray-500">
                Recibido el {format(new Date(invitation.created_at), 'dd/MM/yyyy')}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResponse(invitation.id, 'accepted')}
                className="text-green-600 hover:text-green-700"
              >
                <Check className="w-4 h-4 mr-1" />
                Aceptar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResponse(invitation.id, 'rejected')}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4 mr-1" />
                Rechazar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectInvitations;