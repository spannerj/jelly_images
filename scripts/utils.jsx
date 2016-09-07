//return true if item passed is a folder otherwise false
function onlyFolders(f) {
  if (f.constructor.name == "File") {
    return false;
  } else {
    return true;
  }
} 


//random number generator. Pass in the number of chars required. Can also pass additional char set
function randomString(len, charSet) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
    	var randomPoz = Math.floor(Math.random() * charSet.length);
    	randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return randomString;
}