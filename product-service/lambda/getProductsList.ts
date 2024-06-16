import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { products } from './products';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Request event:', event);  
  const response = {
    statusCode: 200,
    body: JSON.stringify(products),
  };
  console.log('Response:', response);
  return response;
};
