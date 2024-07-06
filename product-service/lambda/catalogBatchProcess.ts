import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { marshall } from '@aws-sdk/util-dynamodb';

const dynamodb = new DynamoDBClient({});
const sns = new SNSClient({});
const tableName = process.env.PRODUCTS_TABLE_NAME!;
const snsTopicArn = process.env.SNS_TOPIC_ARN!;

export const handler = async (event: any) => {
  for (const record of event.Records) {
    const payload = JSON.parse(record.body);
    const putItemCommand = new PutItemCommand({
      TableName: tableName,
      Item: marshall(payload)
    });
    await dynamodb.send(putItemCommand);

    const publishCommand = new PublishCommand({
      TopicArn: snsTopicArn,
      Message: JSON.stringify(payload),
      Subject: 'New Product Created'
    });
    await sns.send(publishCommand);
  }
  return {
    statusCode: 200,
    body: JSON.stringify('Batch Processed Successfully')
  };
};
