const rawArgs = process.argv;

/**
 * Parse command line arguments from node, setting defaults and throwing errors where it can.
 * @param {array} bareArgs Bare arguments, assigned in order
 * @param {array} flags Flag arguments, defaulting to false.
 * @param {object} namedVals Arguments expecting a value to follow, where key is the name and val is the default.
 * @returns an object with a list of arguments, and a namedArgs object containing argument name: value pairs
 */
export default function parseArgs(bareArgs = [], flags = [], namedVals = {}) {
  const args = {};
  let bareArgIndex = 0;
  //assign defaults
  Object.assign(args, namedVals);
  flags.forEach((flag) => (args[flag] = false));

  for (let i = 2; i < rawArgs.length; i++) {
    let arg = rawArgs[i];
    if (arg.startsWith('-')) {
      arg = arg.substring(1);
      if (flags.some((flag) => flag === arg)) {
        args[arg] = true;
      } else if (namedVals[arg] !== undefined) {
        const argVal = rawArgs[i + 1];
        if (argVal === undefined || argVal.startsWith('-')) {
          throw errorColored(`margument "${arg}" expects a value`);
        }
        i += 1;
        args[arg] = argVal;
      } else {
        throw errorColored(`unexpected argument ${arg}`);
      }
    } else {
      if (bareArgIndex === bareArgs.length) {
        throw errorColored(`unexpected extra argument "${arg}"`);
      }
      args[bareArgs[bareArgIndex]] = arg;
      bareArgIndex++;
    }
  }

  if (bareArgIndex < bareArgs.length) {
    throw errorColored(`expected ${bareArgs.length} arguments`)
  }

  return args;
}

function errorColored(str) {
  return new Error(`\x1b[31m${str}\x1b[0m`);
}
