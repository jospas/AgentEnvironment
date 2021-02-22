# Amazon Connect Agent Environment

This project aims to provide a simple web interface to capture information about Amazon Connect Agents, including hardware and network configurations.

It deploys a single page web applcation that can be shared with Amazon Connect Agents to capture important environment information and saves this data to DynamoDB and to Amazon S3 as CSV and JSON for investigation and processing.

## Architecture

	TODO architecture diagram

## Building

To build locally you will require a Node.js and Serverless environment plus AWS credentials with sufficient permissions to deploy Lambda functions, create DynamoDB tables and S3 buckets and copy data to S3.

You will also need to verify that your Amazon S3 account settings allow objects to be public by Object ACL.

### Install dependencies

Install Node.js, Serverless and the required packages on a Mac:

  	> brew install npm
  	> npm install -g serverless
  	> npm install

### Deploy the infrastructure

You will require the following variables for this step:

	<stage> the desired environment eg: dev, test or prod
  	<profile> the name of a local AWS credentials profile
  	<region> the region you wish to deploy to
  	<apiKey> a long random string to use as a preshared secret
  	<s3Prefix> the prefix to use in the data bucket when exporting data  
  	<accountNumber> your AWS account number
  	<origin> your S3 site bucket origin

To deploy using Serverless (creates and deploys a CloudFormation stack) execute the following command replacing the variables from above:

	  > serverless deploy --stage <stage> \
	    --profile <profile> \
	    --region <region> \
	    --apiKey <apiKey> \    
	    --s3Prefix <s3Prefix> \
	    --origin 'https://<stage>-agent-environment-site-<region>-<accountNumber>.s3-<region>.amazonaws.com'

### Deploy the web application

You may then configure and deploy the static website to S3. Edit the file and enter your api end point:
  
  	web/config/site_config.json

Then deploy the web application to your site bucket:

    > cd web
    > s3 cp --profile <profile> \
	   --recursive \
	   --exclude '.DS_Store' \
	   --acl public-read \
	   . s3://<stage>-agent-environment-site-<region>-<accountNumber>

## Troubleshooting

## Cost

