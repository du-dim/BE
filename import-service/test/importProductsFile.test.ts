import { handler } from '../lambda/importProductsFile';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

const mockedS3Client = S3Client as jest.MockedClass<typeof S3Client>;
const mockedGetSignedUrl = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;

describe('importProductsFile Lambda', () => {
  beforeEach(() => {
    mockedS3Client.mockClear();
    mockedGetSignedUrl.mockClear();
  });

  it('should return a signed URL', async () => {
    const signedUrl = '"https://import-products-store.s3.eu-west-1.amazonaws.com/uploaded/products.csv?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIA2UC265OZAFDSBTEQ%2F20240707%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Date=20240707T214147Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjED4aCWV1LXdlc3QtMSJIMEYCIQDnJy3gbXZ%2BUdBMg3WSvNTDBkcTgr7ZzNmcipPCquKdggIhALHjJJXWeDwSQVLiPxjoRqHFOqKmCKzcxO7cHJEjph69KoEDCPf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNzMwMzM1MjEwNDE4IgxNgnO3QnYUq2NY4LUq1QK8HsgT1BcaV0eQrWHRIyIfAGAkkdfNHNRvt1DE9tcp06tI9gvhyAX8Yzf76kRMkw5%2BRLWC5jjbOrGM3uFaKxjheFOeeHiH0R8fkUArxWS73lNlrZlDkJ1UhacTwGfmrS%2FQFLsYFKXTxuhfMZb5AO9HwBqHRuWXu4hVQ5igE0GY2i2TR5aTR%2F9BCWD5b5svNDmGqWyCfW11cO1wG%2BLMqVByFvlapJLrcBf5lqedEHUn8IO4EIbO%2FO%2FCs8%2Ba9KQIl%2Fs7KzPVfiEVESYeXm0rnWqLI2AwfMh%2FFiuA8RaNR1g9mJ2FS7mLzaWUsxbcTAhowno7467cpQeO7wCrq0rN0xEy8427V9CQr%2BR8PWEvO%2F2CRk%2BxQs8hEaY0VNf%2Fk4lJfyO6Mmt7ifVK6BnPDMF3G3SxBGF0cULTfHeWh6sm7wP05sEZC6EY1ljO8PqPKqllwOwMeiT9fDCal6y0BjqdAU2M%2Fe7Tv9g7%2FvAm%2FEJ0Jk%2BHHkKwXnzTLdukVnmOvjtc6D6a4ydlPlkwQ6JNJQ85bMVatHoc34FJq7LwqvQpzmtEJZ14waZsUTnVlwbag1%2FKEelTuJJO%2BbpUzyQvOQwIHp3uq%2FWOVUFLDXg%2Bj9Z8WSISByxte1WF6rNum1zDfUOJwQm65b5FcAW%2F7c%2FsHW%2BodeZHXr1nJ5s%2FTFIinHk%3D&X-Amz-Signature=7698984ad6389e0923613d94e478a5a014715bffb3a69e1274fe8123361c2d6f&X-Amz-SignedHeaders=host&x-id=PutObject"';
    mockedGetSignedUrl.mockResolvedValue(signedUrl);

    const event = {
      queryStringParameters: {
        name: 'test.csv',
      },
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event, {} as Context, () => null) as any;

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toBe(signedUrl);
    expect(mockedGetSignedUrl).toHaveBeenCalledWith(
      expect.any(S3Client),
      expect.any(PutObjectCommand),
      { expiresIn: 3600 }
    );
  });

  it('should return an error if name is missing', async () => {
    const event = {
      queryStringParameters: {},
    } as unknown as APIGatewayProxyEvent;

    const result = await handler(event, {} as Context, () => null) as any;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Missing name query parameter');
  });
});
