'use strict';
var fs = require('fs');
var path = require('path');

var configFilePath = path.join(__dirname, './ConnectionProfile.yml');
const CONFIG = fs.readFileSync(configFilePath, 'utf8')

/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Enroll the admin user
 */

var FabricClient = require('fabric-client');
var FabricCAClient = require('fabric-ca-client');


var path = require('path');
var util = require('util');
var os = require('os');


var fabricClient = new FabricClient();
fabricClient.loadFromConfig(configFilePath);

var member_user = null;
var connection = fabricClient;
var fabricCAClient;
var adminUser;
var tx_id = null;
var peers = connection.getPeersForOrg();
var event_hub = connection.getEventHub(peers[0].getName());

var channel = connection.getChannel();

connection.initCredentialStores().then(() => {
  fabricCAClient = connection.getCertificateAuthority();
  return connection.getUserContext('admin', true);
}).then((user_from_store) => {
	if (user_from_store && user_from_store.isEnrolled()) {
		console.log('Successfully loaded user1 from persistence');
		member_user = user_from_store;
	} else {
		throw new Error('Failed to get user1.... run registerUser.js');
	}

	// queryCar chaincode function - requires 1 argument, ex: args: ['CAR4'],
	// queryAllCars chaincode function - requires no arguments , ex: args: [''],
	const request = {
		//targets : --- letting this default to the peers assigned to the channel
		chaincodeId: 'mycc',
		fcn: 'queryAsset',
		args: ['DD114']
	};

	// send the query proposal to the peer
	return channel.queryByChaincode(request);
}).then((query_responses) => {
	console.log("Query has completed, checking results");
	// query_responses could have more than one  results if there multiple peers were used as targets
	if (query_responses && query_responses.length == 1) {
		if (query_responses[0] instanceof Error) {
			console.error("error from query = ", query_responses[0]);
		} else {
			console.log("Response is ", query_responses[0].toString());
		}
	} else {
		console.log("No payloads were returned from query");
	}
}).catch((err) => {
	console.error('Failed to query successfully :: ' + err);
});
