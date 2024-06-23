import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import { APIGatewayProxyHandler } from 'aws-lambda';

const dynamoDB = new AWS.DynamoDB.DocumentClient();

export const createProduct: APIGatewayProxyHandler = async (event) => {
  // Парсинг тела запроса
  const body = JSON.parse(event.body!);

  const product = {
    id: uuidv4(),      
    title: body.title,
    description: body.description || '',
    price: body.price
  }
  
  const params = {
    TableName: 'Products',
    Item: product
  };

  try {
    await dynamoDB.put(params).promise();
    return { statusCode: 201, body: JSON.stringify(product) };
  } catch (error) {
    console.error('Failed to add product:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Failed to add product' }) };
  }
};
