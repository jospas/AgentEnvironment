/**
  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License").
  You may not use this file except in compliance with the License.
  A copy of the License is located at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  or in the "license" file accompanying this file. This file is distributed 
  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either 
  express or implied. See the License for the specific language governing 
  permissions and limitations under the License.
*/

/** 
 * Router Declaration
 */
var router = null;

/**
 * Global site config object
 */
var siteConfig = null;

var navigationTemplate = null;
var stagesTemplate = null;

/**
 * Formats a date for display
 */
function formatDate(dateString) 
{
  var d = moment(dateString);
  return d.format('DD/MM/YYYY');
}

/**
 * Formats time for display
 */
function formatTime(dateString) 
{
  var d = moment(dateString);
  return d.format('h:mma');
}

/**
 * Formats a date time for display
 */
function formatDateTime(dateString) 
{
  var d = moment(dateString);
  return d.format('DD/MM/YYYY h:mma');
}

/**
 * Sleep for time millis
 */
function sleep (time) 
{
  return new Promise((resolve) => setTimeout(resolve, time));
}

/**
 * Handles dynamic routing from pages created post load
 */
function dynamicRoute(event)
{
  event.preventDefault();
  const pathName = event.target.hash;
  console.log('[INFO] navigating dynamically to: ' + pathName);
  router.navigateTo(pathName);
}

/**
 * Stores a string in session storage
 */
function store(key, value)
{
  window.sessionStorage.setItem(key, value);
}

/**
 * Stores an object as JSON in session storage
 */
function storeObject(key, object)
{
  store(key, JSON.stringify(object, null, '  '));
}

/**
 * Unstores a string in session storage
 */
function unstore(key)
{
  return window.sessionStorage.getItem(key); 
}

/**
 * Unstores an object from JSON in session storage
 */
function unstoreObject(key)
{
  if (!isStored(key))
  {
    console.log('[ERROR] failed to locate object in session store using key: ' + key);
    return null;
  }

  let value = unstore(key);
  return JSON.parse(value);
}

/**
 * Checks to see if something is stored
 */
function isStored(key)
{
  return window.sessionStorage.getItem(key) != null;
}

function clearStorage(key)
{
  window.sessionStorage.removeItem(key);
}

function clone(object)
{
  return JSON.parse(JSON.stringify(object));
}

/**
 * Fired once on page load, sets up the router
 * and navigates to current hash location
 */
window.addEventListener('load', async () =>
{

  /**
   * Make sure the app-body div is always the right height
   */
  function resizeBody()
  {
    var headerHeight = $('.navbar').height();
    var appBodyHeight = $(window).height() - headerHeight;
    $('.body-div').css({
        'height' : appBodyHeight + 'px'   
    });
  }

  $('document').ready(function(){
    resizeBody();
  });

  $(window).resize(function() {
    resizeBody();
  });

  /**
   * Set up the vanilla router
   */
  router = new Router({
    mode: 'hash',
    root: '/index.html',
    page404: function (path) 
    {
      console.log('[WARN] page not found: ' + path);
      window.location.hash = '#';
    }
  });

  Handlebars.registerHelper('ifeq', function (a, b, options) 
  {
    if (a == b) 
    {
      return options.fn(this); 
    }
    return options.inverse(this);
  });

  Handlebars.registerHelper('notempty', function (a, options) 
  {
    if (!Handlebars.Utils.isEmpty(a))
    {
      return options.fn(this);
    }
    return options.inverse(this);
  });

  Handlebars.registerHelper('empty', function (a, options) 
  {
    if (Handlebars.Utils.isEmpty(a))
    {
      return options.fn(this);
    }
    return options.inverse(this);
  });  

  Handlebars.registerHelper('switch', function(value, options) 
  {
    this.switch_value = value;
    this.switch_break = false;
    return options.fn(this);
  });

  Handlebars.registerHelper('case', function(value, options) 
  {
    if (value == this.switch_value) 
    {
      this.switch_break = true;
      return options.fn(this);
    }
  });

  Handlebars.registerHelper('default', function(options) 
  {
    if (this.switch_break == false) 
    {
      return options.fn(this);
    }
  });

  Handlebars.registerHelper('checked', function(currentValue) {
    return currentValue ? ' checked="checked"' : '';
  });

  Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
  });

  Handlebars.registerHelper('ifeq', function (a, b, options) {
    if (a == b) { return options.fn(this); }
    return options.inverse(this);
  });

  Handlebars.registerHelper('ifnoteq', function (a, b, options) {
    if (a != b) { return options.fn(this); }
    return options.inverse(this);
  });

  Handlebars.registerHelper('each_upto', function(ary, max, options) {
    if(!ary || ary.length == 0)
        return options.inverse(this);

    var result = [ ];
    for(var i = 0; i < max && i < ary.length; ++i)
        result.push(options.fn(ary[i]));
    return result.join('');
  });

  Handlebars.registerHelper('formatDate', function (a, options) 
  {
    return formatDate(a);
  });

  Handlebars.registerHelper('formatDateTime', function (a, options) 
  {
    return formatDateTime(a);
  });

  Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) 
  {
    switch (operator) {
      case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
      case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
      case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      case '&&':
          return (v1 && v2) ? options.fn(this) : options.inverse(this);
      case '||':
          return (v1 || v2) ? options.fn(this) : options.inverse(this);
      default:
          return options.inverse(this);
    }
  });

  Handlebars.registerHelper('select', function(selected, options) {
    return options.fn(this).replace(
        new RegExp(' value=\"' + selected + '\"'), '$& selected="selected"'
    );
  });

  Handlebars.registerHelper('checked', function(state) {
    if (state === 'true' || state === true)
    {
      return 'checked';
    }
    return '';
  });

  /**
   * Load site configuration and Handlebars templates 
   * and compile them after they are all loaded
   */
  $.when(
    $.get('config/site_config.json'),
    $.get('templates/navigation.hbs'),
    $.get('templates/stages.hbs'),
    $.get('templates/home.hbs')
  ).done(function(site, navigation, stages, home)
  {
    try
    {
      siteConfig = site[0]; 

      console.log('[INFO] loaded site configuration, current version: ' + siteConfig.version);

      navigationTemplate = Handlebars.compile(navigation[0]);
      stagesTemplate = Handlebars.compile(stages[0]);
      let homeTemplate = Handlebars.compile(home[0]);

      /**
       * Home
       */
      router.add('', async () => 
      {
        renderNavigation('#navHome');

        var stages = getStages();
        var results = await getResults();

        var html = homeTemplate({ 
          siteConfig: siteConfig,
          stages: stages,
          results: results
        });
        $('#bodyDiv').html(html);
      });
   
      /**
       * Make hash links work
       */
      router.addUriListener()

      /**
       * Load the current fragment
       */
      router.check();
    }
    catch (error)
    {
      console.log('[ERROR] encountered an issue building site', error)
      alert('Encountered an issue building site: ' + error.message);
    }
  });
});

function renderNavigation(page)
{
  $('#headerDiv').show();
  var html = navigationTemplate({ 
    page: page
  });
  $('#navItems').html(html);
  highlightNav(page);
}

function highlightNav(pageId)
{
  $('.active').removeClass('active');
  $(pageId).addClass('active');
}

function renderStages(page)
{
  var stages = getStages();

  var html = stagesTemplate({ 
    stages: stages
  });
  $('#stages').html(html);
}

async function getResults()
{
  if (!isStored('results'))
  {
    var results = {
      objects: {}
    };

    const params = new URLSearchParams(window.location.search);

    if (params.has('apiKey'))
    {
      results.apiKey = params.get('apiKey');
    }

    var parsedUA = bowser.getParser(window.navigator.userAgent);

    results.objects.browser = parsedUA.parsedResult.browser;
    results.objects.os = parsedUA.parsedResult.os;
    results.objects.platform = parsedUA.parsedResult.platform;
    results.objects.engine = parsedUA.parsedResult.engine;
    results.userAgent = window.navigator.userAgent;
    results.ip = await getPublicIP();
    results.objects.geoIP = await getGeoIPData(results.ip);

    storeObject('results', results);
  }

  return unstoreObject('results');
}

async function getPublicIP()
{
  try
  {
    var results = await axios.get('https://get.geojs.io/v1/ip.json');
    return results.data.ip;
  }
  catch (error)
  {
    return 'unknown';
  }
}

async function getGeoIPData(ipAddress)
{
  try
  {
    var results = await axios.get('https://get.geojs.io/v1/ip/geo/' + ipAddress + '.json');
    return results.data;
  }
  catch (error)
  {
    return 'Error: ' + error.message;
  }  
  
}

function getStages()
{
  if (!isStored('stages'))
  {
    var stages = {
      identity: {
        banner: true,
        current: true,
        complete: false,
        errored: false,
        next: 'location'
      },
      location: {
        banner: false,
        current: false,
        complete: false,
        errored: false,
        next: 'network'
      },
      network: {
        banner: false,
        current: false,
        complete: false,
        errored: false,
        next: 'computer'
      },
      computer: {
        banner: false,
        current: false,
        complete: false,
        errored: false,
        next: 'audio'
      },
      audio: {
        banner: false,
        current: false,
        complete: false,
        errored: false,
        next: 'submit'
      },
      submit: {
        banner: false,
        current: false,
        complete: false,
        errored: false,
        next: 'done'
      },
      done: {
        banner: false,
        current: false,
        complete: false,
        errored: false
      }
    };

    storeObject('stages', stages);
  }

  return unstoreObject('stages');
}

function saveStages(stages)
{
  storeObject('stages', stages);
}

function saveResults(results)
{
  storeObject('results', results);
}

/**
 * Sends results to the server
 */
async function sendResults(results)
{
  try
  {
    var options = {
      headers: {
        'x-api-key': results.apiKey
      }
    };

    var body = {};
    var keys = Object.keys(results);

    keys.forEach(key => {
      if (key !== 'objects' && key !== 'apiKey')
      {
        // Clean each field to remove anything that might trip up a CSV parser later
        body[key] = results[key].replace(/[\r\n\s",]+/g, ' ').trim();
      }
    });

    console.log('Sending data to the server: ' + JSON.stringify(body, null, 2));

    await axios.post(siteConfig.api + '/data', body, options);
  }
  catch (error)
  {
    console.log('Failed to send results', error);
    throw error;
  }
}

async function checkLogin(apiKey)
{
  try
  {
    var options = {
      headers: {
        'x-api-key': apiKey
      }
    };

    var response = await axios.get(siteConfig.api + '/login', options);
    return {
      success: true,
      uploadUrl: response.data.uploadUrl
    };
  }
  catch (error)
  {
    console.log('Failed to verify login', error);
    return {
      success: false
    };
  }
}

function pageError(currentStage)
{
  var stages = getStages();
  stages[currentStage].current = true;
  stages[currentStage].errored = true;
  stages[currentStage].success = false;
  saveStages(stages);

  renderStages();
}

function pageSuccess(currentStage)
{
  var stages = getStages();
  stages[currentStage].current = false;
  stages[currentStage].errored = false;
  stages[currentStage].complete = true;

  var nextPage = stages[currentStage].next;

  if (nextPage !== undefined)
  {
    stages[nextPage].current = true;
    stages[nextPage].errored = false;
    stages[nextPage].complete = false;
    saveStages(stages);
    renderStages();
    changePage();
  }
  else
  {
    saveStages(stages);
    renderStages();
  }
}

function changePage()
{
  $('.formPage').hide();

  var stages = getStages();
  var stageNames = Object.keys(stages);

  stageNames.forEach(stageName =>
  {
    var stage = stages[stageName];

    if (stage.current)
    {
      $('#' + stageName + 'Page').show();
      if (stage.banner)
      {
        $('#pageBanner').show();
      }
      else
      {
        $('#pageBanner').hide();
      }
    }
  });
}


function highlightStars(id, rating)
{
  for (var i = 1; i <= rating; i++)
  {
    var offId = '#' + id + 'Off' + i;
    var onId = '#' + id + 'On' + i;
    $(offId).hide();
    $(onId).show();
  }
}

function toolingCSAT(rating)
{
  $('.toolingCSATOn').hide();
  $('.toolingCSATOff').show();
  highlightStars('toolingCSAT', rating);
  $('#toolingCSAT').val(rating);
}

function connectCSAT(rating)
{
  $('.connectCSATOn').hide();
  $('.connectCSATOff').show();
  highlightStars('connectCSAT', rating);
  $('#connectCSAT').val(rating);
}

/**
 * Runs an internet speed test by uploading and downloading files
 */
async function runSpeedTest(e)
{
  try
  {
    var results = await getResults();
    console.log('Refetched signed upload url');

    results.loginResult = await checkLogin(results.apiKey);

    $('#downloadSpeed').attr('placeholder', 'Calculating download speed...');
    $('#downloadSpeed').val('');
    $('#uploadSpeed').attr('placeholder', 'Pending...');
    $('#uploadSpeed').val('');
    $('#latency').attr('placeholder', 'Pending...');
    $('#latency').val(''); 

    var size = 50;
    var seconds = await timeDownload(size);
    var megabits = size * 8;
    var megaBitsPerSec = megabits / seconds;

    $('#downloadSpeed').val(megaBitsPerSec.toFixed(2));
    $('#uploadSpeed').attr('placeholder', 'Calculating upload speed...');
    $('#uploadSpeed').val('');

    size = 10;
    seconds = await timeUpload(size, results.objects.loginResults.uploadUrl);
    megabits = size * 8;
    megaBitsPerSec = megabits / seconds;
    $('#uploadSpeed').val(megaBitsPerSec.toFixed(2));
    $('#latency').attr('placeholder', 'Calculating latency...');

    var latency = await timeLatency();
    $('#latency').val(latency);

    $('#networkNextButton').show();
  }
  catch (error)
  {
    console.log('[ERROR] Speed tests failed to run', error);
    pageError('network');
    renderStages();
    showMessageDialog('Speed tests failed', 'Speed tests failed to run, please check your network connectivity');
    return;
  }
}

async function timeDownload(size, iterations)
{
  var data = await axios.get('test_files/' + size + 'mb.test');
  var resources = performance.getEntriesByType('resource');
  var lastResource = resources[resources.length - 1];
  return (lastResource.responseEnd - lastResource.responseStart) / 1000;
}

/**
 * Upload a file to S3
 */
async function timeUpload(size, url)
{
  var payload = [];
  var bytes = size * 1024 * 1024;
  for (var i = 0; i < bytes; i++)
  {
    payload.push(0);
  }

  var options = {
    headers: {
      ContentType: 'text/plain'
    }
  };

  var actualUrl = url.substring(siteConfig.origin.length);
  var data = await axios.put(actualUrl, payload, options);
  var resources = performance.getEntriesByType('resource');
  var lastResource = resources[resources.length - 1];
  return (lastResource.responseStart - lastResource.requestStart) / 1000;
}

/**
 * Download a small image from S3 and time it using performance timers
 */
async function timeLatency()
{
  var data = await axios.get('img/1x1.png?t=' + Math.floor(Math.random() * 100000));
  var resources = performance.getEntriesByType('resource');
  var lastResource = resources[resources.length - 1];
  return Math.floor(lastResource.responseStart - lastResource.requestStart);
}  

function showMessageDialog(title, message, type = 'warning')
{
  $('#dialogTitle').html(title);
  $('#dialogMessage').html(message);
  $('#messageDialog').modal();

  if (type === 'success')
  {
    $('#dialogIcon').html('<i class="fas fa-check-circle text-success fa-3x"></i>');
  }
  else if (type === 'info')
  {
    $('#dialogIcon').html('<i class="fas fa-info-circle text-success fa-3x"></i>');
  }
  else if (type === 'warning')
  {
    $('#dialogIcon').html('<i class="fas fa-exclamation-triangle text-warning fa-3x"></i>');
  }
}

