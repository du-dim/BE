import { handler } from '../lambda/getProductsList';

test('getProductsList returns list of products', async () => {
  const event = {} as any;
  const result = await handler(event);
  expect(result.statusCode).toBe(200);
  const products = JSON.parse(result.body);
  expect(products).toHaveLength(9); // Assuming 2 mock products  
});
