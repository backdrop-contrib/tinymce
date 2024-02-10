/**
 * @file
 * TinyMCE List style plugin.
 */
(function () {

  'use strict';

  tinymce.PluginManager.add('liststyle', function(editor, url) {
    editor.on('PreInit', function () {
      editor.parser.addAttributeFilter('data-list-style', function (nodes) {
        for (let i = 0; i < nodes.length; i++) {
          let attrValue = nodes[i].attr('data-list-style');
          let otherStyles = nodes[i].attr('style');
          let listStyle = 'list-style-type: ' + attrValue + ';';
          if (typeof otherStyles === 'undefined') {
            nodes[i].attr('style', listStyle);
          }
          else {
            nodes[i].attr('style', listStyle + otherStyles);
          }
          nodes[i].attr('data-list-style', null);
        }
      });
      editor.serializer.addAttributeFilter('style', function (nodes) {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].name !== 'ul' && nodes[i].name !== 'ol') {
            continue;
          }
          let styles = nodes[i].attr('style');
          let stylesArr = styles.split(';');
          let remainder = '';
          for (let n = 0; n < stylesArr.length; n++) {
            if (!stylesArr[n]) {
              continue;
            }
            let keyVal = stylesArr[n].split(':');
            if (keyVal[0].trim() === 'list-style-type') {
              nodes[i].attr('data-list-style', keyVal[1].trim());
            }
            else {
              remainder += stylesArr[n] + ';';
            }
          }
          if (remainder) {
            nodes[i].attr('style', remainder.trim());
          }
          else {
            nodes[i].attr('style', null);
          }
        }
      });
    });
  });

})();
