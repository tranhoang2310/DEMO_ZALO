const config = require('../config');
const axios = require('axios');
const logger = require('./logger');
const spaceFile = require('./spaceFile');

module.exports = class ZaloAuth {
    
    constructor() {
        this.authObject = {
            'secret_key' : config.Zalo.SECRET_KEY,
            'app_id' : config.Zalo.APP_ID,
            'auth_url' : config.Zalo.AUTH_URL,
        }
    }

    async getAccessToken() {
        try {
            let isExpired = _isExpired(this.authObject);
            console.log('getAccessToken isExpired:', isExpired);
            if (isExpired) {
                this.authObject = await _requestToken(this.authObject);
            }
        }
        catch(ex) {
            logger.error(`[Exception in ZaloAuth.getAccessToken] - ${ex}`);
        }

        return this.authObject;
    }
    
}

async function _requestToken(authObject) {
    //get refresh token
    let refreshToken = await spaceFile.getRefreshToken();
    console.log('refreshToken:', refreshToken);

    const payload = {
        'refresh_token' : refreshToken,
        'grant_type' : 'refresh_token',
        'app_id' : authObject.app_id
    };
    
    const res = await axios({
        method: 'post',
        url: authObject.auth_url,
        data: payload,
        headers : {
            'Content-Type': 'application/x-www-form-urlencoded',
            'secret_key' : authObject.secret_key
        }
    });

    //update resfresh token
    console.log('updated Refresh token:', res.data.refresh_token)
    spaceFile.setRefreshToken(res.data.refresh_token)
    .catch(err =>{
        logger.error(`Error during set new refresh token: ${err}`);
    });

    let processTime = process.hrtime()[0] * 1000;
    return Object.assign(authObject, res.data, {
        expiration: processTime + parseInt(res.data.expires_in),
    });
}

function _isExpired(authObject) {
    let expired = false;
    //console.log('_isExpired:', JSON.stringify(authObject));
    // if current atomic time is equal or after exp, or we don't have a token, return true
    let processTime = process.hrtime()[0] * 1000;
    console.log('authObject.expiration:', authObject.expiration);
    console.log('process.hrtime()[0]:', processTime);
    let flag = authObject.expiration && authObject.expiration <= processTime;
    console.log('flag:', flag);
    if ((authObject.expiration && authObject.expiration <= processTime) || !authObject.access_token) {
        expired = true;
    }

    return expired;
}