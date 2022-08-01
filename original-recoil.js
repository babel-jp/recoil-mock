// Intermediate CJS file to load the original recoil library

const recoilPath = require.resolve("recoil");
module.exports = require(recoilPath);
