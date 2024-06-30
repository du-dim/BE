import { S3Handler } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import * as csv from 'csv-parser';

// Инициализация клиента S3 для взаимодействия с сервисом S3
const s3 = new S3();

// Определение обработчика Lambda функции
export const importFileParser: S3Handler = async (event) => {
    // Перебор всех записей в событии
    for (const record of event.Records) {
        const { bucket, object } = record.s3;
        const params = {
            Bucket: bucket.name,
            Key: object.key,
        };

        // Получение объекта из S3 и его парсинг
        const s3Stream = s3.getObject(params).createReadStream();
        s3Stream.pipe(csv())
            .on('data', (data) => console.log('Parsed record:', data))
            .on('end', () => console.log('Parsing completed.'));
    }
};
