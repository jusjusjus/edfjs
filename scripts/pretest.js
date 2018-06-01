
var fs = require('fs');
var download = function (url, filename=null) {
  // download 'sample.edf' to test the edf reader
  var https = require('https');
  if (filename == null) {
    filename = url;
  }
  var file = fs.createWriteStream(filename);
  var request = https.get(url, function(response) {
    response.pipe(file);
  });
}
var url = "https://cdn.rawgit.com/jusjusjus/pyedf/82d67855/example/sample.edf";
// filename here and in ./test/* has to be identical!
var dir = './tmp';
var filename = dir+"/sample.edf";
if (!fs.existsSync(filename)) {
  try {
    fs.mkdirSync(dir);
  } catch (err) {
    if (err.code !== 'EEXIST') { throw err; }
  }
  console.log("Downloading "+url+". This may take a minute..");
  download(url, filename);
}
