import { DiligenceFabricClient } from '@ubti/diligence-fabric-sdk';
import config from "../config/default.json";

export const getDiligenceFabricSDK = () => {
    const curentUserData: any = JSON.parse(localStorage.getItem("userData")  || '{}');

    const dfConfig = {
        "DF_APP_ID": config.DF_APP_ID,
        "DF_TENANT_ID": config.DF_TENANT_ID,
        "DF_API_URL": config.DF_API_URL,
        "DF_AppEnvironmentCODE": config.DF_AppEnvironmentCODE,
        "DF_API_VERSION": config.DF_API_VERSION
    };
    const client = new DiligenceFabricClient(dfConfig);
    client.setAuthUser(curentUserData);

    return client;
}