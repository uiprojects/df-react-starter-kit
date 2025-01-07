import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { DiligenceFabricClient } from '@ubti/diligence-fabric-sdk';
import { logger } from '../server/DF/sdk';
 
export const useAuth = () => {
  const [authTypeResult, setAuthTypeResult] = useState(null);
  const [userNameCookie, setUserNameCookie] = useState<string | null>(null);
 
  useEffect(() => {
    const loadAuthType = async () => {
      try {
        const client = new DiligenceFabricClient();
        const AuthenticationTypeList = {
          TenantID: undefined,
          AuthenticationTypeCode: 'MS',
          CalledBy: undefined,
        };
        const response: any = await client
          .getAuthenticationTypeService()
          .getAuthenticationType(AuthenticationTypeList);
 
        setAuthTypeResult(response?.Result);
      } catch (error) {
        logger.log('Error', 'Load', 'Error Retrieving auth type' + JSON.stringify(error));
      }
    };
 
    setUserNameCookie(Cookies.get('df_ds_rem_user') || null);
    loadAuthType();
  }, []);
 
  return { userNameCookie, authTypeResult };
};
 