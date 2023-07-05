'use strict'

const { readContent, asyncReadContent, asyncCreateContent, asyncModifyContent, asyncDeleteContent } = require('@utils/file-functions');
const { configuration } = require('@root/config');
const md5File = require('md5-file');
const sizeOf = require('image-size');

const path = require("path");
const AWS = require('aws-sdk');
const uuid4 = require("uuid4");
const fs = require("fs");

// {}
// []

const getAllTasks = async (req, res, next) => {
  try {
      const result = await asyncReadContent(configuration.tasksDataPath)
       
      res.status(200).json({status: 200, message: result})

    } catch (err) {
        res.status(500).send({status: 500, state:'Error' , message: err.message});
    }
};


const getTaskById = async (req, res, next) => {
    try {

        const taskId = req.params.taskId
        const result = await asyncReadContent(configuration.tasksDataPath)
         
        res.status(200).json({status: 200, message: result[taskId]})
        
      } catch (err) {
          res.status(500).send({status: 500, state:'Error' , message: err.message});
      }
};



const createTask = async (req, res, next) => {
    try {
      
      const fileData = req.file;

      if (!fileData ) {
        return res.status(422).json({ error: 'Task data not provided' });
      }

      const md5_File = await md5File(fileData.path);
      const imageInfo = await sizeOf(fileData.path);

      const imageS3 = await uploadToS3(fileData);

      if(imageS3.state != 0){
        res.status(500).send({status: 500, state:'Error' , message: imageS3.data});
      }
      else{
        const newId = uuid4();
        const task_payload = {
          id: newId,
          created: new Date(),
          state: 'in_progress',
          path: fileData.path
        };
        
        const image_payload = {
          id: newId,
          created: new Date(),
          md5: md5_File,
          height: imageInfo.height,
          width: imageInfo.width,
          type: imageInfo.type,
          path: fileData.path,
          filename: fileData.filename,
          originalname: fileData.originalname,
          bucketUrl: imageS3.data.Location,
          name: fileData.originalname.replace(/\.[^/.]+$/, "")          

        };
        
        const lambda = await resizeImageWithLamda(image_payload);
        await asyncCreateContent(configuration.tasksDataPath, task_payload);
        await asyncCreateContent(configuration.imagesDataPath, image_payload);

        res.status(200).json({status: 200, message: 'Task created successfully'});
      }
      
    } catch (err) {
      res.status(500).send({status: 500, state:'Error' , message: err.message});
    }
  };


const modifyTask = async (req, res, next) => {
    try {
      const payload = req.body;
      const taskId = req.params.id;
      
      if (!taskId || taskId == ':id' ) {
        return res.status(422).json({ error: 'TaskId not provided' });
      }

      const result = await asyncModifyContent(configuration.tasksDataPath, payload, taskId);
         
      if (result)
        res.status(200).json({statusCode: 200, message: `Task ${taskId} updated successfully`});
      else
        res.status(404).json({statusCode: 404, message: `Task ${taskId} not found`});
  
    } catch (err) {
        res.status(500).send({statusCode: 500, state:'Error' , message: err.message});
    }
  };

const deleteTask = async (req, res, next) => {
    try {
      const taskId = req.params.id;
      
      if (!taskId || taskId == ':id' ) {
        return res.status(422).json({ error: 'TaskId not provided' });
      }

      const result = await asyncDeleteContent(configuration.tasksDataPath, taskId);
               
      if (result)
        res.status(200).json({statusCode: 200, message: `Task ${taskId} deleted successfully`});
      else
        res.status(404).json({statusCode: 404, message: `Task ${taskId} not found`});

  
    } catch (err) {
        res.status(500).send({statusCode: 500, state:'Error' , message: err.message});
    }
  };

const uploadToS3 = async (file) => {   
    try{
      AWS.config.update({
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
      });
      const s3 = new AWS.S3()
    
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
      lambda.invoke(params, function(err, data) {
        if (err) {
          //Todo: deleteVideo?
          console.log('Lambda Error', err)
          return false;

        }
        else {
          console.log('Lambda OK')
          return true;
        }
      });
    // LAMBDA END


  } catch (err) {
    console.log('Lambda Catch Error ', err)
    return false;

  }
}; 

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    modifyTask,
    deleteTask
}