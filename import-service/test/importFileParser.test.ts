import { handler } from '../lambda/importFileParser';
import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { S3Event, Context, Callback } from 'aws-lambda';
import * as csv from 'csv-parser';

jest.mock('@aws-sdk/client-s3');
jest.mock('csv-parser');

const mockedS3Client = S3Client as jest.MockedClass<typeof S3Client>;
const mockedCsvParser = csv as jest.MockedFunction<typeof csv>;

describe('importFileParser Lambda', () => {
  beforeEach(() => {
    mockedS3Client.mockClear();
    mockedCsvParser.mockClear();
  });

  const context: Context = {} as any;
  const callback: Callback<void> = () => {};

  it('should process and move the file correctly', async () => {
    const getObjectResponse = {
      Body: Readable.from(['title,description,price,count\nProduct-test 1,Description for Product-test 1,10,10\nProduct-test 2,Description for Product-test 2,20,2']),
    };

    mockedS3Client.prototype.send.mockImplementation((command) => {
      if (command instanceof GetObjectCommand) {
        return Promise.resolve(getObjectResponse);
      }
      return Promise.resolve({});
    });

    const mockStream = new Readable({ read() {} });
    process.nextTick(() => {
      mockStream.emit('data', { title: 'Product-test 1', description: 'Description for Product-test 1', price: 10, count: 10 });
      mockStream.emit('data', { title: 'Product-test 2', description: 'Description for Product-test 1', price: 20, count: 2 });
      mockStream.emit('end');
    });

    mockedCsvParser.mockImplementation(() => mockStream as any);

    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'import-products-store',
            },
            object: {
              key: 'uploaded/test.csv',
            },
          },
        },
      ],
    } as S3Event;

    await handler(event, context, callback);

    // Добавим задержку, чтобы убедиться, что все асинхронные операции завершены
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockedS3Client.prototype.send).toHaveBeenCalledTimes(3);
    expect(mockedS3Client.prototype.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
    expect(mockedS3Client.prototype.send).toHaveBeenCalledWith(expect.any(CopyObjectCommand));
    expect(mockedS3Client.prototype.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
  });

  it('should handle errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const errTest = new Error('Test error') as never;

    mockedS3Client.prototype.send.mockRejectedValue(errTest);

    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'import-products-store',
            },
            object: {
              key: 'uploaded/test.csv',
            },
          },
        },
      ],
    } as S3Event;

    await handler(event, context, callback);

    // Добавим задержку, чтобы убедиться, что все асинхронные операции завершены
    await new Promise((resolve) => setImmediate(resolve));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `Error processing uploaded/test.csv from import-products-store`,
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
