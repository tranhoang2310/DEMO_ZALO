const express = require('express');
const zalo = require('./modules/zalo');
const config = require('./config');

const app = express();
//app.use(express.raw({type: 'application/jwt'}));
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));


//This is use for Zalo registration domain
app.get('/', (req, res)=> {
    res.send(`<html><head><meta name="zalo-platform-site-verification" content="${config.Zalo.DOMAIN_VERIFY}"/></head><body></body></html>`);
});
  
app.post('/webhook', (req, res) => {
    zalo.webhookEvent(req, res);
  
    res.sendStatus(200);
})
  

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Server is listening on port ', PORT);
});