/**
 * V3 SDK Service - Creates SDK clients
 */
import { createDfDownstreamAppClient } from '@diligencefabric/client-sdk';
import type { AuthenticationProvider } from '@microsoft/kiota-abstractions';
import { FetchRequestAdapter } from '@microsoft/kiota-http-fetchlibrary';
import config from "../config/default.json";

/**
 * Create unauthenticated V3 SDK client for public endpoints (login, etc.)
 * @returns SDK client without authentication
 */
export const createPublicClient = () => {
    const authenticationProvider: AuthenticationProvider = {
        authenticateRequest: async (request) => {
            request.headers.add("Content-Type", "application/json");
        },
    };

    const requestAdapter = new FetchRequestAdapter(authenticationProvider);
    requestAdapter.baseUrl = config.DF_API_URL;

    return createDfDownstreamAppClient(requestAdapter);
};

/**
 * Create authenticated V3 SDK client with token
 * @param token - JWT bearer token
 * @returns SDK client with authentication
 */
export const createAuthenticatedClient = (token: string) => {
    const authenticationProvider: AuthenticationProvider = {
        authenticateRequest: async (request) => {
            request.headers.add("Authorization", `Bearer ${token}`);
            request.headers.add("Content-Type", "application/json");
            request.headers.add("Cache-Control", "no-store, no-cache, must-revalidate");
        },
    };

    const requestAdapter = new FetchRequestAdapter(authenticationProvider);
    requestAdapter.baseUrl = config.DF_API_URL;

    return createDfDownstreamAppClient(requestAdapter);
};

/**
 * Get authenticated V3 SDK client using token from localStorage
 * @returns Authenticated SDK client or null if no token
 */
export const getDiligenceFabricSDK = () => {
    const userData: any = JSON.parse(localStorage.getItem("userData") || '{}');
    const token = userData?.token || localStorage.getItem('df_token');

    if (!token) {
        console.warn('[DFService] No auth token found in localStorage');
        return null;
    }

    return createAuthenticatedClient(token);
};