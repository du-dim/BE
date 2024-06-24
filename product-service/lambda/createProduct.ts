import { v4 as uuidv4 } from 'uuid';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const productsTable = process.env.PRODUCTS_TABLE_NAME;
const stocksTable = process.env.STOCKS_TABLE_NAME;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Парсинг тела запроса
    const body = JSON.parse(event.body!);
    console.log('body:', body);

    if (!body.title || !body.price || body.count === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Title, price, and count are required" }),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'OPTIONS,GET,POST'
        },
      };
    }

    const product = {
      id: uuidv4(),
      title: body.title,
      description: body.description || '',
      price: body.price
    };

    const stock = {
      product_id: product.id,
      count: body.count
    };

    console.log(product, stock);

    const paramsProduct = {
      TableName: productsTable,
      Item: product
    };

    const paramsStock = {
      TableName: stocksTable,
      Item: stock
    };

    const productPutCommand = new PutCommand(paramsProduct);
    const stockPutCommand = new PutCommand(paramsStock);

    await dynamodb.send(productPutCommand);
    await dynamodb.send(stockPutCommand);

    const responseObject = { ...product, count: body.count };
    console.log(responseObject);
    return {
      statusCode: 201,
      body: JSON.stringify(responseObject),
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
