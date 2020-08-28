require('dotenv').config();
const path = require('path');
const imgSimpleResizer = require('./index');
const { S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;

const awsConfig = {
    bucket: S3_BUCKET,
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
}

const useWebp = true;
const imageOptions = [
    {
        size: 80,
        quality: 80,
        lossless: false,
    },
    {
        size: 400,
        quality: 80,
        lossless: false,
    },
    {
        size: 750,
        quality: 100,
        lossless: true,
    }
];

imgSimpleResizer(path.join(__dirname, './images'), { awsConfig, imageOptions, useWebp });
