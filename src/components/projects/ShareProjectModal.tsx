import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../services/supabase';
import Button from '../common/Button';
import Input from '../common/Input';

interface ShareProjectModalProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  projectId,
  projectName,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: inviteError } = await supabase
        .from('project_invitations')
        .insert([
          {
            project_id: projectId,
            invited_email: email.trim(),
          },
        ]);

      if (inviteError) throw inviteError;
      
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error('Error sharing project:', err);
      setError('Error al enviar la invitación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Compartir Proyecto</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-4">
            <p className="text-green-600">¡Invitación enviada con éxito!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-sm text-gray-500 mb-4">
              Compartir "{projectName}" con otro usuario
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <Input
              id="email"
              name="email"
              type="email"
              label="Email del usuario"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar invitación'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ShareProjectModal;