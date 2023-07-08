'use strict'

const multer = require("multer");
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'input')
    },
  
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  
})
  
const upload = multer({ storage: storage })  
const tasksController = require('@controllers/tasks-controller');

const tasksRouter = (app) => {

    app.get('/api/tasks', tasksController.getTaskById); 
    app.get('/api/tasks/inprogress', tasksController.getInProgressTasks)
    app.post('/api/tasks', upload.single('file'), tasksController.createTask); 
    app.put('/api/tasks/:id', tasksController.modifyTask);
    app.delete('/api/tasks/:id', tasksController.deleteTask);

}


module.exports = tasksRouter;