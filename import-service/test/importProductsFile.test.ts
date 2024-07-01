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
    const signedUrl = 'https://import-products-store.s3.eu-west-1.amazonaws.com/uploaded/products.csv?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIA2UC265OZJG3L7VF6%2F20240701%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Date=20240701T071853Z&X-Amz-Expires=60&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEKD%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCWV1LXdlc3QtMSJIMEYCIQDjsAKhWrYGxQGyRBa4%2By74KdGKicHOTfN04Fe5%2BYaWxgIhAOXqArXnNIBN5Iy0sEvdCd5ZC8Tpadccpnn8%2BIpQIoV3KtMDCFgQABoMNzMwMzM1MjEwNDE4IgxroubhR%2FZCHOin63gqsAMChYTfI5eY2njVBWUuQ%2BD2XsHBoDbT%2BwzV5dRgHskQr66e8UgaEklo%2FsKmuvYELToKJ2fZ4yS0FQ%2B%2FRBtaHCDYgHxMA3Pm7F7BdbIrKrYvzgNGS1G6KJpWYiNGHiQIbHSaST3pfXBk%2FeXmFNtV05cQCazRd3Ie97YrhulSFkqyJyvPMdMG%2Bh8Sw7arFlGZMhH%2FgCuIOoryPoZmjqG65%2BedGY7MmnJWSzZ1BPlTQNYvWoStTyW95x5C9JlIKN3suudptDhVDlPnGr%2FBDSw5zX0qsIkzrn73%2BeCrJn0zAhruSDlVp5KYYPvAzNIvr%2Bn0a%2FCqJOBe%2BKYEdipCqU65dyE%2F8ce32ve32SNp3SVUQD3krghGc2%2FiX95AS4AtSvhwqfV9DbvezCuFO2IUDR6R2rzISEbPrd9MvwRpY21azIreidowI07XKENIfYWApvTDBtlOj7o2m4L6aHw%2BdvLbH4C4ZL0UsFRVibgLJrm1EM1UFie3To%2BgdJAsaKlAiMV4e18ZAkyHB9jhdHYH98CFDhe2zUX%2FiqlTfPSXJ%2B%2F9pTIZhqumjad8QDsnFQZCu5OJBhow3LCJtAY6nQE%2Bv2ovS1dU0TW3R3TijJqNJ5%2F0sJkKre0kkiYghKKOyfFajfgg3e%2BKMJKFSbTLseL9eeWi%2BVmUzHxhBstWPB7xThh0zwUhuxATw%2BVvPPsRgrgDXhW1S%2Bmt%2FZs%2F66SuECa8A8uBGBvpvHdAK%2FurZZ1Xe8poVSHWt1H5QGmjZd0LHBz0Flz6ryL85ml%2Bqz8AGIqgF9jCCOX4hQKN8rB3&X-Amz-Signature=8165e1e3e98b5d198ea105c2917eaaf79cba6b62de1df59d1a1a632312baba31&X-Amz-SignedHeaders=host&x-id=PutObject';
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