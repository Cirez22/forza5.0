import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

type UserFormProps = {
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    suspended: boolean;
  } | null;
  onSubmit: (data: {
    email: string;
    password?: string;
    full_name: string;
    role: string;
    suspended: boolean;
  }) => Promise<void>;
  onCancel: () => void;
};

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel }) => {
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [role, setRole] = useState(user?.role || 'user');
  const [suspended, setSuspended] = useState(user?.suspended || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        email,
        ...(user ? {} : { password }), // Only include password for new users
        full_name: fullName,
        role,
        suspended,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Input
        id="email"
        name="email"
        type="email"
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={!!user}
      />

      {!user && (
        <Input
          id="password"
          name="password"
          type="password"
          label="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      )}

      <Input
        id="fullName"
        name="fullName"
        type="text"
        label="Nombre completo"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Rol</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-black focus:border-black rounded-md"
        >
          <option value="user">Usuario</option>
          <option value="empresa">Empresa</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Superadmin</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="suspended"
          checked={suspended}
          onChange={(e) => setSuspended(e.target.checked)}
          className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
        />
        <label htmlFor="suspended" className="text-sm font-medium text-gray-700">
          Cuenta suspendida
        </label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Guardando...' : user ? 'Actualizar' : 'Crear Usuario'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;