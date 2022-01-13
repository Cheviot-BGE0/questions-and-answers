import readline from 'readline';


export default function (prompt, secret) {
  function secretListener(chunk) {
    process.stdout.clearLine()
    process.stdout.cursorTo(0)
    process.stdout.write(prompt)
  }
  return new Promise((resolve, reject) => {
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
        process.stdin.removeListener('data', secretListener)
      }
      resolve(output);
    });
  })
}
