'use strict';

const client = require('./servicenow/client');
const adaptiveCard = require('./adaptive-card');

const tableName = 'incident';

async function all() {
    let incidents = await client.all(tableName);
    return adaptiveCard.buildIncidentList(incidents);
}

async function find(id) {
    let incident = await client.find(tableName, id);
    return adaptiveCard.buildIncidentDetails(incident);
}

module.exports = {
    all,
    find
}
