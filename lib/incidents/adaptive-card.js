'use strict';

function buildMessage(responseText, attachments) {
    let message = { type: 'message' };
    if (responseText) message['text'] = responseText;
    if (attachments) message['attachments'] = attachments;
    return message;
}

function buildIncidentSummaryCard(incident) {
    return {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
            type: 'AdaptiveCard',
            version: '1.0',
            body: [
                {
                    type: 'TextBlock',
                    text: incident.number,
                    size: 'medium',
                    weight: 'bolder',
                },
                {
                    type: 'TextBlock',
                    text: incident.description,
                    separation: 'none'
                }
            ],
            actions: []
        }
    }
}

function buildIncidentDetailedCard(incident) {
    return {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
            type: 'AdaptiveCard',
            version: '1.0',
            body: [
                {
                    type: 'TextBlock',
                    text: incident.number,
                    size: 'medium',
                    weight: 'bolder',
                },
                {
                    type: 'TextBlock',
                    text: incident.description,
                    separation: 'none',
                    'wrap': true
                },
                {
                    type: 'FactSet',
                    facts: [
                        {
                            title: 'Opened at:',
                            value: incident.opened_at
                        },
                        {
                            title: 'Priority:',
                            value: incident.priority
                        },
                        {
                            title: 'Severity:',
                            value: incident.severity
                        },
                        {
                            title: 'Escalation:',
                            value: incident.escalation
                        },
                        {
                            title: 'Impact:',
                            value: incident.impact
                        },
                        {
                            title: 'Comments:',
                            value: incident.comments
                        }
                    ]
                }
            ],
            actions: []
        }
    }
}

function buildIncidentList(incidents) {
    return buildMessage(null, incidents.map(incident => buildIncidentSummaryCard(incident)));
}

function buildIncidentDetails(incident) {
    return buildMessage(null, [buildIncidentDetailedCard(incident)]);
}

module.exports = {
    buildIncidentList,
    buildIncidentDetails
}
