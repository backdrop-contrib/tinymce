/**
 * @file
 * Custom jshint reporter compatible with GitHub Actions.
 */
(function () {
  "use strict";

  module.exports = {
    reporter: function (res) {
      let len = res.length;
      let str = "";

      res.forEach(function (r) {
        let file = r.file;
        let err = r.error;

        str += '::error file=' + file + ',line=' + err.line + ',col=' + err.character + '::' + err.reason + "\n";
      });

      if (str) {
        process.stdout.write(str + "\n" + len + " error" +
          ((len === 1) ? "" : "s") + "\n");
      }
    }
  };
})();
