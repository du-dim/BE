import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, ScanCommand, DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const productsTable = process.env.PRODUCTS_TABLE_NAME;
const stocksTable = process.env.STOCKS_TABLE_NAME;

if (!productsTable || !stocksTable) {
  throw new Error("Environment variables PRODUCTS_TABLE_NAME and STOCKS_TABLE_NAME must be defined");
}

interface IProduct {
  id: string;
  count?: number;
  [key: string]: any;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Request event:', event);  
  try {
    const productId = event.pathParameters!.productId!;
    const productsScanCommand = new GetCommand({
      TableName: productsTable,
      Key: { id: productId }
    });
    const productsResponse = await dynamodb.send(productsScanCommand);
    
    const product: IProduct = productsResponse.Item as IProduct;
    console.log('Products:', product);

    const stockQueryCommand = new QueryCommand({
      TableName: stocksTable,
      KeyConditionExpression: 'product_id = :productId',
      ExpressionAttributeValues: { ':productId': product.id }
    });
    const stockResponse = await dynamodb.send(stockQueryCommand);
    product.count = stockResponse.Items?.[0]?.count || 0;    

    const response = {
      statusCode: 200,
      body: JSON.stringify(product),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "GET",
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
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "GET",
      },
    };
  }
};
