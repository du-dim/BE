import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { products } from './products';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Request event:', event);  
  const productId = event.pathParameters?.productId;
  const product = products.find(p => p.id === productId);
  let response: APIGatewayProxyResult;
  if (product) {
    response = {
      statusCode: 200,
      body: JSON.stringify(product),
    };
  } else {
    response = {
      statusCode: 404,
      body: JSON.stringify({ error: 'Product not found' }),
    };
  }
  console.log('Response:', response);
  return response;
};
