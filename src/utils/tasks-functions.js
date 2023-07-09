'use strict'

const { readContent, asyncReadContent, asyncCreateContent, asyncModifyContent, asyncDeleteContent } = require('@utils/file-functions');
const { configuration } = require('@root/config');

const path = require("path");
const AWS = require('aws-sdk');
const fs = require('fs');
const crypto = require('crypto');

const updateInProgressTasks = async (req, res, next) => {
    try {
  
      const downloadPromises = [];
      const width_resolutions = [1024, 800];
      // Find Task List
      const taskList = await asyncReadContent(configuration.tasksDataPath);
  
      // Filter Task List
      const tasksInProgress = [];
      for (const property in taskList) {   
        taskList[property].state == "in_progress" ? tasksInProgress.push(taskList[property]) : '';
      }
  
      // Task to process
      if (tasksInProgress.length > 0){
        console.log('Updating tasks ...')
        for (const taskInProgress of tasksInProgress){
          const downloadImages = await asyncReadContent(configuration.imagesDataPath)
          
          for (const property in downloadImages) { 
            if(taskInProgress.id == downloadImages[property].id) {
              // Download Images from resolutions requested
              width_resolutions.map((width_item) => {
                const bucketFilePath = `output/${downloadImages[property].name}/${width_item}/${downloadImages[property].md5}.${downloadImages[property].type}`
                const outputFile = `output/${downloadImages[property].name}/${width_item}/#hash.${downloadImages[property].type}`
                
                const downloadS3ImagePromise = downloadS3Image(process.env.AWS_SOURCE_BUCKET, bucketFilePath, outputFile)
                .then(async () => {
                  // Update tasks
                  taskInProgress.state = "finished";
                  taskInProgress.updated = new Date();
                  const updateResult = await asyncModifyContent(configuration.tasksDataPath, taskInProgress, taskInProgress.id); 
                  return updateResult;
                })
                .catch(error => console.error('Error downloading file:', error));            
                              
                downloadPromises.push(downloadS3ImagePromise);
                
              })
            }      
          }
       }
  
        const finalResult = await Promise.all(downloadPromises);
        if (finalResult.includes(false)){
            if (res != undefined)
                res.status(422).send({status: 422, state:'Error' , message: 'Error updating one or more tasks'});
            else
                console.log('Error updating one or more tasks')
        }
        else{
            if (res != undefined)
                res.status(200).json({status: 200, message: 'All Tasks updated successfully'})
            else
                console.log('All Tasks updated successfully')
        }
      }
      else
        if (res != undefined)
            res.status(200).json({status: 200, message: 'No tasks to be updated'})
        else
            console.log('No tasks to be updated')
  
    } catch (err) {
        if (res != undefined)
            res.status(500).send({status: 500, state:'Error' , message: err.message});
        else
            console.log('Error updating tasks')
    }
  };
  const uploadToS3 = async (file) => {   
    try{
      AWS.config.update({
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
      });
      const s3 = new AWS.S3();
    
      const fileBody = fs.readFileSync(path.resolve(__dirname,`../../input/${file.filename}`));
      const uploadPayload = {
        Bucket: process.env.AWS_SOURCE_BUCKET,
        Key: `input/${file.filename}`,
        Body: fileBody,
       }

        const result = await s3.upload(uploadPayload).promise()
        .then((data => {
          return {state: 0, data};
        }))
        .catch((error) => {
          return {state: 1, data: error}
        })
        return result;
     
    }
    catch(error) {
      return {state: 2, data: error}
    }
};

const resizeImageWithLamda = async (image_payload) => {
  try {
    AWS.config.update({
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });

    // LAMBDA START
      const lambda = new AWS.Lambda();
      const params = {
        FunctionName: configuration.jobSubmitImageLambda,   /* required */
        Payload: JSON.stringify(image_payload),
        InvocationType: 'Event'
      };      
      const result = lambda.invoke(params, function(err, data) {
        if (err) {
          //Todo: deleteVideo?
          // console.log('Lambda Error', err)
          return false;

        }
        else {
          // console.log('Lambda OK')
          return true;
        }
      });
    // LAMBDA END
    
    return result;

  } catch (err) {
    // console.log('Lambda Catch Error ', err)
    return false;

  }
};

const downloadS3Image =  async (bucketName, key, target)  => {
  AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  });
  const s3 = new AWS.S3();
  
  const params = {
    Bucket: bucketName,
    Key: key
  };

  const result = await s3.getObject(params).promise();
  
  // Update hash in every image downloaded
  const hash = crypto.createHash('md5').update(result.Body).digest('hex');
  const hashTarget = target.replace('#hash', `${hash}`);

  const targetDirectory = path.dirname(hashTarget);
  if (!fs.existsSync(targetDirectory)) {
    fs.mkdirSync(targetDirectory, { recursive: true });
  }

  fs.writeFileSync(hashTarget, result.Body);

  // console.log('File dowload successfully.');
}

  module.exports = {
    updateInProgressTasks,
    uploadToS3,
    resizeImageWithLamda, 
    downloadS3Image
  }