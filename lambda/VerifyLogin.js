/**
 * Verifies the API key and origin for a customer
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

    callback(null, buildSuccessfulResponse({ status: 'success' }));

  }
  catch (error)
  {
    console.log('[ERROR] failed to verify API key', error);
    callback(null, buildErrorResponse(error)); 
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
 * Checks tthe request origin
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
 * Creates a success APIGW response
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
 * Creates an error APIGW response
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
  console.log('[ERROR] made error response: ' + JSON.stringify(response, null, ' '));
  return response;
}
