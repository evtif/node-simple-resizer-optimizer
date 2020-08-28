
interface Options {
  awsConfig: AWSConfig;
  imageOptions: Array<ResizeOption>;
  saveLocal?: boolean;
  useWebp: boolean;
}

interface AWSConfig {
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

interface ResizeOption {
  prefix?: string;
  postfix?: string;
  size: number;
  quality: number;
  lossless: boolean;
}

interface ImageInfo {
  filename: string;
  format: string;
  size: number;
  quality: number;
  lossless: boolean;
  transformStream?: unknown;
}

type StreamTuple = [any, Promise<null>]

class ImageInfo implements ImageInfo {
  constructor(
    format: string,
    filename: string,
    size: number,
    quality: number,
    lossless: boolean
  ) {
    this.format = format;
    this.filename = filename;
    this.size = size;
    this.quality = quality;
    this.lossless= lossless;
  }
}

const fs = require('fs');
const stream = require('stream');
const sharp = require('sharp');
const AWS = require('aws-sdk');

const supportedFormats: Set<string> = new Set(['jpeg', 'png', 'jpg', 'webp', 'tiff', 'gif', 'svg']);

const uploadStream = ({ Bucket, Key }: { Bucket: string, Key: string }, s3: any ): StreamTuple => {
  const pass = new stream.PassThrough();

  return [
    pass,
    s3.upload({ Bucket, Key, Body: pass }).promise(),
  ];
}


const createFileNameCallback = (filename: string, format: string):
  (value: ResizeOption, index: number, array: ResizeOption[]) => ImageInfo => (imageOptions): ImageInfo => {
  let { prefix, postfix, size, quality, lossless } = imageOptions;

  if (!size) {
    throw new Error('Size field for imageOptions is required');
  }

  if (!quality) {
    throw new Error('Quality field for imageOptions is required');
  }

  prefix ?? (prefix = '');
  postfix ?? (postfix= `@${size}`);
  lossless ?? (lossless= false);

  const newFilename: string = `${prefix}${filename}${postfix}.${format}`;

  return new ImageInfo(format, newFilename, size, quality, lossless);

};

const checkAWSCredentials = ({ accessKeyId, bucket, secretAccessKey }: AWSConfig): boolean => {
  if (bucket && accessKeyId && secretAccessKey) {
    return true;
  }

  return false;
}

const uploadImage = (
  file: string | ImageInfo,
  readStream: any,
  bucket: string,
  s3: any
): void => {
  let pipeline: any;
  let writeStream: any;
  let promise: Promise<null>;

  if (file instanceof ImageInfo) {
    const { filename, transformStream } = file;
    [ writeStream, promise ] = uploadStream({ Bucket: bucket, Key: filename }, s3);
    pipeline = readStream.pipe(transformStream).pipe(writeStream);

    getPipelineMessage(filename, pipeline, promise);

  } else {
    [ writeStream, promise ] = uploadStream({ Bucket: bucket, Key: file }, s3);
    pipeline = readStream.pipe(writeStream);

    getPipelineMessage(file, pipeline, promise);
  }
}

const getPipelineMessage = (file: string, pipeline: any, promise: Promise<null>): void => {
  // pipeline doesn't catch error
  pipeline.on('finish', () => (`✅ File ${file} was resized by node stream`));

  // promise set connection to S3 and catches errors if it has.
  promise
    .then(() => console.log(`✅ File ${file} uploaded in the bucket`))
    .catch((error: Error) => console.log(`❌ File ${file} did't upload in the bucket.\n🛑 ${error.message}`));
}


const app = (pathToImages: string, options: Options, ouputPath: string = ''): void => {
  if (!pathToImages) {
    throw new Error('Path to images is required!');
  }

  // check path to images is exists
  if (!fs.existsSync(pathToImages)) {
    throw new Error('Path to images is not exists!');
  }

  const { awsConfig }: { awsConfig: AWSConfig } = options;

  if (!checkAWSCredentials(awsConfig)) {
    throw new Error('AWS credentials are not exist!');
  }

  AWS.config.update({
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey
  });

  const s3: any = new AWS.S3();

  const { imageOptions, useWebp }: { imageOptions: Array<ResizeOption>, useWebp: boolean } = options;
  if (!imageOptions.length) {
    throw new Error('Image options are not exist!');
  }

  // read path to images
  fs.readdir(pathToImages, (err: Error, files: Array<string>) => {
    if (err) {
      throw new Error(err.message);
    }

    if (files.length === 0) {
      throw new Error('There are no files in a path.');
    }

    for (let i = 0; i < files.length; i++) {
      const pathToImage: string = `${pathToImages}/${files[i]}`;
      const splitedFilename: Array<string> = files[i].split('.');
      const fileFormat: string | undefined = splitedFilename.pop();
      const filename: string = splitedFilename.join('.');

      if (!supportedFormats.has(fileFormat as string)) {
        console.log(`❌ ${filename} has not supported file format`);
        continue;
      }

      // create filenames
      const filenamesJpg: Array<ImageInfo> = imageOptions.map(createFileNameCallback(filename, 'jpg'));
      const filenamesWebp: Array<ImageInfo> = useWebp ? imageOptions.map(createFileNameCallback(filename, 'webp')) : [];

      const imagesInfo: Array<ImageInfo> = [...filenamesWebp, ...filenamesJpg];

      // create sharp transform streams
      imagesInfo.forEach(imageInfoObj => {
        const { format, size, quality, lossless } = imageInfoObj;

        if (format === 'jpg') {
          imageInfoObj.transformStream = sharp().resize(size).jpeg({ quality });
          return;
        }

        if (useWebp && format === 'webp') {
          imageInfoObj.transformStream = sharp().resize(size).webp({ quality, lossless });
          return;
        }
      });

      // pipe to S3 or to directory
      const readStream: any = fs.createReadStream(pathToImage, { highWaterMark: 4096 });
      // Upload transformed images
      imagesInfo.forEach(imageInfoObj => uploadImage(imageInfoObj, readStream, awsConfig.bucket, s3));
      // Upload origin image
      uploadImage(`${filename}.${fileFormat}`, readStream, awsConfig.bucket, s3);
    }
  });
}

module.exports = app;
