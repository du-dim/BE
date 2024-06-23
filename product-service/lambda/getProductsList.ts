import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
// import dynamodb from 'aws-sdk/clients/dynamodb';

// Настройка клиента DynamoDB
const dynamodb = new DynamoDB.DocumentClient();
const productsTable = process.env.PRODUCTS_TABLE_NAME!;
const stocksTable = process.env.STOCKS_TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Request event:', event);  
  try {
    const productsResponse = await dynamodb.scan({ TableName: productsTable }).promise();
    
    const products = productsResponse.Items || [];    

    // Добавление количества на складе для каждого продукта
    for (const product of products) {
      const stockResponse = await dynamodb.query({
          TableName: stocksTable,
          KeyConditionExpression: 'product_id = :productId',
          ExpressionAttributeValues: { ':productId': product.id }
      }).promise();

      if (stockResponse.Items && stockResponse.Items.length > 0) {
          product.count = stockResponse.Items[0].count;
      } else {
          product.count = 0;
      }
    }
    const response = {
      statusCode: 200,
      body: JSON.stringify(products),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
    console.log('Response:', response);
    return response;
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch products' }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  }
};
