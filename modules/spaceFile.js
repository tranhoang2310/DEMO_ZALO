const { PutObjectCommand, S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('./logger');

const s3Client = new S3Client({
    endpoint: 'https://sgp1.digitaloceanspaces.com', 
    forcePathStyle: false, 
    region: 'sgp1', 
    credentials: {
      accessKeyId: 'DO00MFNHN6C2HUZZW366', 
      secretAccessKey: 'ngLyinkELC9WNXOARKWsesdT+tJtvY1nblZOYXTaOaE'
    }
});

// Function to turn the file's body into a string.
const streamToString = (stream) => {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
};

const spaceFile = {}; 

spaceFile.getRefreshToken = async () => {
  try {
      const bucketParams = {
          Bucket: 'zalo-cache',
          Key: 'zalo_refresh_token.txt'
      };
      const response = await s3Client.send(new GetObjectCommand(bucketParams));
      const data = await streamToString(response.Body);
      return data;
  } 
  catch (ex) {
      logger.error(`[Exception in spaceFile.getRefreshToken] - ${ex}`)
  }
}

spaceFile.setRefreshToken = async (newRefreshToken) => {
  try {
      const bucketParams = {
          Bucket: 'zalo-cache',
          Key: 'zalo_refresh_token.txt',
          Body: newRefreshToken 
      }
      const data = await s3Client.send(new PutObjectCommand(bucketParams));
  } catch (ex) {
    logger.error(`[Exception in spaceFile.setRefreshToken] - ${ex}`)
  }
}


module.exports = spaceFile;