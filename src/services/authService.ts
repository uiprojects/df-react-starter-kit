/**
 * V3 Authentication Service
 * Handles login and auth-related API calls using DFClientSDK
 */
import Cookies from 'js-cookie';
import { logger } from '../server/DF/sdk';
import { createPublicClient } from './DFService';
import config from '../config/default.json';

/**
 * V3 Login Response interface
 */
interface LoginResponse {
  token: string;
  userId: number;
  tenantId: number;
  appId?: number;
  tenantCode: string;
  tenantName: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  roleCodes: string[];
  productCode: string;
  tenantAppRoleCode?: string;
  isEmailVerified: boolean;
  subscriptionId?: string;
  isMeterBillingEnabled: boolean;
  subscriptionStatus?: string;
}

/**
 * Get Authentication Types from Tenant
 * V3 SDK endpoint: client.api.v3.tenant.authenticationTypes.get()
 * Now returns MS Auth config fields: providerTenantIdConfig, clientOrAppIdConfig, etc.
 */
export const getAuthenticationTypes = async (tenantId?: number, authTypeCode?: string) => {
  try {
    console.log('[AuthService] getAuthenticationTypes called with:', { tenantId, authTypeCode });
    const client = createPublicClient();
    
    // V3 SDK: Get auth types for specific tenant (with optional filter by authTypeCode)
    let response;
    if (tenantId) {
      console.log('[AuthService] Fetching auth types for tenant:', tenantId);
      response = await client.api.v3.tenant.byId(tenantId).authenticationTypes.get({
        queryParameters: { authenticationTypeCode: authTypeCode }
      });
      console.log('response',response);
    } else {
      console.log('[AuthService] Fetching all auth types (no tenant specified)');
      // Fallback: Get all auth types (requires tenant ID in production)
      response = await client.api.v3.tenant.authenticationTypes.get();

    }
    
    console.log('[AuthService] Auth types response:', response);
    return { status: 'SUCCESS', data: response };
  } catch (error: any) {
    console.error('[AuthService] Error retrieving auth types:', error);
    logger.error('GetAuthTypes', 'Error retrieving auth types: ' + error.message, error);
    return { status: 'ERROR', message: error?.message || 'Failed to get auth types' };
  }
};

/**
 * Get Microsoft Authentication Configuration for a tenant
 * Fetches MS Auth config from DF backend
 * @param tenantId - Tenant ID
 * @returns MS Auth configuration or null
 */
export const getMsAuthConfig = async (tenantId: number) => {
  try {
    console.log('[AuthService] getMsAuthConfig called for tenant:', tenantId);
    const result = await getAuthenticationTypes(tenantId, 'MSAUTH');
    
    console.log('[AuthService] getAuthenticationTypes result:', result);
    
    if (result.status === 'SUCCESS' && result.data && result.data.length > 0) {
      const msAuth = result.data[0];
      
      // V3 SDK: Properties might be in additionalData or directly on object
      const clientId = (msAuth as any).clientOrAppIdConfig || (msAuth as any).additionalData?.clientOrAppIdConfig;
      const tenantId = (msAuth as any).providerTenantIdConfig || (msAuth as any).additionalData?.providerTenantIdConfig;
      const callbackPath = (msAuth as any).callbackPathConfig || (msAuth as any).additionalData?.callbackPathConfig;
      
      console.log('[AuthService] MS Auth config found:', {
        clientId,
        tenantId,
        callbackPath,
        rawData: msAuth
      });
      
      return {
        clientId,
        tenantId,
        callbackPath,
        // Note: clientSecretConfig should NOT be used in frontend (server-side only)
      };
    }
    
    console.warn('[AuthService] No MS Auth config found for tenant:', tenantId);
    return null;
  } catch (error: any) {
    console.error('[AuthService] getMsAuthConfig error:', error);
    logger.error('GetMsAuthConfig', 'Error: ' + error.message, error);
    return null;
  }
};

/**
 * Login with username/password or Microsoft token
 * Uses V3 Client SDK
 * @param authenticationRequest - Login credentials
 */
export const login = async (authenticationRequest: any) => {
  try {
    // Create public (unauthenticated) client for login endpoint
    const client = createPublicClient();
    
    // V3 SDK: client.api.v3.auth.login.post(requestBody)
    const rawResponse = await client.api.v3.auth.login.post(authenticationRequest) as unknown as any;
    
    console.log('[AuthService] Raw login response:', JSON.stringify(rawResponse, null, 2));

    // V3 SDK wraps the actual payload inside additionalData (same pattern as microsoftLogin)
    // Top-level email/productCode are echoed back from the request, but token/tenantId/etc live in additionalData
    const response: LoginResponse = {
      ...rawResponse.additionalData,
      email: rawResponse.email ?? rawResponse.additionalData?.email,
    };

    console.log('[AuthService] Unwrapped response.tenantId:', response.tenantId, typeof response.tenantId);
    console.log('[AuthService] config.DF_TENANT_ID:', config.DF_TENANT_ID, typeof config.DF_TENANT_ID);

    if (!response.token) {
      return {
        status: 'ERROR',
        message: 'Login failed: no token received.',
      };
    }

    // V3 response is nested inside additionalData - compare tenantId as strings
    if (config.DF_TENANT_ID === response.tenantId?.toString()) {
      if (authenticationRequest.rememberMe === 'on') {
        Cookies.set('df_ds_rem_user', authenticationRequest.username, { expires: 7 });
      }
      console.log('[AuthService] ✅ Login successful for user:', response.email, 'Tenant ID:', response.tenantId);

      // Normalize the response with app info, same as microsoftLogin, so
      // Home.tsx's fetchDataMenu has the appId/appEnvironmentCode it needs.
      const normalizedResponse = {
        ...response,
        app: { appId: parseInt(config.DF_APP_ID) },
        appEnvironmentCode: config.DF_AppEnvironmentCODE,
      };

      return { status: 'SUCCESS', response: normalizedResponse, message: 'Login Successful!' };
    } else {
      return {
        status: 'ERROR',
        message: `${authenticationRequest.username} is associated with a different Tenant/Application.`,
      };
    }
  } catch (error: any) {
    logger.error('Login', 'Login Response Error: ' + error.message, error);
    return { status: 'ERROR', message: error?.message || 'Login failed' };
  }
};

/**
 * Microsoft Login - Authenticates with MS and uses config values for appId/environment
 * @param microsoftAuthRequest - Microsoft auth request with idToken
 */
export const microsoftLogin = async (microsoftAuthRequest: any) => {
  try {
    console.log('[AuthService] microsoftLogin called with:', microsoftAuthRequest);
    const client = createPublicClient();
    
    // Step 1: Authenticate with Microsoft
    // V3 SDK: client.api.v3.auth.microsoftLogin.post()
    const response = await client.api.v3.auth.microsoftLogin.post(microsoftAuthRequest) as unknown as any;

    console.log('[AuthService] Microsoft Login Response:', response);
    
    // V3 SDK puts the actual response in additionalData
    const loginData = response.additionalData || response;
    
    // Check if we have a token (successful login)
    if (!loginData.token) {
      // No token - might be pending tenant selection
      console.warn('[AuthService] No token in response - tenant selection may be required');
      return { 
        status: 'PENDING_TENANT_SELECTION', 
        response: loginData, 
        message: 'Please select your tenant',
        tenants: loginData.tenantCandidates || []
      };
    }
    
    console.log('[AuthService] ✅ Authentication successful with token');
    
    // Step 2: Use appId and environmentCode from config
    const appId = parseInt(config.DF_APP_ID);
    const appEnvironmentCode = config.DF_AppEnvironmentCODE;
    
    console.log('[AuthService] Using appId from config:', appId);
    console.log('[AuthService] Using environmentCode from config:', appEnvironmentCode);
    
    if (!appId || !appEnvironmentCode) {
      console.error('[AuthService] Missing DF_APP_ID or DF_AppEnvironmentCODE in config');
      return {
        status: 'ERROR',
        message: 'Application configuration is incomplete. Please check config.',
      };
    }
    
    // Normalize the response structure with app info
    const normalizedResponse = {
      token: loginData.token,
      userId: loginData.userId,
      tenantId: loginData.tenantId,
      tenantCode: loginData.tenantCode,
      tenantName: loginData.tenantName,
      userName: loginData.userName,
      email: loginData.email,
      firstName: loginData.firstName,
      lastName: loginData.lastName,
      roleCodes: loginData.roleCodes || [],
      productCode: loginData.productCode,
      tenantAppRoleCode: loginData.tenantAppRoleCode,
      isEmailVerified: loginData.isEmailVerified,
      subscriptionId: loginData.subscriptionId,
      isMeterBillingEnabled: loginData.isMeterBillingEnabled,
      subscriptionStatus: loginData.subscriptionStatus,
      // Add app info from config
      app: {
        appId: appId,
      },
      appEnvironmentCode: appEnvironmentCode,
    };
    
    console.log('[AuthService] ✅ Normalized response with appId:', normalizedResponse.app.appId);
    
    // Check tenant ID if configured
    if (config.DF_TENANT_ID && normalizedResponse.tenantId && config.DF_TENANT_ID !== normalizedResponse.tenantId?.toString()) {
      return {
        status: 'ERROR',
        message: `Account is associated with a different Tenant/Application.`,
      };
    }
    
    return { status: 'SUCCESS', response: normalizedResponse, message: 'Microsoft Login Successful!' };
    
  } catch (error: any) {
    console.error('[AuthService] Microsoft login error:', error);
    logger.error('MicrosoftLogin', 'Error: ' + error.message, error);
    return { status: 'ERROR', message: error?.message || 'Microsoft login failed' };
  }
};