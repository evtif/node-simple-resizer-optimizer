const sharp = require('sharp');
const fs = require('fs');

const imgPath = './source-imgs/';
const distPath = './ouput-imgs/';
const THUMBNAIL = 'thumbnail_'
const PRODUCT = 'product_';
const ORIGIN = 'origin_';

if (fs.existsSync(distPath)) {
  fs.rmdirSync(distPath, {recursive: true});
}

fs.mkdirSync(distPath);

fs.readdir(imgPath, (err, files) => {
  if (err) throw new Error(err.message);

  for (let i = 0; i < files.length; i++) {
    const pathToImage = imgPath + files[i];
    const filename = files[i].split('.');
    
    filename.splice(-1, 1);
    
    const pathToUpdatedImageThumbnailJPG = `${distPath}${THUMBNAIL}${filename.join('.')}.jpg`;
    const pathToUpdatedImageProductJPG = `${distPath}${PRODUCT}${filename.join('.')}.jpg`;
    const pathToUpdatedImageOriginJPG = `${distPath}${ORIGIN}${filename.join('.')}.jpg`;
    const pathToUpdatedImageThumbnailWEBP = `${distPath}${THUMBNAIL}${filename.join('.')}.webp`;
    const pathToUpdatedImageProductWEBP = `${distPath}${PRODUCT}${filename.join('.')}.webp`;
    const pathToUpdatedImageOriginWEBP = `${distPath}${ORIGIN}${filename.join('.')}.webp`;

    const stream = fs.createReadStream(pathToImage);
    const writableStreamThumbnailJpeg = fs.createWriteStream(pathToUpdatedImageThumbnailJPG);
    const writableStreamProductJpeg = fs.createWriteStream(pathToUpdatedImageProductJPG);
    const writableStreamOriginJpeg = fs.createWriteStream(pathToUpdatedImageOriginJPG);
    const writableStreamThumbnailWebp = fs.createWriteStream(pathToUpdatedImageThumbnailWEBP);
    const writableStreamProductWebp = fs.createWriteStream(pathToUpdatedImageProductWEBP);
    const writableStreamOriginWebp = fs.createWriteStream(pathToUpdatedImageOriginWEBP);

    const transformerThumbnailJpeg = sharp().resize(80).jpeg();
    const transformerProductJpeg = sharp().resize(400).jpeg();
    const transformerOriginJpeg = sharp().resize(750).jpeg();
    const transformerThumbnailWebp = sharp().resize(80).webp();
    const transformerProductWebp = sharp().resize(400).webp();
    const transformerOriginWebp = sharp().resize(750).webp();

    stream.pipe(transformerThumbnailJpeg).pipe(writableStreamThumbnailJpeg);
    stream.pipe(transformerProductJpeg).pipe(writableStreamProductJpeg);
    stream.pipe(transformerOriginJpeg).pipe(writableStreamOriginJpeg);
    stream.pipe(transformerThumbnailWebp).pipe(writableStreamThumbnailWebp);
    stream.pipe(transformerProductWebp).pipe(writableStreamProductWebp);
    stream.pipe(transformerOriginWebp).pipe(writableStreamOriginWebp);
 }
});