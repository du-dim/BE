import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
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
    const productCommand = new GetCommand(params);
    const productResponse = await dynamodb.send(productCommand);
    let response: APIGatewayProxyResult;
    if (productResponse.Item) {
      const product = productResponse.Item;
      // Получение количества на складе для данного продукта
      const paramsQuery = {
        TableName: stocksTable,
        KeyConditionExpression: 'product_id = :productId',
        ExpressionAttributeValues: { ':productId': productId }
      };
      const stockQueryCommand = new QueryCommand(paramsQuery);
      const stockResponse = await dynamodb.send(stockQueryCommand);
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
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
        },
      };
    } else {
      response = {
        statusCode: 404,
        body: JSON.stringify({ error: 'Product not found' }),       
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
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
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
      }, 
    };
  }
};
