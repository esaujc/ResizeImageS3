'use strict';

require('dotenv').config();
const Sharp = require('sharp');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION,
  signatureVersion: 'v4',
});

const BUCKET = process.env.BUCKET;
const DEST_URL = process.env.DEST_URL;
const width_resolutions = [1024, 800]

exports.handler = function(event, context, callback) {

  const originalKey = event.path;
  
  width_resolutions.map(async (width_resolution) => {
    const height_resolution = Math.round(width_resolution / (event.width/event.height));
    const newKey = `${DEST_URL}/${event.name}/${width_resolution}/${event.md5}.${event.type}`;

    await s3.getObject({Bucket: BUCKET, Key: originalKey}).promise()
    .then(data => 
      Sharp(data.Body)
      .resize(width_resolution, height_resolution)
      .toBuffer()
    )
    .then(buffer => 
        s3.putObject({
        Body: buffer,
        Bucket: BUCKET,
        ContentType: `image/${event.type}`,
        Key: newKey,
      }).promise()    
    )
    .then(() => callback(null, {
          statusCode: '301',
          headers: {'location': newKey },
          body: '',
        })
      )
      .catch(err => callback(err))
  })
}
