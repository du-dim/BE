import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const productsTable = process.env.PRODUCTS_TABLE_NAME!;
const stocksTable = process.env.STOCKS_TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Request event:', event);  
  try {

    const productsScanCommand = new ScanCommand({
      TableName: productsTable
    });
    const productsResponse = await dynamodb.send(productsScanCommand)
    
    const products = productsResponse.Items || [];    
    console.log('Products:', products);

    // Добавление количества на складе для каждого продукта
    for (const product of products) {
      const stockQueryCommand = new QueryCommand({
        TableName: stocksTable,
        KeyConditionExpression: 'product_id = :productId',
        ExpressionAttributeValues: { ':productId': product.id }
      });
      const stockResponse = await dynamodb.send(stockQueryCommand)
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
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
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
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
      },
    };
  }
};
