import React from 'react';
import { Outlet } from 'react-router-dom';

const Main: React.FC = () => {
  return (
    <div>
      <Outlet />
      <footer className='flex justify-center'>© {new Date().getFullYear()} UB Technology Innovations, Inc.</footer>
    </div>
  );
}

export default Main;