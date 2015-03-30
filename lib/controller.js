var usb = require('./usb_connection')
  , lan = require('./lan_connection')
  , Tessel = require('./tessel/tessel')
  , async = require('async')
  , tessel = require('tessel')
  , Promise = require('bluebird')
  ;


/*
  Fetches Tessels and prints them out
    param callback: called upon completion in the form (err)
*/
function listTessels(options) {
  console.info('Scanning for connections...');
  return Promise.all([
          // Fetch usb connected Tessels
          usb.findConnections()
            .map(function(usb_connection){
              console.log('USB CONNECTION ', usb_connection.serialNumber);
              // Pass connections through for consistency
              return usb_connection;
            })
            .then(function(connections){
              // Start spinner since mdns scans take a while
              Tessel.spinner.start();
              // Pass connections through for consistency
              return connections;
            }),
          // Fetch all mdns tessel's
          lan.findConnections()
            .map(function(lan_connection){
              console.log('LAN CONNECTION ip: ', lan_connection.ip, ', host: ', lan_connection.auth.host, ', Authorized: ', lan_connection.authorized);
              // Pass connections through for consistency
              return lan_connection;
            })
            .then(function(connections){
              // Stop the spinner
              Tessel.spinner.stop();
              // Pass connections through for future use
              return connections;
            })
          ]);
}

/*
  Returns an instance of the requested Tessel.
  If TESSEL_SERIAL env variable is set, that Tessel is returned.
  If it is not set, the first USB listed Tessel is returned.
    param opts: an object that can contain the field of serial, eg. {serial: "SOME_SERIAL"}
    param callback: called upon completion in the form (err, tessel)
*/
function getTessel(opts, callback) {
  tessel.logs.info("Connecting to Tessel...");
  // Grab all attached Tessels
  return Promise.join(usb.findConnections,lan.findConnections)
    .then(function(stuff){
      if(!stuff.length){
        tessel.logs.info('No Tessel\'s found');
      }
      return stuff;
    })
    // Iterate through each and look for a match on the provided serial
    // number of the return the first Tessel if one wasn't provided
    .reduce(function(memo, connection){
      // if serial number matches connect
      if (!opts.serial || opts.serial === connection.serialNumber) {
        return connection;
      }
      // if memo is not defined set memo to first tessel
      if (!memo) return connection;
      // If none of the above, pass memo along
      return memo;
    }, null)
    .then(function(connection){
      tessel.logs.info("Connected over", connection.connectionType + ".");
      return new Tessel(connection);
    })
}

function deployScript(opts, push) {
  // Grab the preferred Tessel
  return getTessel({})
    .then(function(tessel){
      // Run the script on Tessel
      tessel.deployScript(opts, push);
    });
}

function eraseScript(opts) {
  // Grab the preferred Tessel
  getTessel({})
    .then(function(tessel) {
      // Run the script on Tessel
      tessel.eraseScript(opts, false);
    });
}

function printAvailableNetworks(opts) {
  // Grab the preferred Tessel
  return getTessel({})
    .then(function(selectedTessel) {
      // Run the script on Tessel
      return selectedTessel.findAvailableNetworks()
      .then(function(networks) {
        tessel.logs.info("Currently visible networks (" + networks.length + "):");

        // Print out networks
        networks.forEach(function(network) {
          tessel.logs.info("\t", network.ssid, "(" + network.quality + "/" + network.quality_max + ")");
        });
        return;
      });
    });
}


function printIPAddress(opts) {
 // Grab the preferred Tessel
  return getTessel({})
    .then(function(selectedTessel) {
    // Fetch it's IP Address
    return selectedTessel
      .getIPAddress()
      // Print the fetched IP
      .then(printIP)
    });

  function printIP(ip) {
    tessel.logs.info("IP ADDRESS: ", ip);
  }
}

function connectToNetwork(opts) {
  // Grab the preferred Tessel
  return getTessel({})
    .then(function(selectedTessel) {
      // Connect to the network with provided options
      return selectedTessel.connectToNetwork(opts);
  });
}

function printAvailableNetworks(opts, callback) {
  // Grab the preferred Tessel
  return getTessel({})
    .then(function(selectedTessel) {
    // Run the script on Tessel
    return selectedTessel.findAvailableNetworks()
      .then(function(networks) {

        tessel.logs.info("Currently visible networks (" + networks.length + "):");

        // Print out networks
        networks.forEach(function(network) {
          tessel.logs.info("\t", network.ssid, "(" + network.quality + "/" + network.quality_max + ")");
        });
        return;
    });
  });
}


function printIPAddress(opts, callback) {
 // Grab the preferred Tessel
  return getTessel({})
    .then(function(selectedTessel) {
      // Fetch it's IP Address
      return selectedTessel
        .getIPAddress()
        // Print the fetched IP
        .then(printIP)
    });

  function printIP(ip) {
    tessel.logs.info("IP ADDRESS: ", ip);
  }
}

function connectToNetwork(opts, callback) {
  // Grab the preferred Tessel
  return getTessel({})
    .then(function(selectedTessel) {
      // Connect to the network with provided options
      return selectedTessel.connectToNetwork(opts);
    });
}

module.exports.listTessels = listTessels;
module.exports.deployScript = deployScript;
module.exports.eraseScript = eraseScript;
module.exports.printAvailableNetworks = printAvailableNetworks;
module.exports.printIPAddress = printIPAddress;
module.exports.connectToNetwork = connectToNetwork;