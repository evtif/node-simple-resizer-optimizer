const sharp = require('sharp');
const fs = require('fs');

const imgPath = './source-imgs/';
const distPath = './ouput-imgs/';


fs.readdir(imgPath, (err, files) => {
  if (err) throw new Error(err.message);

  for (let i = 0; i < files.length; i++) {
    const pathToImage = imgPath + files[i];
    const filename = files[i].split('.');
    
    filename.splice(-1, 1);
    
    const pathToUpdatedImageJPG = distPath + filename.join('.') + '.jpg';
    const pathToUpdatedImageWEBP = distPath + filename.join('.') + '.webp';

    const stream = fs.createReadStream(pathToImage);
    const writableStreamJpeg = fs.createWriteStream(pathToUpdatedImageJPG);
    const writableStreamWebp = fs.createWriteStream(pathToUpdatedImageWEBP);
    const transformerJpeg = sharp().resize(600).jpeg();
    const transformerWebp = sharp().resize(600).webp();
    stream.pipe(transformerJpeg).pipe(writableStreamJpeg);
    stream.pipe(transformerWebp).pipe(writableStreamWebp);
 }
});