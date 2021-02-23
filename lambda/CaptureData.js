var AWS = require('aws-sdk');
var dynamoDB = new AWS.DynamoDB();
var moment = require('moment');

/**
 * Captures data from the agent and stires it in DynamoDB
 */
exports.handler = async(event, context, callback) =>
{
  try
  {
    console.log(JSON.stringify(event, null, '  '));

    if (!verifyOrigin(event.headers.origin))
    {
      callback(null, buildRejectedResponse(403, 'Invalid request origin'));
      return; 
    }

    if (!verifyAPIKey(event.requestContext.identity.apiKey))
    {
      callback(null, buildRejectedResponse(403, 'Invalid API key'));
      return;
    }

    var request = JSON.parse(event.body);
    await storeAgentData(request);

    callback(null, buildSuccessfulResponse({ status: "success" }));
  }
  catch (error)
  {
    console.log('[ERROR] failed to capture agent data', error);
    callback(null, buildErrorResponse(err)); 
  }
};

/**
 * Checks the agent's API key
 */
function verifyAPIKey(apiKey)
{
  if (apiKey === undefined || apiKey === '' || apiKey !== process.env.API_KEY)
  {
    return false;
  }
  return true;
}

/**
 * Checks the request origin
 */
function verifyOrigin(origin)
{
  if (origin === undefined || origin === '' || origin !== process.env.ORIGIN)
  {
    return false;
  }
  return true;
}

/**
 * Insert data into the agent data table
 */
async function storeAgentData(request)
{
  try
  {
    var params = {
      TableName: process.env.AGENT_DATA_TABLE,
      Item: {
        email: {
          S: request.email
        },
        captureDate: {
          S: moment().utc().format()
        }
      }
    };

    var keys = Object.keys(request);

    keys.forEach(key => {
      if (key !== 'email')
      {
        params.Item[key] = {
          S: request[key]
        };
      }
    });

    await dynamoDB.putItem(params).promise();
  }
  catch (error)
  {
    console.log('[ERROR] failed to store agent data in Dynamo', error);
    throw error;
  }
}

/**
 * Creates a successful APIGW response
 */
function buildSuccessfulResponse(data) 
{
  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };
  console.log('[INFO] made success response: ' + JSON.stringify(response, null, ' '));
  return response;
}

/**
 * Creates an errored APIGW response
 */
function buildErrorResponse(err) 
{
  const response = 
  {
    statusCode: 500,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        'Error': err
      }
    })
  };
  console.log('[ERROR] made error response: ' + JSON.stringify(response, null, ' '));
  return response;
}

/**
 * Creates an rejected APIGW response
 */
function buildRejectedResponse(code, message) 
{
  const response = 
  {
    statusCode: code,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        'message': message
      }
    })
  };
  console.log('[ERROR] made rejected response: ' + JSON.stringify(response, null, ' '));
  return response;
}
