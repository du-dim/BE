import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

// Настройка клиента DynamoDB
const dynamodb = new DynamoDB.DocumentClient();
const productsTable = process.env.PRODUCTS_TABLE_NAME!;
const stocksTable = process.env.STOCKS_TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Request event:', event);  
  const productId = event.pathParameters?.productId;

  const params = {
    TableName: productsTable, 
    Key: {
      id: productId
    }
  };

  try {
    const productResponse = await dynamodb.get(params).promise();
    let response: APIGatewayProxyResult;
    if (productResponse.Item) {
      const product = productResponse.Item;
      // Получение количества на складе для данного продукта
      const stockResponse = await dynamodb.query({
        TableName: stocksTable,
        KeyConditionExpression: 'product_id = :productId',
        ExpressionAttributeValues: { ':productId': productId }
      }).promise();

      if (stockResponse.Items && stockResponse.Items.length > 0) {
          product.count = stockResponse.Items[0].count;
      } else {
          product.count = 0;
      }
      response = {
        statusCode: 200,
        body: JSON.stringify(product),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      };
    } else {
      response = {
        statusCode: 404,
        body: JSON.stringify({ error: 'Product not found' }),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      };
    }
    console.log('Response:', response);
    return response;
  } catch (error) {
    console.error('Error fetching product:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch product' }),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  }
};
