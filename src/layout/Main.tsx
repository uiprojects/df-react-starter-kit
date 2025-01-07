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
      <footer className='flex justify-center'>© 2024 Copyright: Unlimited Innovations Ind Pvt Ltd</footer>
    </div>
  );
}

export default Main;