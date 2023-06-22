const axios = require('axios');
const cache = require('memory-cache');
const Queue = require("better-queue");
const config = require('../config');
const liveAgent = require('./liveAgent');
const ZaloAuth = require('./zalo_auth');
const logger = require('./logger');

const auth = new ZaloAuth();

module.exports.webhookEvent = async (req, res) => {
    const event = req.body;
    switch (event.event_name) {
        case "user_send_text":
            processTextMessage(event);
            break;
        default:
            break;
    }
}


const processTextMessage = async (event) => {
    try {
        const senderId = event.sender.id;
        const message = event.message.text;

      

        if (cache.get(senderId) == null) {
            initSession(senderId);
        }

        let current_session = cache.get(senderId);

        //if (message.toUpperCase() == 'TALK TO AGENT' && current_session.chatSession.talkToAgent == false)  
        if (current_session.chatSession.talkToAgent == false)  
        {
            current_session.chatSession.talkToAgent = true;
            current_session.chatSession.chatEstablished = false;
            current_session.chatSession.remainingMessages = message;
            current_session.chatSession.latestMessage = message;
            current_session.chatSession.agentQueue = new Queue(function (pme, cb) {
            pme.then(() => {
                cb();
            });
            });
    
            current_session.liveAgentSession.agentQueue = new Queue(function (pme, cb) {
            pme.then(() => {
                cb();
            });
            });
            await zaloStartAgent(current_session);
        } else {
            if (current_session.chatSession.talkToAgent && current_session.liveAgentSession.agentQueue != null) {
                if (current_session.chatSession.chatEstablished) {
                    liveAgent.sendAgentMessage(current_session, message);
                } else {
                    if (current_session.chatSession.latestMessage == null || current_session.chatSession.latestMessage != message) {
                        current_session.chatSession.remainingMessages = current_session.chatSession.remainingMessages + "\n" + message;
                    }
                    current_session.chatSession.latestMessage = message;
                }
            }
        }
    }
    catch(ex) {
        logger.error(`[Exception in zalo.processTextMessage] - ${ex}`);
    }
}

const initSession = (senderId) => {
    cache.put(senderId, {
        chatSession: {
            talkToAgent: false,
            chatEstablished: false,
            userId: senderId,
            userName: null,
            agentQueue: null,
            remainingMessages: null,
            latestMessage: null,
        },
        liveAgentSession: {
            agentQueue: null,
        }
    });

}

const zaloStartAgent = async (current_session) => {
    try {

        const authObject = await auth.getAccessToken();

        console.log('=== zaloStartAgent authObject:', JSON.stringify(authObject));

        zalo_push_send(config.Zalo.WAITING_MESSAGE, current_session);
        //const userProfileResponse = await getZaloUserInfo(current_session.chatSession.userId, config.Zalo.TOKEN);
        const userProfileResponse = await getZaloUserInfo(current_session.chatSession.userId, authObject.access_token);
        const userProfile = userProfileResponse.data;
        console.log('userProfile:', JSON.stringify(userProfile));
        current_session.chatSession.userName = userProfile.data.display_name;
        const sessionResponse = await liveAgent.getLiveAgentSession();
        const session = sessionResponse.data;
        
        current_session.chatSession.chatEstablished = false;
        current_session.liveAgentSession.id = session.id;
        current_session.liveAgentSession.key = session.key;
        current_session.liveAgentSession.affinityToken = session.affinityToken;
        current_session.liveAgentSession.pollTimeout = session.clientPollTimeout;
        current_session.liveAgentSession.initialFetchTime = Date.now();
        current_session.liveAgentSession.currentFetchTime = Date.now();

        liveAgent
        .chasitorInit(current_session)
        .then((chasitorResponse) => {
            //-1 for init
            current_session.liveAgentSession.sequence = -1;
            current_session.liveAgentSession.timer = null;

            function initialPolling(current_session) {
                estabishedLongPolling(current_session);
            }

            function estabishedLongPolling(current_session) {
                liveAgent.messages(current_session.liveAgentSession, current_session.sequence)
                    .then((msgResponse) => {
                        const newmsg = msgResponse.data;
                        //code 204
                        if (newmsg == "") {
                            let diffFromCurrent = (Date.now() - current_session.liveAgentSession.currentFetchTime) / 1000;
                            let deadlineTime = current_session.liveAgentSession.warningTime ? current_session.liveAgentSession.warningTime : current_session.liveAgentSession.connectionTimeout;
                            console.log("diff v dead", diffFromCurrent, deadlineTime);
                            if (diffFromCurrent > deadlineTime) {
                            current_session.chatSession.talkToAgent = false;
                            current_session.chatSession.chatEstablished = false;
                            zalo_push_send(config.Zalo.SESSION_END_MESSAGE, current_session);
                            liveAgent.endLiveAgent(current_session, "timeout");
                            current_session.liveAgentSession.agentQueue = null;
                            } else {
                            initialPolling(current_session);
                            }
                        } else {
                            current_session.liveAgentSession.currentFetchTime = Date.now();
                            var newmsg_json = newmsg; //JSON.parse(newmsg);

                            const event_type = newmsg_json.messages[0].type;
                            if (event_type == "ChatRequestSuccess") {
                                //update sequence
                                //can check queue here 1 = 0 queue
                                current_session.liveAgentSession.connectionTimeout = newmsg_json.messages[0].message.connectionTimeout;
                                current_session.liveAgentSession.sequence = newmsg_json.sequence;
                                initialPolling(current_session);
                            } else if (event_type == "ChatEstablished") {
                                const chasitorInfo = newmsg_json.messages[0].message;

                                current_session.liveAgentSession.warningTime = chasitorInfo.chasitorIdleTimeout.warningTime;
                                current_session.liveAgentSession.timeout = chasitorInfo.chasitorIdleTimeout.timeout;

                                let greetingMsg = config.Zalo.AGENT_ACCEPT_MESSAGE;
                                if (greetingMsg !== null) {
                                    greetingMsg = greetingMsg.replace("${chasitorInfo.name}", chasitorInfo.name);
                                } else {
                                    greetingMsg = `Hello, This is Agent ${chasitorInfo.name}. How may I help you?`;
                                }
                                zalo_push_send(greetingMsg, current_session);

                                sleep(1000).then(() => {
                                    try {
                                        if (current_session.chatSession.remainingMessages != null) {
                                            liveAgent.sendAgentMessage(current_session, "Pre-chat message\n" + current_session.chatSession.remainingMessages);
                                            current_session.chatSession.remainingMessages = null;
                                        }
                                        } catch (error) {
                                            logger.log(`send remaining message error:${error} - current_session:${current_session}`);
                                        }
                                });
                                current_session.chatSession.chatEstablished = true;
                                initialPolling(current_session);
                            } else if (event_type == "QueueUpdate") {
                                initialPolling(current_session);
                            } else if (event_type == "ChatMessage" || newmsg_json.messages.length > 1) {
                                current_session.liveAgentSession.sequence = newmsg_json.sequence;
                                var tmpmsg = [];
                                for (var msgIdx = 0; msgIdx < newmsg_json.messages.length; ++msgIdx) {
                                    if (newmsg_json.messages[msgIdx].type == "ChatMessage") {
                                        tmpmsg.push(newmsg_json.messages[msgIdx].message.text);
                                    }
                                }
                                zalo_push_send(tmpmsg, current_session);
                                initialPolling(current_session);
                            } else if (event_type == "ChatEnded") {
                                current_session.chatSession.talkToAgent = false;
                                current_session.liveAgentSession.agentQueue = null;
                                current_session.chatSession.chatEstablished = false;
                                zalo_push_send(config.Zalo.SESSION_END_MESSAGE, current_session);
                            } else if (event_type == "ChatRequestFail") {
                                zalo_push_send(`No Agent Available.`, current_session);
                                current_session.chatSession.talkToAgent = false;
                                current_session.chatSession.chatEstablished = false;
                                current_session.liveAgentSession.agentQueue = null;
                            } else if (event_type == "AgentTyping") {
                                initialPolling(current_session);
                            } else if (event_type == "AgentNotTyping") {
                                initialPolling(current_session);
                            }
                        }
                    })
                    .catch((err) => {
                        logger.error(`estabishedLongPolling error in startAgent:${err} - current_session:${current_session}`);
                    });
            }
            
            initialPolling(current_session);
        }).catch (error => {
            logger.error(`chasitorInit error in startAgent:${error} - current_session:${current_session}`);
        });
    }
    catch(ex) {
        logger.error(`[Exception in zaloStartaAgent] - ${ex}`);
    }
    
};
  
const getZaloUserInfo = async (userId, zaloToken) => {
    const userIdString = `{'user_id':'${userId}'}`;
    const options = {
        method: "GET",
        params: { data: userIdString },
        url: `${config.Zalo.OA_ENDPOINT}/getprofile`,
        headers : {
            'access_token' : zaloToken
        }
    };
      
    return axios(options);
};

const zalo_push_send = (message, current_session) => {
    if (!Array.isArray(message)) {
      zalo_push_send_single(message, current_session);
    } else {
      for (var msgIdx = 0; msgIdx < message.length; msgIdx++) {
        zalo_push_send_single(message[msgIdx], current_session);
      }
    }
};
  
const zalo_push_send_single = async(message, current_session) => {
    const authObject = await auth.getAccessToken();
    if (!Array.isArray(message)) {
      current_session.chatSession.agentQueue.push(
        new Promise((resolve, reject) => {
          try {
            const postData = {
              recipient: {
                user_id: current_session.chatSession.userId,
              },
              message: {
                text: message,
              },
            };
  
            const options = {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                 //access_token: config.Zalo.TOKEN,
                 access_token: authObject.access_token,
              },
              data: postData,
              url: `${config.Zalo.OA_ENDPOINT}/message/cs`,
            };
  
            axios(options)
              .then(function (response) {
                resolve(response.data);
              })
              .catch(function (error) {
                logger.error(`zalo_push_send_single error:${error} - current_session:${current_session}`);
                console.log('error hung:', error);
              });
          } catch (error) {
            logger.error(`zalo_push_send_single error:${error} - current_session:${current_session}`);
          }
        })
      );
    }
}

const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
};


