
const allRegions = [
  {
    region: 'us-east-1', 
    name: 'Virginia',
    endPoint: 'https://rtc.connect-telecom.us-east-1.amazonaws.com/',
    nlbs: [ 'TurnNlb-d76454ac48d20c1e.elb.us-east-1.amazonaws.com' ]
  },
  {
    region: 'us-west-2', 
    name: 'Oregon',
    endPoint: 'https://rtc.connect-telecom.us-west-2.amazonaws.com/',
    nlbs: [ 
      'TurnNlb-8d79b4466d82ad0e.elb.us-west-2.amazonaws.com', 
      'TurnNlb-dbc4ebb71307fda2.elb.us-west-2.amazonaws.com'
    ]
  },
  {
    region: 'eu-central-1', 
    name: 'Frankfurt',
    endPoint: 'https://rtc.connect-telecom.eu-central-1.amazonaws.com/',
    nlbs: [ 'TurnNlb-ea5316ebe2759cbc.elb.eu-central-1.amazonaws.com' ]
  },
  {
    region: 'ap-southeast-2', 
    name: 'Sydney',
    endPoint: 'https://rtc.connect-telecom.ap-southeast-2.amazonaws.com/',
    nlbs: [ 'TurnNlb-93f2de0c97c4316b.elb.ap-southeast-2.amazonaws.com' ]
  },
  {
    region: 'ap-northeast-1', 
    name: 'Tokyo',
    endPoint: 'https://rtc.connect-telecom.ap-northeast-1.amazonaws.com/',
    nlbs: [ 'TurnNlb-3c6ddabcbeb821d8.elb.ap-northeast-1.amazonaws.com' ]
  },
  {
    region: 'ap-southeast-1', 
    name: 'Singapore',
    endPoint: 'https://rtc.cell-1.prod.ap-southeast-1.prod.connect.aws.a2z.com/',
    nlbs: [ 'TurnNlb-261982506d86d300.elb.ap-southeast-1.amazonaws.com' ]
  },
  {
    region: 'eu-west-2', 
    name: 'London',
    endPoint: 'https://rtc.cell-1.prod.eu-west-2.prod.connect.aws.a2z.com/',
    nlbs: [ 'TurnNlb-1dc64a459ead57ea.elb.eu-west-2.amazonaws.com' ]
  },
];

/**
 * Pings the next EC2 endpoint
 */
function pingNext(regions)
{
  if (regions.length === 0)
  {
    networkTestsComplete();
  }
  else
  {
    var region = regions.shift();
    var span = $('#testImageSpan');
    span.empty();

    var start = performance.now();
    var randomString = Math.floor(Math.random() * 0xffffffffffffffff).toString(36);
    var targetUrl = region.endPoint + "ping?x=" + randomString;
    span.html("<img id='pingImage' style='display: none'>");
    var pingImage = $('#pingImage');
    var start = performance.now();
    pingImage.on('error', function() {
      regionResult(region, start, regions);
    });
    pingImage.attr("src", targetUrl);
  }
}

/**
 * Fired when the ping result returns
 */
function regionResult(region, startTime, regions)
{
  var endTime = performance.now();
  var totalTime = Math.floor(endTime - startTime);

  $('#latency-' + region.region).val(totalTime);

  $('#latency-' + region.region + '-success').show();
  $('#latency-' + region.region + '-pending').hide();
  $('#latency-' + region.region + '-text').html(totalTime + ' ms');

  if (totalTime <= 400)
  {
    $('#latency-' + region.region + '-success').removeClass('text-success');
    $('#latency-' + region.region + '-success').removeClass('text-warning');
    $('#latency-' + region.region + '-success').addClass('text-success');
  }
  else
  {
    $('#latency-' + region.region + '-success').removeClass('text-success');
    $('#latency-' + region.region + '-success').removeClass('text-warning');
    $('#latency-' + region.region + '-success').addClass('text-warning');
  }

  pingNext(regions);
}

/**
 * Resets all network UI elements
 */
function resetNetworkTests()
{
  for (var r = 0; r < allRegions.length; r++)
  {
    $('#latency-' + allRegions[r].region + '-success').hide();
    $('#latency-' + allRegions[r].region + '-pending').show();
    $('#latency-' + allRegions[r].region + '-text').html('Pending');

    $('#connectivity-' + allRegions[r].region + '-success').hide();
    $('#connectivity-' + allRegions[r].region + '-pending').show();
    $('#connectivity-' + allRegions[r].region + '-text').html('Pending');
  }
}

/**
 * Fiered when all neywork tests complete
 */
function networkTestsComplete()
{
  $('#networkTestButton').show();
  $('#networkNextButton').show();
}

/**
 * Kicks off latency tests
 */
function runLatencyTests()
{
  pingNext(JSON.parse(JSON.stringify(allRegions)));
} 

/**
 * Runs network tests
 */
async function runNetworkTests()
{
  $('#networkTestButton').hide();
  $('#networkNextButton').hide();
  $('#networkTestsRun').val('false');

  resetNetworkTests();
  await runUDPTests();
  runLatencyTests();

  $('#networkTestsRun').val('true');
}

//-------------------------------------
// UDP media tests
//-------------------------------------

async function runUDPTests()
{
  for (var r = 0; r < allRegions.length; r++)
  {
    var region = allRegions[r];
    await testTURNServer(region, region.nlbs);
  }
} 

/**
 * Checks to see if obj is invalid (null or undefined)
 */
function isInvalid(obj)
{
  if (obj === null || obj === undefined)
  {
    return true;
  }

  return false;
}

/**
 * Attempts to fetch a peer connection to the NLB throwing an error if null or undefined
 */
function getPeerConnection(nlbs)
{
  var peerConnectionFunc = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

  if (isInvalid(peerConnectionFunc))
  {
    console.log('[ERROR] failed to locate peer connection constructor function');
    throw new Error('Failed to locate RTCPeerConnection constructor function, check browser WEBRTC support');
  }

  var iceConfig = {
    urls: [],
    username: "test",
    credential: "test"
  };

  nlbs.forEach(nlb => {
    iceConfig.urls.push("turn:" + nlb + ":3478");
  });

  console.log('[INFO] testing: ' + JSON.stringify(iceConfig, null, 2));

  var peerConnection = new peerConnectionFunc({ iceServers: [iceConfig] });

  if (isInvalid(peerConnection))
  {
    console.log('[ERROR] failed to create peer connection');
    throw new Error('Failed to initialise RTCPeerConnection, check browser WEBRTC support');
  }

  return peerConnection;
}

/**
 * Times making an ofer until ice gathering is complete against an NLB end point
 * and will time out if this takes more than maxExecutionTime milliseconds
 */
function createOffer(peerConnection, region, maxExecutionTime)
{
  return new Promise(resolve => {

    var result = {
      region: region
    };

    // Listen for IPV4 errors
    peerConnection.addEventListener('icecandidateerror', (event) => {
      if (event.errorCode === 401)
      {
        result.success = true;
        result.endTime = performance.now();
        result.totalTime = Math.floor(result.endTime - result.startTime);
        resolve(result);
      }
    });

    // Create the offer then start ice negotiation with setLocalDescription()
    peerConnection.createOffer().then((sdp) => { 
      result.startTime = performance.now();
      return peerConnection.setLocalDescription(sdp);
    });

    setTimeout(() => {
      result.cause = 'TIMEOUT';
      result.success = false;
      resolve(result);
    }, maxExecutionTime);
  });
}

/**
 * Tests a TURN server by attempting ice negotiation with an NLB end point
 */
async function testTURNServer(region, nlbs) 
{
  try
  {
    // Create the peer connection to the stun server via the NLB
    var peerConnection = getPeerConnection(nlbs);

    // Create a dummy data channel
    peerConnection.createDataChannel(''); 

    var result = await createOffer(peerConnection, region, 1000);

    if (result.success)
    {
      $('#connectivity-' + region.region + '-pending').hide();
      $('#connectivity-' + region.region + '-success').show();
      $('#connectivity-' + region.region + '-text').html(result.totalTime + ' ms');

      $('#connectivity-' + region.region).val(result.totalTime);

      if (result.totalTime <= 300)
      {
        $('#connectivity-' + region.region + '-success').removeClass('text-success');
        $('#connectivity-' + region.region + '-success').removeClass('text-warning');
        $('#connectivity-' + region.region + '-success').addClass('text-success');
      }
      else
      {
        $('#connectivity-' + region.region + '-success').removeClass('text-success');
        $('#connectivity-' + region.region + '-success').removeClass('text-warning');
        $('#connectivity-' + region.region + '-success').addClass('text-warning');
      }
      console.log('[INFO] UDP tests completed to region: ' + region.region + ' in: ' + result.totalTime + '\n' + JSON.stringify(result, null, 2));
    }
    else
    {
      $('#connectivity-' + region.region).val(result.cause);

      $('#connectivity-' + region.region + '-pending').hide();
      $('#connectivity-' + region.region + '-error').show();
      $('#connectivity-' + region.region + '-text').html(result.cause);
      console.log('[WARNING] UDP tests failed to region: ' + region.region + ' cause: ' + result.cause);
    }
  }
  catch (error)
  {
    $('#connectivity-' + region.region).val('FAILED');

    $('#connectivity-' + region.region + '-pending').hide();
    $('#connectivity-' + region.region + '-error').show();
    $('#connectivity-' + region.region + '-text').html('FAILED');
    console.log('[ERROR] failed to test NLB in region: ' + region.region, error);
  }
}