import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  Users,
  Share2,
  Plus,
  X,
  Mail
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { Client } from './types';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/common/Button';

const PROJECT_TYPES = [
  { value: 'house', label: 'Casa' },
  { value: 'land', label: 'Terreno' },
  { value: 'building', label: 'Edificio' },
  { value: 'apartment', label: 'Departamento' },
  { value: 'commercial', label: 'Comercial' },
  { value: 'other', label: 'Otro' },
] as const;

const MAX_PROJECT_VALUE = 9999999999.99; // Maximum value allowed by numeric(12,2)

interface NewClient {
  name: string;
  email: string;
}

const NewProject = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<string[]>([]);
  const [newWorker, setNewWorker] = useState('');
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClients, setNewClients] = useState<NewClient[]>([]);
  const [newClientForm, setNewClientForm] = useState<NewClient>({
    name: '',
    email: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_id: '',
    address: '',
    project_type: 'house' as typeof PROJECT_TYPES[number]['value'],
    value: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    shared_with: [] as string[],
  });

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('owner_id', user.id)
        .order('name');

      if (error) throw error;
      if (data) setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Add validation for the value field
    if (name === 'value') {
      const numValue = Number(value);
      if (numValue > MAX_PROJECT_VALUE) {
        setError(`El valor máximo permitido es ${MAX_PROJECT_VALUE.toLocaleString()}`);
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); // Clear error when input changes
  };

  const handleNewClientInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewClientForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClientForm.name.trim() && newClientForm.email.trim()) {
      setNewClients([...newClients, { ...newClientForm }]);
      setNewClientForm({ name: '', email: '' });
    }
  };

  const handleRemoveNewClient = (index: number) => {
    setNewClients(newClients.filter((_, i) => i !== index));
  };

  const handleAddWorker = () => {
    if (newWorker.trim() && !workers.includes(newWorker.trim())) {
      setWorkers([...workers, newWorker.trim()]);
      setNewWorker('');
    }
  };

  const handleRemoveWorker = (worker: string) => {
    setWorkers(workers.filter(w => w !== worker));
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, newNote.trim()]);
      setNewNote('');
    }
  };

  const handleRemoveNote = (note: string) => {
    setNotes(notes.filter(n => n !== note));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user) {
      setError('Debes iniciar sesión para crear un proyecto');
      setLoading(false);
      return;
    }

    try {
      // Parse and validate the project value
      const parsedValue = formData.value ? Number(formData.value) : 0;
      
      if (isNaN(parsedValue)) {
        throw new Error('El valor del proyecto debe ser un número válido');
      }

      if (parsedValue > MAX_PROJECT_VALUE) {
        throw new Error(`El valor máximo permitido es ${MAX_PROJECT_VALUE.toLocaleString()}`);
      }

      // First, create any new clients
      const createdClientIds: string[] = [];
      
      if (newClients.length > 0) {
        for (const newClient of newClients) {
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .insert([{
              ...newClient,
              owner_id: user.id
            }])
            .select()
            .single();

          if (clientError) throw clientError;
          if (clientData) {
            createdClientIds.push(clientData.id);
          }
        }
      }

      // Then create the project
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            client_id: formData.client_id || createdClientIds[0] || null,
            address: formData.address,
            project_type: formData.project_type,
            value: parsedValue,
            start_date: formData.start_date,
            end_date: formData.end_date,
            status: 'draft',
            owner_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        navigate('/dashboard/projects');
      }
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Error al crear el proyecto. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "mt-1 block w-full rounded-md border-2 border-black shadow-sm focus:border-black focus:ring-black sm:text-sm";
  const selectClasses = "mt-1 block w-full rounded-md border-2 border-black shadow-sm focus:border-black focus:ring-black sm:text-sm";

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Proyecto</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg divide-y divide-gray-200">
        {/* Basic Information */}
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Información Básica</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre del Proyecto
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>

            {/* Client Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
                  Cliente
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                  className="text-sm text-black hover:text-gray-700"
                >
                  {showNewClientForm ? 'Seleccionar cliente existente' : 'Agregar nuevo cliente'}
                </button>
              </div>

              {!showNewClientForm ? (
                <select
                  name="client_id"
                  id="client_id"
                  value={formData.client_id}
                  onChange={handleInputChange}
                  className={selectClasses}
                >
                  <option value="">Seleccionar cliente (opcional)</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="newClientName" className="block text-sm font-medium text-gray-700">
                          Nombre
                        </label>
                        <input
                          type="text"
                          id="newClientName"
                          name="name"
                          value={newClientForm.name}
                          onChange={handleNewClientInputChange}
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label htmlFor="newClientEmail" className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          id="newClientEmail"
                          name="email"
                          value={newClientForm.email}
                          onChange={handleNewClientInputChange}
                          className={inputClasses}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddClient}
                      variant="primary"
                      fullWidth
                    >
                      Agregar Cliente
                    </Button>
                  </div>

                  {/* List of new clients */}
                  {newClients.length > 0 && (
                    <div className="space-y-2">
                      {newClients.map((client, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                        >
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">{client.name}</span>
                            <span className="text-sm text-gray-500">({client.email})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveNewClient(index)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Dirección
              </label>
              <input
                type="text"
                name="address"
                id="address"
                required
                value={formData.address}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="project_type" className="block text-sm font-medium text-gray-700">
                Tipo de Proyecto
              </label>
              <select
                name="project_type"
                id="project_type"
                required
                value={formData.project_type}
                onChange={handleInputChange}
                className={selectClasses}
              >
                {PROJECT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                Presupuesto Estimado
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="value"
                  id="value"
                  required
                  min="0"
                  max={MAX_PROJECT_VALUE}
                  step="0.01"
                  value={formData.value}
                  onChange={handleInputChange}
                  className="pl-10 block w-full rounded-md border-2 border-black focus:border-black focus:ring-black sm:text-sm"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Valor máximo permitido: {MAX_PROJECT_VALUE.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Fechas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                Fecha de Inicio
              </label>
              <input
                type="date"
                name="start_date"
                id="start_date"
                required
                value={formData.start_date}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                Fecha Límite
              </label>
              <input
                type="date"
                name="end_date"
                id="end_date"
                required
                value={formData.end_date}
                onChange={handleInputChange}
                min={formData.start_date}
                className={inputClasses}
              />
            </div>
          </div>
        </div>

        {/* Workers */}
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Trabajadores</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newWorker}
                onChange={(e) => setNewWorker(e.target.value)}
                placeholder="Nombre del trabajador"
                className={inputClasses}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddWorker())}
              />
              <Button
                type="button"
                onClick={handleAddWorker}
                variant="primary"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {workers.map((worker, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"
                >
                  <span className="text-sm">{worker}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveWorker(worker)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Notas</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Agregar una nota"
                className={inputClasses}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNote())}
              />
              <Button
                type="button"
                onClick={handleAddNote}
                variant="primary"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-2">
              {notes.map((note, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                >
                  <span className="text-sm">{note}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveNote(note)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-6">
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}

        <div className="p-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard/projects')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear Proyecto'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewProject;