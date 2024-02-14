var exec = require('child_process').exec;
var os = require('os');

const baseCommand = `./node_modules/.bin/rn-nodeify --install buffer,events,process,stream,util,inherits,fs,path,assert,crypto --hack`;

function postInstallMac() {
	exec(`${baseCommand} && cd ios && NO_FLIPPER=1 pod install && cd ..`);
}
function postInstallLinWin() {
	exec(baseCommand);
}

if (os.type() === 'Darwin') {
	postInstallMac();
} else {
	postInstallLinWin();
}
