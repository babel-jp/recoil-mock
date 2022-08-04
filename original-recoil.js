const path = require("path");
const fs = require("fs");

// Intermediate CJS file to load the original recoil library.

if (fs.existsSync(path.join(__dirname, "node_modules/recoil"))) {
  module.exports = require(path.join(__dirname, "node_modules/recoil"));
} else {
  // Currently this assumes that this module and the recoil library are in the same directory.
  const recoilPath = path.join(__dirname, "../recoil");
  module.exports = require(recoilPath);
}
