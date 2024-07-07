import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const bucket = new s3.Bucket(this, 'ImportBucket', {
      bucketName: 'import-products-store',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      cors: [
        {
            allowedOrigins: ['*'],
            allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.DELETE, s3.HttpMethods.HEAD],
            allowedHeaders: ['*'],            
        }
      ]
    });
    const accountId = cdk.Aws.ACCOUNT_ID;
    const region = cdk.Aws.REGION;
    const queueName = 'catalogItemsQueue';

    // Добавление политики ресурса для предоставления прав на выполнение операций в S3
    bucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:*'],
      resources: [`${bucket.bucketArn}/uploaded/*`, `${bucket.bucketArn}/parsed/*`],
      principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],      
    }));

    // Определение Lambda функции importProductsFile
    const importProductsFileLambda = new lambda.Function(this, 'importProductsFileLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'importProductsFile.handler',
      code: lambda.Code.fromAsset('lambda'),
      functionName: 'importProductsFile',
      environment: {
        BUCKET_NAME: bucket.bucketName,        
      },
    });

    // Определение Lambda функции importFileParser
    const importFileParserLambda = new lambda.Function(this, 'importFileParserLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'importFileParser.handler',
      code: lambda.Code.fromAsset('lambda'),
      functionName: 'importFileParser',
      environment: {
        BUCKET_NAME: bucket.bucketName,   
        CATALOG_ITEMS_QUEUE_URL: `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`
      },
    });
    // Разрешение Lambda отправлять сообщения в SQS очередь
    importFileParserLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['sqs:SendMessage'],
      resources: [`arn:aws:sqs:${region}:${accountId}:${queueName}`]
    }));

    // Настройка триггера S3 для Lambda функции
    bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(importFileParserLambda), {
      prefix: 'uploaded/',
    });
       
    // Предоставление прав на чтение и запись в S3 bucket для Lambda функций
    bucket.grantReadWrite(importProductsFileLambda);
    bucket.grantReadWrite(importFileParserLambda);
    bucket.grantDelete(importFileParserLambda);

    // Создание API Gateway
    const api = new apigateway.RestApi(this, 'ImportServiceApi', {
        restApiName: 'Import Service',
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS,    
          allowHeaders: ['Content-Type,X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
        },
    });

    // Интеграция Lambda функции с API Gateway
    const importProductsFileIntegration = new apigateway.LambdaIntegration(importProductsFileLambda);
    api.root.addResource('import').addMethod('GET', importProductsFileIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
      requestParameters: {
        'method.request.querystring.name': true,
      },
      requestValidatorOptions: {
        validateRequestParameters: true,
      }
    });
  }
}
