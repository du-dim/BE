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
      bucketName: 'import-products',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Добавление политики ресурса для предоставления прав на выполнение операций в S3
    bucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject'],
      resources: [`${bucket.bucketArn}/uploaded/*`],
      principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
    }));

    // Определение Lambda функции importProductsFile
    const importProductsFileLambda = new lambda.Function(this, 'importProductsFileLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'importProductsFile.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
          BUCKET_NAME: bucket.bucketName,
      },
    });

    // Определение Lambda функции importFileParser
    const importFileParserLambda = new lambda.Function(this, 'importFileParserLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'importFileParser.handler',
      code: lambda.Code.fromAsset('lambda'),
    });

    // Настройка триггера S3 для Lambda функции
    bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(importFileParserLambda), {
      prefix: 'uploaded/',
    });

    // Предоставление прав на чтение и запись в S3 bucket для Lambda функций
    bucket.grantReadWrite(importProductsFileLambda);
    bucket.grantRead(importFileParserLambda);

    // Создание API Gateway
    const api = new apigateway.RestApi(this, 'ImportServiceApi', {
        restApiName: 'Import Service',
    });

    // Интеграция Lambda функции с API Gateway
    const importProductsFileIntegration = new apigateway.LambdaIntegration(importProductsFileLambda);
    api.root.addResource('import').addMethod('GET', importProductsFileIntegration);
  }
}
