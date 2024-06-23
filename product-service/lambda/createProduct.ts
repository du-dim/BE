import { v4 as uuidv4 } from 'uuid';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

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
  const productPutCommand = new PutCommand(params);

  try {
    await dynamodb.send(productPutCommand)
    return { 
      statusCode: 201, 
      body: JSON.stringify(product),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
      },
    };
  } catch (error) {
    console.error('Failed to add product:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Failed to add product' }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
      },
    };
  }
};
