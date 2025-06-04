import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import type { Project, Client } from './types';

const PROJECT_TYPES = [
  { value: 'house', label: 'Casa' },
  { value: 'land', label: 'Terreno' },
  { value: 'building', label: 'Edificio' },
  { value: 'apartment', label: 'Departamento' },
  { value: 'commercial', label: 'Comercial' },
  { value: 'other', label: 'Otro' },
] as const;

const EditProject = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_id: '',
    address: '',
    project_type: 'house' as typeof PROJECT_TYPES[number]['value'],
    value: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (user && id) {
      fetchProjectAndClients();
    }
  }, [user, id]);

  const fetchProjectAndClients = async () => {
    try {
      setLoading(true);
      
      // Fetch project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('owner_id', user?.id);

      if (clientsError) throw clientsError;

      setClients(clientsData);
      setFormData({
        name: project.name,
        description: project.description || '',
        client_id: project.client_id || '',
        address: project.address,
        project_type: project.project_type,
        value: project.value.toString(),
        start_date: project.start_date,
        end_date: project.end_date || '',
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          name: formData.name,
          description: formData.description,
          client_id: formData.client_id || null,
          address: formData.address,
          project_type: formData.project_type,
          value: parseFloat(formData.value),
          start_date: formData.start_date,
          end_date: formData.end_date || null,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      navigate(`/dashboard/projects/${id}`);
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Error al actualizar el proyecto');
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Proyecto</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg divide-y divide-gray-200">
        {error && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Input
              id="name"
              name="name"
              label="Nombre del Proyecto"
              value={formData.name}
              onChange={handleInputChange}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cliente
              </label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
              >
                <option value="">Sin cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              id="address"
              name="address"
              label="Dirección"
              value={formData.address}
              onChange={handleInputChange}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Proyecto
              </label>
              <select
                name="project_type"
                value={formData.project_type}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm"
                required
              >
                {PROJECT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              id="value"
              name="value"
              type="number"
              label="Valor"
              value={formData.value}
              onChange={handleInputChange}
              required
            />

            <Input
              id="start_date"
              name="start_date"
              type="date"
              label="Fecha de Inicio"
              value={formData.start_date}
              onChange={handleInputChange}
              required
            />

            <Input
              id="end_date"
              name="end_date"
              type="date"
              label="Fecha de Finalización"
              value={formData.end_date}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="p-6 flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/dashboard/projects/${id}`)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditProject;