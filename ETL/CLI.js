const readline = require('readline');

module.exports.prompt = function (prompt, secret) {
  function secretListener(chunk) {
    //carriage return
    if (chunk[0] === 13) return;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(prompt);
  }
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (secret) {
      process.stdin.on('data', secretListener);
    }

    rl.question(prompt, (output) => {
      rl.close();
      if (secret) {
        process.stdin.removeListener('data', secretListener);
      }
      resolve(output);
    });
  });
};

module.exports.log = function (silent, ...log) {
  if (!silent) {
    console.log(...log);
  }
};

const loadingSteps = [' ', '.', '-', '*', '#'];

module.exports.progress = function (silent, fileSize, bytesRead, lineNum, errorLines) {
  if (!silent) {
    const progressScale = 20;
    const progress = (bytesRead / fileSize) * progressScale;
    let loadingBar = '';
    for (let i = 1; i <= progressScale; i++) {
      if (i > Math.ceil(progress)) loadingBar += loadingSteps[0];
      else if (i < progress) loadingBar += loadingSteps[loadingSteps.length - 1];
      else loadingBar += loadingSteps[Math.floor((progress % 1) * (loadingSteps.length - 1)) + 1]
    }
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`progress: /${loadingBar}/ line number ${lineNum}, errors: ${errorLines}`);
  }
};
