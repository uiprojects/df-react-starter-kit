import { DiligenceFabricClient } from '@ubti/diligence-fabric-sdk';

//import { DiligenceFabricClient } from '@ubti/diligence-fabric-sdk';

const client = new DiligenceFabricClient();
const logger = client.getDFLoggerService();

export { client, logger };