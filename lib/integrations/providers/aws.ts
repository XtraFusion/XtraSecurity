import { 
    SecretsManagerClient, 
    PutSecretValueCommand, 
    CreateSecretCommand, 
    DescribeSecretCommand 
} from "@aws-sdk/client-secrets-manager";

export interface AWSSyncConfig {
    region: string;
    secretName?: string; // If null, use the key
    accessKeyId: string;
    secretAccessKey: string;
}

export async function syncToAWS(
    key: string,
    value: string,
    config: AWSSyncConfig
) {
    const client = new SecretsManagerClient({
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
        }
    });

    const secretId = config.secretName || key;

    try {
        // 1. Check if exists
        await client.send(new DescribeSecretCommand({ SecretId: secretId }));

        // 2. Update
        await client.send(new PutSecretValueCommand({
            SecretId: secretId,
            SecretString: value
        }));

    } catch (error: any) {
        if (error.name === "ResourceNotFoundException") {
            // 3. Create
            await client.send(new CreateSecretCommand({
                Name: secretId,
                SecretString: value
            }));
        } else {
            throw error;
        }
    }

    return { success: true, externalId: secretId };
}
