import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import Input from '../common/Input';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const flashMsg = location.state?.message || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      /* 1️⃣  Login contra auth.users */
      const {
        data: { session },
        error: signInError
      } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setLoading(false);
        setError(signInError.message);
        return;
      }

      if (!session) {
        setLoading(false);
        setError('Authentication failed');
        return;
      }

      /* 2️⃣  Traer el perfil vinculado */
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        // If no profile exists, create a default one
        if (profileError.message.includes('returned 0 rows')) {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                id: session.user.id,
                full_name: null,
                role: 'user'
              }
            ])
            .select()
            .single();

          if (createError) {
            setLoading(false);
            setError('Failed to create user profile');
            return;
          }

          /* 3️⃣  Guardar sesión + perfil en contexto global */
          setSession({ session, profile: newProfile });
          navigate('/dashboard');
          setLoading(false);
          return;
        }

        setLoading(false);
        setError('Error fetching user profile');
        return;
      }

      /* 3️⃣  Guardar sesión + perfil en contexto global */
      setSession({ session, profile });

      /* 4️⃣  Redirigir según el rol */
      if (profile.role === 'admin' || profile.role === 'superadmin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('An unexpected error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Welcome back</h2>
        <p className="text-gray-600 mt-2">Log in to your FORZA account</p>
      </div>

      {flashMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
          {flashMsg}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <Input
        id="email"
        name="email"
        type="email"
        label="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <div className="flex justify-end">
        <a href="/forgot-password" className="text-sm text-black hover:underline">
          Forgot password?
        </a>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={loading}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </div>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/register" className="text-black font-medium hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;