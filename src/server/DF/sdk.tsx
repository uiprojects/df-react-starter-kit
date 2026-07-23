/**
 * V3 SDK utilities for DFClientSdk
 * V3 requires bearer token authentication via RequestAdapter
 */
import { createDfDownstreamAppClient } from '@diligencefabric/client-sdk';
import type { AuthenticationProvider } from '@microsoft/kiota-abstractions';
import { FetchRequestAdapter } from '@microsoft/kiota-http-fetchlibrary';
import config from '../../config/default.json';

/**
 * Create an authenticated V3 SDK client with bearer token
 * @param token - JWT bearer token from login response
 * @returns Configured SDK client instance
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
 * Simple logger utility (V3 SDK doesn't have built-in logger)
 */
export const logger = {
    log: (level: string, context: string, message: string) => {
        console.log(`[${level}] [${context}] ${message}`);
    },
    error: (context: string, message: string, error?: any) => {
        console.error(`[ERROR] [${context}] ${message}`, error);
    },
    info: (context: string, message: string) => {
        console.info(`[INFO] [${context}] ${message}`);
    }
};