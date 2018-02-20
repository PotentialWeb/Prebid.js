const Storage = require('@google-cloud/storage');

const projectId = 'thirtysevenx-production';
const bucketName = 'static.37x.com';
const filename = './build/dist/prebid.js';
const keyFilename = './.gcloud/keys/bucket-writer.service-account.json';

const storage = new Storage({
  projectId, keyFilename
});

storage
  .bucket(bucketName)
  .upload(filename)
  .then((results) => {
    console.log(`${filename} uploaded to ${bucketName}.`);
  })
  .catch((err) => {
    console.error('ERROR:', err);
  });
