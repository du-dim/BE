import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { handler } from '../lambda/catalogBatchProcess';
import { randomUUID } from 'crypto';

const handlerFunction = handler as any;

jest.mock('@aws-sdk/lib-dynamodb', () => {
    return {
        DynamoDBDocumentClient: {
            from: jest.fn().mockImplementation((client: any) => ({
                send: jest.fn(),
            })),
        },
        PutCommand: jest.fn(),
    };
});

jest.mock('@aws-sdk/client-sns', () => {
    return {
        SNSClient: jest.fn().mockImplementation(() => ({
            send: jest.fn(),
        })),
        PublishCommand: jest.fn(),
    };
});

jest.mock('crypto', () => ({
    randomUUID: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('Lambda function tests', () => {
    let dbClientMock: jest.Mock;
    let snsClientMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        const dynamoClient = new DynamoDBClient({}) as DynamoDBClient & { send: jest.Mock };
        dbClientMock = (DynamoDBDocumentClient.from(dynamoClient) as any).send;
        snsClientMock = (new SNSClient() as any).send;
    });

    it('should create a product and send an SNS message', async () => {
        const event = {
            Records: [
                {
                    body: JSON.stringify({
                        title: 'Test Product',
                        description: 'This is a test product',
                        price: 100,
                        count: 10,
                    }),
                },
            ],
        };

        const context = {};
        const callback = jest.fn();

        dbClientMock.mockResolvedValue({});
        snsClientMock.mockResolvedValue({ MessageId: 'test-message-id' });

        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

        await handlerFunction(event, context, callback);

        expect(callback).not.toHaveBeenCalledWith(expect.any(Error));
        expect(consoleLogSpy).toHaveBeenCalledWith('Publishing to SNS:', expect.stringContaining('"title":"Test Product"'));
    });

    it('should log an error for missing required fields', async () => {
        const event = {
            Records: [
                {
                    body: JSON.stringify({
                        title: '',
                        description: '',
                        price: 0,
                        count: -1,
                    }),
                },
            ],
        };

        const context = {};
        const callback = jest.fn();

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        await handlerFunction(event, context, callback);

        expect(consoleErrorSpy).toHaveBeenCalledWith('Title, price, and count are required', expect.any(Object));
    });
});
