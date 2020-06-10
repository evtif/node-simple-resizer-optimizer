const fs = require('fs');
const stream = require('stream');
const sharp = require('sharp');
const AWS = require('aws-sdk');
const supportedFormats = ['jpeg', 'png', 'jpg', 'webp', 'tiff', 'gif', 'svg'];
const defaultImageSizes = {
    thumbnail: 80,
    product: 400,
    origin: 750
};
const uploadStream = ({ Bucket, Key }, s3) => {
    const pass = new stream.PassThrough();
    return {
        writeStream: pass,
        promise: s3.upload({ Bucket, Key, Body: pass }).promise(),
    };
};
const createFileNames = (imageSizes, filename, format) => (prefix) => ({
    prefix,
    format,
    filename: `${prefix}_${filename}.${format}`,
    resize: imageSizes[prefix],
});
const checkAwsCredentials = ({ accessKeyId, bucket, secretAccessKey }) => {
    if (bucket && accessKeyId && secretAccessKey) {
        return true;
    }
    return false;
};
const app = (pathToImages, options = { useWebp: true }, ouputPath = '') => {
    if (!pathToImages) {
        throw new Error('Path to images is required!');
    }
    // check path to images is exists
    if (!fs.existsSync(pathToImages)) {
        throw new Error('Path to images is not exists!');
    }
    if (!checkAwsCredentials(options.awsConfig)) {
        throw new Error('AWS credentials are not exist!');
    }
    const imageSizePrefixes = options.imageSizes && Object.keys(options.imageSizes);
    // check imageSizes options
    if (imageSizePrefixes && imageSizePrefixes.length) {
        imageSizePrefixes.forEach(prefix => {
            if (!defaultImageSizes[prefix]) {
                throw new Error(`This option (${prefix}) is not permitted.`);
            }
        });
    }
    AWS.config.update({
        accessKeyId: options.awsConfig.accessKeyId,
        secretAccessKey: options.awsConfig.secretAccessKey
    });
    const s3 = new AWS.S3();
    // read path to images
    fs.readdir(pathToImages, (err, files) => {
        if (err) {
            throw new Error(err.message);
        }
        if (files.length === 0) {
            throw new Error('There are no files in a path.');
        }
        for (let i = 0; i < files.length; i++) {
            const pathToImage = `${pathToImages}/${files[i]}`;
            const splitedFilename = files[i].split('.');
            const fileFormat = splitedFilename.splice(-1, 1);
            if (!fileFormat[0] || !supportedFormats.includes(fileFormat[0])) {
                continue;
            }
            const filename = splitedFilename.join('.');
            let filenamesJpg;
            let filenamesWebp;
            // create filenames
            if (imageSizePrefixes.length) {
                filenamesJpg = imageSizePrefixes.map(createFileNames(options.imageSizes, filename, 'jpg'));
                filenamesWebp = options.useWebp ? imageSizePrefixes.map(createFileNames(options.imageSizes, filename, 'webp')) : [];
            }
            else {
                const defaultImageSizePrefixes = Object.keys(defaultImageSizes);
                filenamesJpg = defaultImageSizePrefixes.map(createFileNames(defaultImageSizes, filename, 'jpg'));
                filenamesWebp = options.useWebp ? defaultImageSizePrefixes.map(createFileNames(defaultImageSizes, filename, 'webp')) : [];
            }
            const imagesInfo = [...filenamesWebp, ...filenamesJpg];
            // create sharp transforms
            imagesInfo.forEach(imageInfoObj => {
                if (imageInfoObj.format === 'jpg') {
                    imageInfoObj.transformStream = sharp().resize(imageInfoObj.resize).jpeg();
                    return;
                }
                if (options.useWebp && imageInfoObj.format === 'webp') {
                    imageInfoObj.transformStream = sharp().resize(imageInfoObj.resize).webp();
                    return;
                }
            });
            // pipe to S3 or to directory
            const readStream = fs.createReadStream(pathToImage, { highWaterMark: 4096 });
            imagesInfo.forEach(imageInfoObj => {
                const { writeStream, promise } = uploadStream({ Bucket: options.awsConfig.bucket, Key: imageInfoObj.filename }, s3);
                const pipeline = readStream.pipe(imageInfoObj.transformStream).pipe(writeStream);
                pipeline.on('finish', () => console.log('✅', imageInfoObj.filename));
            });
        }
    });
};
module.exports = app;
