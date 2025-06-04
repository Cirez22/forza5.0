import { Outlet } from 'react-router-dom';
import DashboardLayout from './layout';

const DashboardRoot = () => {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default DashboardRoot;