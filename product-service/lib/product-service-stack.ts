import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';
import { join } from 'path';

export class ProductServiceStack extends cdk.Stack {
  public readonly productsTable: dynamodb.Table;
  public readonly stocksTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Создание SQS очереди
    const catalogItemsQueue = new sqs.Queue(this, 'catalogItemsQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
      queueName: 'catalogItemsQueue',
    });
    
    // Создание таблицы products
    const productsTable = new dynamodb.Table(this, 'ProductsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      tableName: 'Products',
      removalPolicy: cdk.RemovalPolicy.DESTROY // Указывает политику удаления
    });
    
    // Создание таблицы stocks
    const stocksTable = new dynamodb.Table(this, 'StocksTable', {
      partitionKey: { name: 'product_id', type: dynamodb.AttributeType.STRING },
      tableName: 'Stocks',
      removalPolicy: cdk.RemovalPolicy.DESTROY // Указывает политику удаления
    });

     // Создание Lambda функции для обработки пакетов
     const catalogBatchProcess = new lambda.Function(this, 'catalogBatchProcess', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'catalogBatchProcess.handler',
      code: lambda.Code.fromAsset(join(__dirname, '../lambda')),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        SNS_TOPIC_ARN: ''  // Позже будет заполнено
      }
    });
       
    // Lambda function for getProductsList
    const getProductsList = new lambda.Function(this, 'getProductsList', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'getProductsList.handler',
      code: lambda.Code.fromAsset(join(__dirname, '../lambda')),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCKS_TABLE_NAME: stocksTable.tableName,
      },
    });

    // Lambda function for getProductsById
    const getProductsById = new lambda.Function(this, 'getProductsById', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'getProductsById.handler',
      code: lambda.Code.fromAsset(join(__dirname, '../lambda')),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCKS_TABLE_NAME: stocksTable.tableName,
      },
    });
    
    // Lambda function for createProduct
    const createProduct = new lambda.Function(this, 'createProduct', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'createProduct.handler',
      code: lambda.Code.fromAsset(join(__dirname, '../lambda')),
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCKS_TABLE_NAME: stocksTable.tableName,
      },
    });

    // Предоставление прав на чтение данных из таблиц для Lambda функций
    productsTable.grantReadData(getProductsList);
    productsTable.grantReadData(getProductsById);    
    stocksTable.grantReadData(getProductsList);
    stocksTable.grantReadData(getProductsById);
    productsTable.grantWriteData(createProduct);
    stocksTable.grantWriteData(createProduct);
    catalogItemsQueue.grantConsumeMessages(catalogBatchProcess);

    // API Gateway
    const api = new apigateway.RestApi(this, 'productsApi', {
      restApiName: 'Products Service',
      description: 'This service serves products.',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,        
      },
    });    

    // /products endpoint
    const productsResource = api.root.addResource('products');    
    productsResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsList));
    productsResource.addMethod('POST', new apigateway.LambdaIntegration(createProduct));
    
    // /products/{productId} endpoint
    const productResource = productsResource.addResource('{productId}');
    productResource.addMethod('GET', new apigateway.LambdaIntegration(getProductsById));    
    
    // Добавление источника событий SQS к Lambda
    const eventSource = new lambdaEventSources.SqsEventSource(catalogItemsQueue, {
      batchSize: 5
    });
    catalogBatchProcess.addEventSource(eventSource);

    // Создание SNS темы
    const createProductTopic = new sns.Topic(this, 'createProductTopic', {
      topicName: 'ProductTopic'
    });

    // Подписка по Email на тему SNS
    createProductTopic.addSubscription(new subs.EmailSubscription('dzm.dubovik@gmail.com'));

    // Добавление политики для Lambda для публикации в SNS тему
    catalogBatchProcess.addToRolePolicy(new iam.PolicyStatement({
      actions: ['sns:Publish'],
      resources: [createProductTopic.topicArn]
    }));

    // Обновление переменной окружения для SNS_TOPIC_ARN
    catalogBatchProcess.addEnvironment('SNS_TOPIC_ARN', createProductTopic.topicArn);
  }  
}
