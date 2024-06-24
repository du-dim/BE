import { v4 as uuidv4 } from 'uuid';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const productsTable = 'Products';
const stocksTable = 'Stocks';

const products = [
    {
        id: uuidv4(),
        title: 'Product 3',
        description: 'Description for Product 1',
        price: 300
    },
    {
        id: uuidv4(),
        title: 'Product 4',
        description: 'Description for Product 2',
        price: 400
    }
];


const stocks = [
    {
        product_id: products[0].id,
        count: 10
    },
    {
        product_id: products[1].id,
        count: 20
    }
];
console.log(products, stocks)

const fillTables = async () => {
  for (const product of products) {
    const paramsProduct = {
      TableName: productsTable,
      Item: product
    }
    const paramsStocks = {
      TableName: stocksTable,
      Item: stocks.find((e) => e.product_id === product.id)
    }
    const productPutCommand = new PutCommand(paramsProduct);
    const stocksPutCommand = new PutCommand(paramsProduct);
    try {
      await dynamodb.send(productPutCommand);
      await dynamodb.send(stocksPutCommand);
    } catch (error) {
      console.error('Failed to add product:', error);
    }    
  }
}
fillTables()