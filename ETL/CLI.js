import readline from 'readline';

export default function (printout) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(printout, (output) => {
      rl.close();
      resolve(output);
    });
  })
}
