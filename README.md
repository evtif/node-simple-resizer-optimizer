# Image simple resize

## How to use
- `npm install -D`
- add image files to a directory.
- import the package `const imgSimpleResizer = require('image-simple-resize')`
- `imgSimpleResizer` function takes 2 arguments:
  * __pathToImages: *string*__  use `path.join(__dirname, path_to_your_images)`
  * __options: *Options*__
    *   __awsConfig__: _AWSConfig_ {__bucket__: _string_; __accessKeyId__: _string_; __secretAccessKey__: _string_;}
    *   __imageSizes__: _ImageSizes_ {__thumbnail?__: _number_; __product?__: _number_; __origin?__: _number_;}
    *   __useWebp__: _boolean_ 
- see your optimized files in the AWS S3 bucket