module.exports = {
    'Salesforce' : {
        'ORG_ID' : process.env.SF_ORG_ID || '00D1e0000008rZd',
        'CHAT_DEPLOYMENT' : process.env.SF_CHAT_DEPLOYMENT || '5721e0000008OjV',
        'CHAT_BUTTON' : process.env.SF_CHAT_BUTTON || '5731e0000008OfV',
        'CHAT_ENDPOINT' : process.env.SF_CHAT_ENDPOINT || 'https://d.la1-c1-hnd.salesforceliveagent.com/chat/rest'
    },
    'Zalo' : {
        'OA_ENDPOINT' : process.env.ZL_OA_ENDPOINT || 'https://openapi.zalo.me/v2.0/oa',
        'WAITING_MESSAGE': process.env.ZL_WAITING_MESSAGE || 'Please hang on a sec.',
        'AGENT_ACCEPT_MESSAGE':  process.env.ZL_AGENT_ACCEPT_MESSAGE || 'Hello, This is Agent ${chasitorInfo.name}. How may I help you?',
        'SESSION_END_MESSAGE': process.env.ZL_SESSION_END_MESSAGE || 'Thank you for conversation. Have a nice day.',
        'DOMAIN_VERIFY' : process.env.ZL_DOMAIN,
        'SECRET_KEY' : process.env.ZL_SECRET_KEY || 'oLNP4R0OmSSOWqcJKuJf',
        'APP_ID' : process.env.ZL_APP_ID || '2030763101666336652',
        'AUTH_URL' : process.env.ZL_AUTH_URL || 'https://oauth.zaloapp.com/v4/oa/access_token'
    }
}

