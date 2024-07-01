import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { APIGatewayProxyHandler } from 'aws-lambda';

const s3 = new S3Client({ region: 'eu-west-1' });

export const handler: APIGatewayProxyHandler = async (event) => {
    // Проверка наличия queryStringParameters и параметра name
    if (!event.queryStringParameters || !event.queryStringParameters.name) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing name query parameter' }),
        };
    }
    
    const { name } = event.queryStringParameters;

    const command = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `uploaded/${name}`,        
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    return {
        statusCode: 200,
        body: JSON.stringify({ signedUrl }),
    };
};
