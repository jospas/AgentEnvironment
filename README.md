# Amazon Connect Agent Environment

Thsi project aims to provide a simple web interface to capture information about Amazon Connect Agents, including hardware and network configurations.

## Architecture

## Building

To build locally you will require a function Node.js and Serverless environment plus AWS credentials with sufficient permissions to deploy Lambda functions, create DynamoDB tables and S3 buckets and copy data to S3.

You will also need to verify that your Amazon S3 account settings allow objects to be public by Object ACL.

### Install dependencies

Install node.js, serverless and the required node packages:

  > brew install npm
  > npm install -g serverless
  > npm install

### Deploy to your AWS account

Required variables:

  - <stage> the desired environment eg: dev, test or prod
  - <profile> the name of a local AWS credentials profile
  - <region> the region you wish to deploy to
  - <apiKey> a long random string to use as a preshared secret
  - <s3Prefix> the prefix to use in the data bucket when exporting data  
  - <accountNumber> your AWS account number
  - <origin> your S3 site bucket origin:
      https://<stage>-agent-environment-site-<region>-<accountNumber>.s3-<region>.amazonaws.com

Then deploy the page to your AWS account. Change the stage, profile and region to reflect your desired deployment environment.

Create a complex API key to share with your agents to log in with.

Set the valid origin to reflect your region and AWS account id

  > serverless deploy --stage <stage> \
    --profile <profile> \
    --region <region> \
    --apiKey <apiKey> \    
    --s3Prefix <s3Prefix> \
    --origin <origin>

You may then deploy the static website to S3:

  > s3 cp --profile connect --recursive --exclude ".DS_Store" --acl public-read . $s3Bucket

## Deploying

### Configure a deployment script

## Post deployment tasks

## Troubleshooting

## Cost

