
interface Options {
  awsConfig?: AWSConfig;
  imageSizes?: Array<ImageSize>;
  saveLocal?: boolean;
}

interface AWSConfig {

}

type ImageSize = 'thumbnail' | 'product' | 'origin';

const sharp = require('sharp');
const fs = require('fs');

const defaultImgPath: string = './source-imgs/';
const distPath: string = './ouput-imgs/';
const THUMBNAIL: string = 'thumbnail_'
const PRODUCT: string = 'product_';
const ORIGIN: string = 'origin_';

function app (pathToImages: string, ouputPath: string = '', options = {}) {}

if (fs.existsSync(distPath)) {
  fs.rmdirSync(distPath, {recursive: true});
}

fs.mkdirSync(distPath);

fs.readdir(defaultImgPath, (err, files) => {
  if (err) throw new Error(err.message);

  for (let i = 0; i < files.length; i++) {
    const pathToImage = defaultImgPath + files[i];
    const filename: Array<string> = files[i].split('.');
    
    filename.splice(-1, 1);
    
    const pathToUpdatedImageThumbnailJPG: string = `${distPath}${THUMBNAIL}${filename.join('.')}.jpg`;
    const pathToUpdatedImageProductJPG: string = `${distPath}${PRODUCT}${filename.join('.')}.jpg`;
    const pathToUpdatedImageOriginJPG: string = `${distPath}${ORIGIN}${filename.join('.')}.jpg`;
    const pathToUpdatedImageThumbnailWEBP: string = `${distPath}${THUMBNAIL}${filename.join('.')}.webp`;
    const pathToUpdatedImageProductWEBP: string = `${distPath}${PRODUCT}${filename.join('.')}.webp`;
    const pathToUpdatedImageOriginWEBP: string = `${distPath}${ORIGIN}${filename.join('.')}.webp`;

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

module.exports = app;