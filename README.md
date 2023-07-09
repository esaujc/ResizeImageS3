# Resize image proyect
This project allows images to be uploaded and resized to different resolutions using an AWS Lambda function, using "node.js" and "express".

## Build Setup

```bash
# install dependencies
$ npm install

# build for production and launch server
$ npm run start

# serve with hot reload at localhost:3000
$ npm run dev

```

## Architecture

The architecture used is quite simple:
1. Backend: made with node with a REST API to manage tasks and their status (full CRUD).
2. Storage: The first idea was to use mongo as the database and create a "docker-compose" file to encapsulate everything, but then I thought that although it is not the best option, using json type text files would not be necessary to have to install docker, docker-compose, etc. Two files are used: one for the tasks and another for the images. The "id" field connects the files as if it were a foreign key.
3. Resize function: A Lambda function has been made in AWS for this task. A user has been configured with access to the bucket where the images are uploaded and where they are collected once resized.
4. Reception of resized images: there is the possibility of connecting the completion of a Lambda function with the sending of SNS notifications in AWS to a specific endpoint of our backend. This was originally intended but by running locally, it has been replaced by a process that runs every minute and checks the status of tasks. Those that are "in_progress" will download the resized images from the AWS bucket associated with that task and move to the "finished" status.
5. There are several points to improve but it can be an approximation to what was requested.
6. A Postman collection has been added to be able to do different tests.
7. AWS login details are required in an .env file.

## File structure

```
📦 repository
├─ input
├─ lambda_aws_resize
├─ output
├─ src
│  ├─ controllers
│  │  └─ tasks-controller.js
│  ├─ data
│  │  ├─ images-data.json
│  │  └─ tasks-data.json
│  ├─ routes
│  │  ├─ index.js
│  │  └─ tasks.js
│  └─ utils
│     ├─ file-functions.js
│     └─ tasks-functions.js
├─ config.js
├─ package.json
├─ postman_collection.json
└─ server.js
```

### Folder explanation
input - Folder where uploaded images are stored.
output - Folder where the resized images are downloaded.
lambda_aws_resize - folder containing the Lambda function used for resizing. Based on "https://github.com/amazon-archives/serverless-image-resizing".
src/controllers/tasks-controller.js
- File where the functions that manage the CRUD are located,
src/data
- images-data.json -> information related to the loaded image.
```
Example:
{
  "5c20abe9-49ef-4cc7-b171-3059b5d2134f": {
    "id": "5c20abe9-49ef-4cc7-b171-3059b5d2134f",
    "created": "2023-07-08T12:29:11.660Z",
    "md5": "d41d8cd98f00b204e9800998ecf8427e",
    "height": 357,
    "width": 343,
    "type": "jpg",
    "path": "input/error2.jpg",
    "filename": "error2.jpg",
    "originalname": "error2.jpg",
    "bucketUrl": "https://capitol-test.s3.amazonaws.com/input/error2.jpg",
    "name": "error2"
  }
}
```
- tasks-data.json -> information of the task that will resize the image loaded in "images-data.json". Connected by the "id" field.
```
Example:
{
  "5c20abe9-49ef-4cc7-b171-3059b5d2134f": {
    "id": "5c20abe9-49ef-4cc7-b171-3059b5d2134f",
    "created": "2023-07-08T12:29:11.660Z",
    "state": "finished",
    "path": "input/error2.jpg",
    "updated": "2023-07-09T15:08:01.747Z"
  }
}
```
src/routes
- Files where the API routes are configured.

src/utils/file-functions.js
Functions have been created to read, save, modify and delete task records (images) in files with json format.

src/utils/tasks-functions.js
- updateInProgressTasks: used in the function that runs every minute, and has been adapted to be used in the GET "/api/tasks/inprogress" endpoint.
- uploadToS3: Uploads the image to the AWS bucket in the "input" "folder".
- resizeImageWithLamda: function that sends the data to execute the Lambda function that resizes the images.
- downloadS3Image: function that downloads the resized images from the AWS bucket to the local "output/*" folder

config.js
- Configuration file where the paths of the data files and the name of the lambda function to be executed are stored.

server.js
- File that starts the whole process.

postman_collection.json
- File to be able to test the endpoints.

#### env variables

PORT=
ACCESS_KEY_ID=
SECRET_ACCESS_KEY=
AWS_REGION=
AWS_SOURCE_BUCKET=