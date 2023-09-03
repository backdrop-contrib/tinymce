/**
 * @file
 * Backdrop TinyMCE image plugin.
 */
tinymce.PluginManager.add('backdropimage', function(editor, url) {
  editor.ui.registry.addToggleButton('backdropimage', {
    icon: 'image',
    tooltip: 'Insert/Edit Image',
    onAction: function () {
      backdropimageTools.backdropDialog(editor);
    },
    onSetup: function (api) {
      api.setActive(false);
      editor.on('SelectionChange', function () {
        let node = editor.selection.getNode();
        // @todo <figure> tags (nested)
        if (node.nodeName == 'IMG') {
          api.setActive(true);
        }
        else {
          api.setActive(false);
        }
      });
    }
  });

  editor.ui.registry.addMenuItem('backdropimage', {
    icon: 'image',
    text: 'Image...',
    onAction: function () {
      backdropimageTools.backdropDialog(editor);
    }
  });

  editor.ui.registry.addContextMenu('backdropimage', {
    update: function (element) {
      if (element.src) {
        return 'backdropimage';
      }
      return '';
    }
  });
});

// Just a wrapper...
backdropimageTools = {};

/**
 * Helper function.
 */
backdropimageTools.backdropDialog = function (editor) {
  let dialogUrl = editor.options.get('imageDialogUrl');
  let dialogSettings = {dialogClass: 'editor-image-dialog'};
  let existingValues = backdropimageTools.existingValues(editor);

  let saveCallback = function(returnValues) {
    let image = backdropimageTools.buildImage(editor, returnValues);
    if (typeof existingValues.href == 'undefined') {
      editor.execCommand('mceInsertContent', false, image);
    }
    else {
      editor.execCommand('mceReplaceContent', false, image);
    }
  };

  Backdrop.tinymce.openDialog(editor, dialogUrl, existingValues, saveCallback, dialogSettings);
}

/**
 * Helper function.
 *
 * @param object editor
 *   TinyMCE editor instance.
 *
 * @return object
 *  To feed into the backdrop image dialog form.
 */
backdropimageTools.existingValues = function (editor) {
  let node = editor.selection.getNode();
  let existingValues = {};
/*
  if (node.nodeName == 'IMG' && node.parentNode.nodeName == 'A') {
    node = node.parentNode;
  }
*/
  if (node.nodeName == 'IMG') {
    let attribs = node.getAttributeNames();
    for (let i = 0; i < attribs.length; i++) {
      let name = attribs[i];
      if (name.startsWith('data-mce')) {
        continue;
      }
      existingValues[name] = node.attributes[name]['value'];
    }
  }

  return existingValues;
}

/**
 * Helper function.
 *
 * @param object editor
 *   TinyMCE editor instance.
 * @param object returnValues
 *   Values returned from backdrop dialog.
 *
 * @return string
 */
backdropimageTools.buildImage = function (editor, returnValues) {
  let values = returnValues.attributes;

  let img = editor.dom.create('img');
  for (let key in values) {
    if (key == 'data-file-id' && !values[key]) {
      continue;
    }
    img.setAttribute(key, values[key]);
  }

  return img.outerHTML;
}
