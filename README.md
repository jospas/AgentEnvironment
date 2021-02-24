# Amazon Connect Agent Environment

This project aims to provide a simple web interface to capture information about Amazon Connect Agents, including hardware and network configurations.

It deploys a single page web application that can be shared with Amazon Connect Agents to capture important environment information and saves this data to DynamoDB and to Amazon S3 as CSV and JSON for investigation and processing.

## Architecture

![Architecture diagram](docs/architecture.png)

The system uses Amazon S3 to serve a Singgle Page Web application to users. Users fill in survey fields and run speed tests against Amazon S3 in the deployed region.

Results are then submitted via API Gateway and stored in Amazon DynamoDB via a Lambda function.

Changes to the DynamoDB table trigger a DynamoDB Stream which calls a Lambda function to export all data to CSV into Amazon S3 for the administrator to collect.

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

### Create sample data files

The system uses test file in S3 to calculate network performance, create these locally on mac using:

	mkdir -p ./data/test_files/
	mkfile -n 1m ./data/test_files/1mb.test
	mkfile -n 5m ./data/test_files/5mb.test
	mkfile -n 10m ./data/test_files/10mb.test
	mkfile -n 20m ./data/test_files/20mb.test
	mkfile -n 30m ./data/test_files/30mb.test
	mkfile -n 40m ./data/test_files/40mb.test
	mkfile -n 50m ./data/test_files/50mb.test
	
Upload these to your site bucket with:

s3Bucket="s3://dev-agent-environment-site-ap-southeast-2-004050567325/test_files/"

	cd data/test_files/
	aws s3 sync \
		--profile <profile> \
	  	--exclude ".DS_Store" \
	  	--acl public-read . \
	  	s3://<stage>-agent-environment-site-<region>-<accountNumber>/test_files/
	  	
## User interface

Amazon Connect agents are provided a link to the user interface including an API key which is validated by Lambda.

The link has the following format:

	https://<stage>-agent-environment-site-<region>-<accountNumber>.s3.<region>.amazonaws.com/index.html?apiKey=<apiKey>

### Home
![Home](docs/home.png)

### Location
![Location](docs/location.png)

### Network
![Network](docs/network.png)

### Computer
![Computer](docs/computer.png)

### Audio
![Audio](docs/audio.png)

### Submit
![Submit](docs/submit.png)

## Sample data

The output CSV file has the following fields:

	captureDate
	email
	browserName
	browserVersion
	city
	computerModel
	country
	csatConnect
	csatSurvey
	dailyRestart
	deviceOwnership
	downloadSpeed
	headphonesConnection
	headphonesMakeModel
	internetCap
	internetConnection
	internetPlan
	internetProvider
	internetUserCount
	internetUserType
	ip
	latency
	location
	networkConnection
	operatingSystem
	returnDate
	uploadSpeed
	vpnConnection
	userAgent
	notes

## Cost

The system uses serverless technologies and should cost less than $2 USD per month to operate.
