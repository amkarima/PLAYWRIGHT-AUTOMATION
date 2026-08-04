const decompress = require("decompress");

decompress("ms-playwright.zip", "browser")
  .then((files) => {
    console.log(files);
  })
  .catch((error) => {
    console.log(error);
  });