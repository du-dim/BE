import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

const productsTable = process.env.PRODUCTS_TABLE_NAME!;
const stocksTable = process.env.STOCKS_TABLE_NAME!;

export const handler = async (event: any) => {
  const productId = event.pathParameters.productId;

  try {
    // Удаление продукта из таблицы Products
    const deleteProductCommand = new DeleteCommand({
      TableName: productsTable,
      Key: { id: productId },
    });

    // Удаление stock из таблицы Stocks
    const deleteStockCommand = new DeleteCommand({
      TableName: stocksTable,
      Key: { product_id: productId },
    });

    await Promise.all([
      dynamodb.send(deleteProductCommand),
      dynamodb.send(deleteStockCommand),
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Product and stock deleted successfully' }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "DELETE",
      },
    };
  } catch (error) {
    console.error(`Error deleting product with id ${productId}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to delete product and stock' }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "Access-Control-Allow-Methods": "DELETE",
      },
    };
  }
};
