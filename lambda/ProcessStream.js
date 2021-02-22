var AWS = require('aws-sdk');
var dynamoDB = new AWS.DynamoDB();
var s3 = new AWS.S3();
var moment = require('moment');
var csvWriter = require('csv-writer').createObjectCsvStringifier;

/**
 * Listens for changes to teh DynamoDB table, scans all data from the table and writes it
 * as CSV and JSON into S3
 */
exports.handler = async(event, context, callback) => 
{
  try
  {
    console.log(JSON.stringify(event, null, '  '));
    var data = await loadDataFromDynamo();
    await exportDataToS3(data);

    callback(null, "Successfully processed records");
  }
  catch (error)
  {
    callback(error, "Failed to process stream message");
  }
};

/**
 * Scans all records form DynamoDB when a stream update occurs
 */
async function loadDataFromDynamo()
{
  try
  {
    var scanParams = {
      TableName: process.env.AGENT_DATA_TABLE
    };

    var records = [];

    var scanResponse = await dynamoDB.scan(scanParams).promise();
    extractRecords(records, scanResponse);      

    while (scanResponse.LastEvaluatedKey !== undefined)
    {
      scanParams.ExclusiveStartKey = results.LastEvaluatedKey;
      scanResponse = await dynamoDB.scan(scanParams).promise();
      extractRecords(records, scanResponse);      
    }

    return records;
  }
  catch (error)
  {
    console.log('[ERROR] failed to scan records from Dynamo', error);
    throw error;
  }
}

/**
 * Extracts records from a DynamoDB scan response
 */
function extractRecords(records, scanResponse)
{
  if (scanResponse.Items !== undefined)
  {
    scanResponse.Items.forEach(item => {
      records.push({
        email: item.email.S,
        captureDate: item.captureDate.S
      });
    });
  }
}

/**
 * Exports both a CSV data file and a JSON file of existing records to S3
 */
async function exportDataToS3(records)
{
  try
  {
    var allPathCSV = process.env.S3_PREFIX + '/agent_environment.csv';
    var datePathCSV = process.env.S3_PREFIX + '/' + moment().utc().format('YYYY/MM/DD') + '/agent_environment.csv';
    var allPathJSON = process.env.S3_PREFIX + '/agent_environment.json';
    var datePathJSON = process.env.S3_PREFIX + '/' + moment().utc().format('YYYY/MM/DD') + '/agent_environment.json';

    if (records !== undefined && records.length > 0)
    {
      var writer = csvWriter({
        alwaysQuote: true,
        header: 
        [
          {
            id: 'email', title: 'Email'
          },
          {
            id: 'captureDate', title: 'Capture date'
          }
        ]
      });

      var csv = writer.getHeaderString();
      csv += writer.stringifyRecords(records);
      await saveToS3(process.env.S3_BUCKET, allPathCSV, csv, 'text/csv');
      await saveToS3(process.env.S3_BUCKET, datePathCSV, csv, 'text/csv');

      var jsonObject = {
        agentData: records
      };
      var json = JSON.stringify(jsonObject, null, '  ');
      await saveToS3(process.env.S3_BUCKET, allPathJSON, json, 'application/json');
      await saveToS3(process.env.S3_BUCKET, datePathJSON, json, 'application/json');
    }
    else
    {
      console.log('[INFO] no records found, writing empty records');

      var csv = '';
      await saveToS3(process.env.S3_BUCKET, allPathCSV, csv, 'text/csv');
      await saveToS3(process.env.S3_BUCKET, datePathCSV, csv, 'text/csv');

      var jsonObject = {
        agentData: []
      };
      var json = JSON.stringify(jsonObject, null, '  ');
      await saveToS3(process.env.S3_BUCKET, allPathJSON, json, 'application/json');
      await saveToS3(process.env.S3_BUCKET, datePathJSON, json, 'application/json');
    }

  }
  catch (error)
  {
    console.log('[ERROR] failed to serialise records to CSV and write to S3', error);
    throw error;
  }
}

/**
 * Saves text data to S3
 */
async function saveToS3(bucket, key, data, contentType)
{
  try
  {
    var params = {
      Body: data,
      Bucket: bucket,
      Key: key,
      ContentType: contentType
    };

    await s3.putObject(params).promise();
  }
  catch (error)
  {
    console.log('[ERROR] failed to save data to S3', error);
    throw error;
  }
}