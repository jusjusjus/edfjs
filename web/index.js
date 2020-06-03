
const edfjs = require("../src/index.js");

var edf = null;
async function read_file() {
  var files = document.getElementById("fileSelector").files;
  if (files.length > 0) {
    edf = await edfjs.EDF().from_file(files[0], header_only=false);
    show_data();
  }
}

async function show_data() {
  var txt = "File Header<br>";
  for (var key in edf.fields) {
    txt += key + " " + edf[key] + "<br>";
  }
  var label = edf.channels[0].label;
  var num_samples = 16;
  txt += "Here a "+num_samples+" samples of channel "+label+" <br>";
  var data = await edf.get_physical_samples(0.0, null, [label], num_samples);
  for (var d in data[label]) {
    txt += d+" "+data[label][d]+"<br>";
  }
  document.getElementById("content").innerHTML = txt;
}

const edf_input = document.getElementById("fileSelector");
edf_input.addEventListener("change", read_file);
