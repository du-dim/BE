import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult, Callback, Context } from 'aws-lambda';
import * as dotenv from 'dotenv';

dotenv.config();

const generatePolicy = (principalId: string, effect: "Allow" | "Deny", resource: string): APIGatewayAuthorizerResult => {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
};

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent,
  context: Context,
  callback: Callback<APIGatewayAuthorizerResult>
) => {
  if (!event.authorizationToken) {
    callback('Unauthorized'); // No token provided
    return;
  }

  const token = event.authorizationToken.split(' ')[1]; // Extract token from "Basic {token}"
  const decodedToken = Buffer.from(token, 'base64').toString('utf-8');
  const [username, password] = decodedToken.split(':');

  const envVariables: { [key: string]: string } = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value) {
      envVariables[key] = value;
    }
  }

  if (envVariables[username] === password) {
    callback(null, generatePolicy(username, 'Allow', event.methodArn));
  } else {
    callback('Unauthorized'); // Invalid credentials
  }
};
