const Storage = require('@google-cloud/storage');

const projectId = 'thirtysevenx-production';
const bucketName = 'static.37x.com';
const keyFilename = './.gcloud/keys/bucket-writer.service-account.json';

const filename = process.env.file;
const destination = process.env.destination ? process.env.destination : filename;
const predefinedAcl = 'publicRead';

const storage = new Storage({
  projectId, keyFilename
});

storage
  .bucket(bucketName)
  .upload(filename, { destination, predefinedAcl })
  .then(() => {
    console.log(`${filename} uploaded to ${bucketName}.`);
  })
  .catch((err) => {
    console.error('ERROR:', err);
  });
