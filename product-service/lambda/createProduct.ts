import { randomUUID } from 'crypto';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const productsTable = process.env.PRODUCTS_TABLE_NAME;
const stocksTable = process.env.STOCKS_TABLE_NAME;

if (!productsTable || !stocksTable) {
  throw new Error("Environment variables PRODUCTS_TABLE_NAME and STOCKS_TABLE_NAME must be defined");
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const body = JSON.parse(event.body!);  
  try {
    // Парсинг тела запроса    
    const body = JSON.parse(event.body!);
    console.log('body:', body);
    if (!body.title || !body.price || body.count === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Title, price, and count are required" }),
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
          "Access-Control-Allow-Methods": "POST",
        },
      };
    }

    const product = {
      id: body.id ? body.id : randomUUID(),
      title: body.title,
      description: body.description || '',
      price: body.price
    };

    const stock = {
      product_id: product.id,
      count: body.count
    };

    const paramsProduct = {
      TableName: productsTable,
      Item: product
    };

    const paramsStock = {
      TableName: stocksTable,
      Item: stock
    };

    const productResponce = {
      id: product.id,
      count: stock.count,
      price: product.price,
      title: product.price,
      description: product.description
    };

    const productPutCommand = new PutCommand(paramsProduct);
    const stockPutCommand = new PutCommand(paramsStock);

    await dynamodb.send(productPutCommand);
    await dynamodb.send(stockPutCommand);

    return {
      statusCode: 201,
      body: JSON.stringify(productResponce),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "POST",
      },
    };
  } catch (error) {
    console.error('Failed to add product:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to add product' }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "POST",
      },
    };
  }
};
