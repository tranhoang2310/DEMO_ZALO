const axios = require('axios');
const config = require('../config');
const logger = require('./logger');

const  LIVE_AGENT_API_VERSION = 57,
       SCREEN_RES = '1900x1080',
       LIVE_AGENT_LANGUAGE = 'en-US',
       organizationId = config.Salesforce.ORG_ID,
       liveAgentUrl = config.Salesforce.CHAT_ENDPOINT
       

exports.getLiveAgentSession = () => {
    const options = {
        method: 'GET',
        headers: {
            'X-LIVEAGENT-API-VERSION': LIVE_AGENT_API_VERSION,
            'X-LIVEAGENT-AFFINITY': 'null',
        },
        url: `${liveAgentUrl}/System/SessionId`
    };

    return axios(options);

};

exports.chasitorInit = (current_session) => {
    const sessionKey = current_session.liveAgentSession.key;
    const sessionId = current_session.liveAgentSession.id;
    const affinityToken = current_session.liveAgentSession.affinityToken;
    const senderId = current_session.chatSession.userId;
    const senderName = current_session.chatSession.userName;
    const liveAgentButton = config.Salesforce.CHAT_BUTTON;
    const liveAgentDeployment = config.Salesforce.CHAT_DEPLOYMENT;
    
    const body = {
        organizationId: organizationId,
        deploymentId: liveAgentDeployment,
        buttonId: liveAgentButton,
        sessionId: sessionId,
        userAgent: '',
        language: LIVE_AGENT_LANGUAGE,
        screenResolution: SCREEN_RES,
        visitorName: senderName,
        prechatDetails: [
            {
                label: 'Name',
                value: senderName,
                entityMaps: [],
                transcriptFields: [],
                displayToAgent: true,
            },
            {
                label: 'Zalo Message',
                value: 'Zalo message from ' + senderName,
                entityMaps: [],
                transcriptFields: ['Zalo_Name__c'],
                displayToAgent: true,
            },
            {
                label: 'Zalo ID',
                value: senderId,
                transcriptFields: ['Zalo_ID__c'],
                entityMaps : [
                  {
                    entityName: 'contact',
                    fieldName: 'Zalo_Persona_ID__c'
                  }
                ],
                displayToAgent: true,
            },
        ],
        prechatEntities: [
            {
              entityName: "Contact",
              saveToTranscript: "contact",
              linkToEntityField: "ContactId",
              entityFieldsMaps: [
                {
                  fieldName: "Zalo_Persona_ID__c",
                  label: "Zalo ID",
                  doFind: true,
                  isExactMatch: true,
                  doCreate: false,
                }
            ],
          },
        ],

        buttonOverrides: [],
        receiveQueueUpdates: true,
        isPost: true,
    };

    const options = {
        url: `${liveAgentUrl}/Chasitor/ChasitorInit`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-LIVEAGENT-API-VERSION': LIVE_AGENT_API_VERSION,
            'X-LIVEAGENT-AFFINITY': affinityToken,
            'X-LIVEAGENT-SESSION-KEY': sessionKey,
            'X-LIVEAGENT-SEQUENCE': 1,
        },
        data: body
    };

    return  axios(options);
  
};

exports.messages = (session, seq) => {
    const options = {
        url: `${liveAgentUrl}/System/Messages`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-LIVEAGENT-API-VERSION': LIVE_AGENT_API_VERSION,
            'X-LIVEAGENT-AFFINITY': session.affinityToken,
            'X-LIVEAGENT-SESSION-KEY': session.key,
        },
        params: {
            ack: seq,
        }
    };

    return axios(options);
 
};

exports.endLiveAgent = async (current_session) => {
  try {
    current_session.liveAgentSession.agentQueue.push(
      new Promise((resolve, reject) => {
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-LIVEAGENT-API-VERSION': LIVE_AGENT_API_VERSION,
            'X-LIVEAGENT-AFFINITY': current_session.liveAgentSession.affinityToken,
            'X-LIVEAGENT-SESSION-KEY': current_session.liveAgentSession.key,
            'X-LIVEAGENT-SEQUENCE': current_session.liveAgentSession.sequence,
          },
          data: {
            ChatEndReason: {
              reason: 'client',
            },
          },
          url: `${liveAgentUrl}/Chasitor/ChatEnd`,
        };
        axios(options)
          .then((response) => {
            if (response != null && response.data != null) {
              resolve(response.data);
            }
          })
          .catch((error) => {
            logger.error(`endLiveAgent error ${error} - current_session:${current_session} `);
          });
      })
    );
  } catch (ex) {
    logger.error(`[Exception in liveAgent.endLiveAgent] ${ex} - current_session:${current_session}`);
  }
};

exports.sendAgentMessage = (current_session, message) => {
  try {
    current_session.liveAgentSession.agentQueue.push(
      new Promise((resolve, reject) => {
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-LIVEAGENT-API-VERSION': LIVE_AGENT_API_VERSION,
            'X-LIVEAGENT-AFFINITY': current_session.liveAgentSession.affinityToken,
            'X-LIVEAGENT-SESSION-KEY': current_session.liveAgentSession.key,
          },
          data: {
            text: message,
          },
          url: `${liveAgentUrl}/Chasitor/ChatMessage`,
        };
        axios(options)
          .then((response) => {
            if (response != null && response.data != null) {
              current_session.liveAgentSession.sequence = current_session.sequence + 1;
              resolve(response.data);
            }
          })
          .catch((error) => {
            logger.error(`sendAgentMessage error ${error} - current_session:${current_session} `);
          });
      })
    );
  } catch (ex) {
    logger.error(`[Exception in liveAgent.sendAgentMessage] ${ex} - current_session:${current_session}`);
  }
};
