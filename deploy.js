const Storage = require('@google-cloud/storage');

const projectId = 'thirtysevenx-production';
const bucketName = 'static.37x.com';

const filename = process.env.file;
const destination = process.env.destination ? process.env.destination : filename;
const predefinedAcl = 'publicRead';

const storage = new Storage({
  projectId
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
