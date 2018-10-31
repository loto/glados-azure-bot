'use strict';

const client = require('./servicenow/client');

const tableName = 'incident';

async function all() {
    return await client.all(tableName);
}

async function find(id) {
    return await client.find(tableName, id);
}

module.exports = {
    all,
    find
}
