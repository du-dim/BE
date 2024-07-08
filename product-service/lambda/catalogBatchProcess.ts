import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const sns = new SNSClient({});

const snsTopicArn = process.env.SNS_TOPIC_ARN!;
const productsTable = process.env.PRODUCTS_TABLE_NAME!;
const stocksTable = process.env.STOCKS_TABLE_NAME!;

export const handler = async (event: any) => {  
  
  for (const record of event.Records) {
    const payload = JSON.parse(record.body);    
    if (!payload.title || !payload.price || [undefined, null, NaN].includes(payload.count) || payload.count <= 0)  {
      console.error('Title, price, and count are required', payload);       
    }
    if (!payload.id) {
      payload.id = randomUUID();
    }
   
    const product = {
      id: payload.id,
      title: payload.title,
      description: payload.description,
      price: payload.price
    };
    const stock = {
      product_id: product.id,
      count: payload.count
    };

    const paramsProduct = {
      TableName: productsTable,
      Item: product,
    };
    const paramsStock = {
      TableName: stocksTable,
      Item: stock,
    };

    const productPutCommand = new PutCommand(paramsProduct);
    const stockPutCommand = new PutCommand(paramsStock);
    
    try {
      await dynamodb.send(productPutCommand);
      await dynamodb.send(stockPutCommand);

      const publishCommand = new PublishCommand({
        TopicArn: snsTopicArn,
        Message: JSON.stringify(payload),
        Subject: 'New Product Created'
      });
      console.log('Publishing to SNS:', JSON.stringify(payload));
      await sns.send(publishCommand);

    } catch (error) {
      console.error(`Error processing record with id ${payload.id}:`, error);      
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify('Batch Processed Successfully'),
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      "Access-Control-Allow-Methods": "POST",
    },
  };
};
