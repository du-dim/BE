import { S3 } from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';

const s3 = new S3({ region: 'eu-west-1' });

export const importProductsFile: APIGatewayProxyHandler = async (event) => {
    // Проверка наличия queryStringParameters и параметра name
    if (!event.queryStringParameters || !event.queryStringParameters.name) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing name query parameter' }),
        };
    }
    const { name } = event.queryStringParameters;
    const signedUrl = s3.getSignedUrl('putObject', {
        Bucket: 'import-products',
        Key: `uploaded/${name}`,
        Expires: 60,
    });   

    return {
        statusCode: 200,
        body: JSON.stringify({ signedUrl }),
    };
};
