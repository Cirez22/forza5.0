import React from 'react';
import { useLocation } from 'react-router-dom';
import Logo from '../components/common/Logo';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import Footer from '../components/layout/Footer';

const AuthPage: React.FC = () => {
  const location = useLocation();
  const isRegisterPage = location.pathname === '/register';
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 flex-grow">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          
          {isRegisterPage ? <RegisterForm /> : <LoginForm />}
        </div>
      </div>
      
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default AuthPage;