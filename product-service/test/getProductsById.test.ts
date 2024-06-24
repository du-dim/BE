import { handler } from '../lambda/getProductsById';

test('getProductsById returns product when found', async () => {
  const event = { pathParameters: { productId: '1' } } as any;
  const result = await handler(event);
  expect(result.statusCode).toBe(200);
  const product = JSON.parse(result.body);
  expect(product.id).toBe('1');
});

test('getProductsById returns product when found', async () => {
  const event = { pathParameters: { productId: '2' } } as any;
  const result = await handler(event);
  expect(result.statusCode).toBe(200);
  const product = JSON.parse(result.body);
  expect(product.id).toBe('2');
});


test('getProductsById returns 404 when product not found', async () => {
  const event = { pathParameters: { productId: '999' } } as any;
  const result = await handler(event);
  expect(result.statusCode).toBe(404);
  const message = JSON.parse(result.body);
  expect(message.error).toBe('Product not found');
});
