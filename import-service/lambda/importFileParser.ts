import { S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import * as csv from 'csv-parser';

// Инициализация клиента S3 для взаимодействия с сервисом S3
const s3 = new S3Client({ region: 'eu-west-1' });

// Определение обработчика Lambda функции
export const handler: S3Handler = async (event) => {
    // Перебор всех записей в событии
    for (const record of event.Records) {
        const { bucket, object } = record.s3;
        const params = {
            Bucket: bucket.name,
            Key: object.key,
        };
        try {
            // Получение объекта из S3
            const command = new GetObjectCommand(params);
            const { Body } = await s3.send(command);            
            // Преобразование Body в Readable stream
            const stream = Body as Readable;
            // Парсинг CSV
            stream.pipe(csv())
                .on('data', (data) => console.log('Parsed record:', data))
                .on('end', () => console.log('Parsing completed.'));
        } catch (error) {
            console.error(`Error processing ${object.key} from ${bucket.name}`, error);
        }
    }
};
