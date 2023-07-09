'use strict'

const { asyncReadContent, asyncCreateContent, asyncModifyContent, asyncDeleteContent } = require('@utils/file-functions');
const { configuration } = require('@root/config');
const sizeOf = require('image-size');

const uuid4 = require("uuid4");
const crypto = require('crypto');
const {updateInProgressTasks, uploadToS3, resizeImageWithLamda} = require('@utils/tasks-functions.js')


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

const getInProgressTasks = async (req, res, next) => {
  await updateInProgressTasks (req, res, next);  
};

const createTask = async (req, res, next) => {
    try {
      const fileData = req.file;

      if (!fileData) {
        return res.status(422).json({ error: 'Task data not provided' });
      }

      const hash = crypto.createHash('md5').digest('hex');
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
          md5: hash,
          height: imageInfo.height,
          width: imageInfo.width,
          type: imageInfo.type,
          path: fileData.path,
          filename: fileData.filename,
          originalname: fileData.originalname,
          bucketUrl: imageS3.data.Location,
          name: fileData.originalname.replace(/\.[^/.]+$/, "")          

        };
        
        // Lambda function to resize images and create them in the bucket
        const lambda = await resizeImageWithLamda(image_payload);

        // Lambda execution function start correct
        if (lambda){
          // Create task and image information
          await asyncCreateContent(configuration.tasksDataPath, task_payload);
          await asyncCreateContent(configuration.imagesDataPath, image_payload);
          
          res.status(200).json({status: 200, message: 'Task created successfully'});          
        }
        else
          res.status(400).send({status: 400, state:'Error' , message: 'Error creating new task'});  
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

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    modifyTask,
    deleteTask,
    getInProgressTasks
}