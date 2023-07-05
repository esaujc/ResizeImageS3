'use strict'
const path = require("path");
const fs = require("fs");
const { readFile, writeFile } = require("fs/promises");
const uuid4 = require("uuid4");


function readContent(dataPath, callback) {
  fs.readFile(path.resolve(__dirname, dataPath),'utf8', (err, content) => {
      if (err) return callback(err)

      callback(null, JSON.parse(content))
  })
}

async function asyncReadContent(dataPath, callback) {

  let data = JSON.parse(await readFile(path.resolve(__dirname, dataPath), "utf8"));
  return data;
}

async function asyncCreateContent(dataPath, payload, callback) {
  
  const readData = await asyncReadContent(dataPath);

  readData[payload.id] = payload;
  const newData = JSON.stringify(readData, null, 2);

  await writeFile(path.resolve(__dirname, dataPath), newData, "utf8");
  return;
}

async function asyncModifyContent(dataPath, payload, taskId, callback) {
  
  let ok = true;
  const readData = await asyncReadContent(dataPath);
  
  if (readData[taskId] && readData[taskId].id == taskId){
    payload.id = taskId;
    readData[taskId] = payload;
  } 
  else
    ok = false;
  
  const newData = JSON.stringify(readData, null, 2);

  await writeFile(path.resolve(__dirname, dataPath), newData, "utf8");
  return ok;

}

async function asyncDeleteContent(dataPath, taskId, callback) {

  let ok = true;
  const readData = await asyncReadContent(dataPath);  
  
  if (readData[taskId] && readData[taskId].id == taskId)
    delete readData[taskId];
  else
    ok = false;

  const newData = JSON.stringify(readData, null, 2);

  await writeFile(path.resolve(__dirname, dataPath), newData, "utf8");
  return ok;

}

module.exports = {
    readContent,
    asyncReadContent,
    asyncCreateContent,
    asyncModifyContent,
    asyncDeleteContent
}