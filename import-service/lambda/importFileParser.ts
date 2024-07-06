import { S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand} from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Readable } from 'stream';
import * as csv from "csv-parser";

// Инициализация клиента S3 для взаимодействия с сервисом S3
const s3 = new S3Client({ region: 'eu-west-1' });
const sqs = new SQSClient({ region: 'eu-west-1' });
const queueUrl = process.env.CATALOG_ITEMS_QUEUE_URL!;

// Определение обработчика Lambda функции
export const handler: S3Handler = async (event) => {
    // Перебор всех записей в событии
    for (const record of event.Records) {
        const { bucket, object } = record.s3;
        const sourceKey = object.key;
        const parsedKey = sourceKey.replace('uploaded/', 'parsed/');
        const params = {
            Bucket: bucket.name,
            Key: sourceKey,
        };
        try {
            // Получение объекта из S3
            const getCommand = new GetObjectCommand(params);
            const copyCommand = new CopyObjectCommand({
                Bucket: bucket.name,
                CopySource: `${bucket.name}/${sourceKey}`,
                Key: parsedKey,
            });
          
            const deleteCommand = new DeleteObjectCommand(params);
        
            const { Body } = await s3.send(getCommand);            
            // Преобразование Body в Readable stream
            const stream = Body as Readable;
            // Парсинг CSV
            stream.pipe(csv())
                .on('data', async (data) => {
                    await sqs.send(new SendMessageCommand({
                        QueueUrl: queueUrl,
                        MessageBody: JSON.stringify(data)
                      }));
                })
                .on('end', () => console.log('Parsing completed.'));

            await s3.send(copyCommand);
            await s3.send(deleteCommand);
            console.log('CSV moved from "uploaded" to "parsed" directory and removed in "uploaded"');
                
        } catch (error) {
            console.error(`Error processing ${object.key} from ${bucket.name}`, error);
        }
    }
};
