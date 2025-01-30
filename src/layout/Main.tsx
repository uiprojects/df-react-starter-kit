import React from 'react';
import { Outlet } from 'react-router-dom';
import { DiligenceFabricClient } from '@ubti/diligence-fabric-sdk';

import config from '../config/default.json'

const dfClient = new DiligenceFabricClient(config);
console.log(dfClient);

const Main: React.FC = () => {
  return (
    <div>
      <Outlet />
      <footer className='flex justify-center'>© {new Date().getFullYear()} UB Technology Innovations, Inc.</footer>
    </div>
  );
}

export default Main;