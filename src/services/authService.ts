import Cookies from 'js-cookie';
import { client, logger } from '../server/DF/sdk';

export const login = async (authenticationRequest: any) => {
  try {
    const response = await client.getAuthService().login(authenticationRequest);
 
    if (process.env.REACT_APP_DF_TENANT_ID === response.Result.TenantID) {
      if (response.StatusCode === 200) {
        if (authenticationRequest.rememberMe === 'on') {
          Cookies.set('df_ds_rem_user', authenticationRequest.username, { expires: 7 });
        }
        return { status: 'SUCCESS', response, message: 'Login Successful!' };
      } else {
        return { status: 'ERROR', message: response.Result?.Status };
      }
    } else {
      return {
        status: 'ERROR',
        message: `${authenticationRequest.username} is associated with a different Tenant/Application.`,
      };
    }
  } catch (error: any) {
    logger.log('Error', 'Login', 'Login Response Error: ' + JSON.stringify(error));
    return { status: 'ERROR', message: error.body.Result?.ErrorMessage };
  }
};
 