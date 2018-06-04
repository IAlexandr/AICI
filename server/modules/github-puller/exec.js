import { exec } from 'child_process';
export const series = function(cmds, options, callback) {
  var execNext = function() {
    exec(cmds.shift(), options, function(error, stdout, stderr) {
      if (error) {
        callback(error, stdout, stderr);
      } else {
        if (cmds.length) execNext();
        else callback(null, stdout, stderr);
      }
    });
  };
  execNext();
};
