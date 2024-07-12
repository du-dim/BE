import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Создание Lambda функции
    const basicAuthorizer = new lambda.Function(this, 'basicAuthorizer', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'basicAuthorizer.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: process.env as { [key: string]: string }, // Преобразование типов
    });

    // Экспорт функции для использования в других сервисах
    new cdk.CfnOutput(this, 'BasicAuthorizerArn', {
      value: basicAuthorizer.functionArn,
      exportName: 'BasicAuthorizerArn',
    });
  }
}
