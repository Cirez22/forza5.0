import React, { useEffect, useState } from 'react';
import { Plus, Search, UserPlus, Users, LogOut, Settings, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import UserForm from '../../components/admin/UserForm';
import GlobalDiscountModal from '../../components/admin/GlobalDiscountModal';
import Logo from '../../components/common/Logo';

type AdminUser = {
  id: string;
  full_name: string | null;
  role: string;
  suspended: boolean;
  created_at: string;
  email: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const fetchGlobalDiscount = async () => {
    try {
      const { data, error } = await supabase
        .from('global_discount')
        .select('percentage')
        .eq('active', true)
        .maybeSingle();

      if (error) throw error;
      setGlobalDiscount(data?.percentage ?? 0);
    } catch (err) {
      console.error('Error fetching global discount:', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('v_admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchGlobalDiscount();
  }, []);

  const handleAddUser = async (userData: any) => {
    try {
      if (selectedUser) {
        // Update user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: userData.full_name,
            role: userData.role,
            suspended: userData.suspended,
          })
          .eq('id', selectedUser.id);

        if (profileError) throw profileError;

        // Update user ban status in auth.users
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: JSON.stringify({
              id: selectedUser.id,
              banned: userData.suspended,
            }),
          }
        );

        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error || 'Error al actualizar el estado del usuario');
        }
      } else {
        // Create new user
        if (!userData.password || userData.password.length < 6) {
          throw new Error('Se requiere una contraseña de al menos 6 caracteres');
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              full_name: userData.full_name,
            },
          },
        });

        if (signUpError) throw signUpError;
        if (!data.user) throw new Error('No user data returned');

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: userData.full_name,
            role: userData.role,
            suspended: userData.suspended,
          })
          .eq('id', data.user.id);

        if (profileError) throw profileError;

        if (userData.suspended) {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              },
              body: JSON.stringify({
                id: data.user.id,
                banned: true,
              }),
            }
          );

          if (!res.ok) {
            const { error } = await res.json();
            throw new Error(error || 'Error al actualizar el estado del usuario');
          }
        }
      }

      setSelectedUser(null);
      setShowAddUser(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ id: userId }),
        }
      );

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Error al eliminar el usuario');
      }

      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Error inesperado al eliminar');
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter(u => !u.suspended).length,
    suspended: users.filter(u => u.suspended).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowDiscountModal(true)}
              >
                <Percent className="w-4 h-4 mr-2" />
                {globalDiscount > 0 ? `${globalDiscount}% OFF` : 'Configurar descuento'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Main Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <Button
            variant="primary"
            onClick={() => setShowAddUser(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Usuarios Suspendidos</p>
                <p className="text-2xl font-bold">{stats.suspended}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
          </div>
        )}

        {/* User List */}
        {!loading && !error && filteredUsers.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza agregando un nuevo usuario al sistema.
            </p>
          </div>
        )}

        {!loading && !error && filteredUsers.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último acceso
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.full_name || 'Sin nombre'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.suspended
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.suspended ? 'Suspendido' : 'Activo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleString()
                        : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                        className="mr-2"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add/Edit User Modal */}
        {(showAddUser || selectedUser) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">
                {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <UserForm
                user={selectedUser}
                onSubmit={handleAddUser}
                onCancel={() => {
                  setShowAddUser(false);
                  setSelectedUser(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Add GlobalDiscountModal */}
        {showDiscountModal && (
          <GlobalDiscountModal
            currentDiscount={globalDiscount}
            onClose={() => setShowDiscountModal(false)}
            onUpdate={fetchGlobalDiscount}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;