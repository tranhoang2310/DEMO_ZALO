module.exports = {
    'Salesforce' : {
        'ORG_ID' : process.env.SF_ORG_ID || '00D2w000002lREe',
        'CHAT_DEPLOYMENT' : process.env.SF_CHAT_DEPLOYMENT || '5722w000000YcU5',
        'CHAT_BUTTON' : process.env.SF_CHAT_BUTTON || '5732w000000Ykgd',
        'CHAT_ENDPOINT' : process.env.SF_CHAT_ENDPOINT || 'https://d.la2-c2-ukb.salesforceliveagent.com/chat/rest/'
    },
    'Zalo' : {
        'OA_ENDPOINT' : process.env.ZL_OA_ENDPOINT || 'https://openapi.zalo.me/v3.0/oa/message/cs',
        'WAITING_MESSAGE': process.env.ZL_WAITING_MESSAGE || 'Please hang on a sec.',
        'AGENT_ACCEPT_MESSAGE':  process.env.ZL_AGENT_ACCEPT_MESSAGE || 'Hello, This is Agent ${chasitorInfo.name}. How may I help you?',
        'SESSION_END_MESSAGE': process.env.ZL_SESSION_END_MESSAGE || 'Thank you for conversation. Have a nice day.',
        'DOMAIN_VERIFY' : process.env.ZL_DOMAIN,
        'SECRET_KEY' : process.env.ZL_SECRET_KEY || 'oLNP4R0OmSSOWqcJKuJf',
        'APP_ID' : process.env.ZL_APP_ID || '2030763101666336652',
        'AUTH_URL' : process.env.ZL_AUTH_URL || 'https://oauth.zaloapp.com/v4/oa/access_token',
        'ACCESS_TOKEN' : '0rVyNBpWi4u3LF9UkkEqIm5Mz5c_-EW_Gotn8lsPua0aKSWTswNKTGLdvcZGiyaq4LVqTCg-h1K0PBrqje6G1abCb6AF-uWAJGwqM93QcL1e0AOIaTQZNNarh1E3mRLzU6oi28UyXdfPKxuFkQ6ZUsT9a2Y1-e9V8ooWATdsjs8YHQCodvMlK2PSc2VEiC1N57Bu2lstwc0MPVXezuVLEHzFsMd1diTxEIdZDixgzKOcKySGcuFuKbXam3-sqD5D3mBD7-lprWj92_PlekdPBru1dLYZzuOf7aUHJlYLipC38B5z-E6XB10rcNxdnS5YC1MD48hIbrTG6xOzLrEFW7KbkFcwJW',
        'REFRESH_TOKEN' : 'DCcFKjWctu458dAU2FRbaNRPCcQGZ34zCmUF9aYEcNRtdVIaq'
    }
}

