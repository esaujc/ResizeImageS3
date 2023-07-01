'use strict'

const {  asyncReadContent, asyncCreateContent, asyncModifyContent, asyncDeleteContent } = require('@utils/file-functions');
const { configuration } = require('@root/config');
const md5File = require('md5-file');
const sizeOf = require('image-size');


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
      const task_payload = {
        created: new Date(),
        state: 'in_progress',
        path: fileData.path
      };

      const md5_File = await md5File(fileData.path);
      const imageInfo = await sizeOf(fileData.path);

      const image_payload = {
        created: new Date(),
        md5: md5_File,
        height: imageInfo.height,
        width: imageInfo.width,
        type:imageInfo.type,
        path: fileData.path
      };

      if (!fileData ) {
        return res.status(422).json({ error: 'Task data not provided' });
      }
      const taskId = await asyncCreateContent(configuration.tasksDataPath, task_payload);
      const image = await asyncCreateContent(configuration.imagesDataPath, image_payload);
         
      res.status(200).json({status: 200, message: 'Task created successfully'})
  
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

      const result = await asyncDeleteContent(configuration.tasksDataPath, taskId)
               
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
    deleteTask
}