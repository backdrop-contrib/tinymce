/**
 * @file
 * Backdrop TinyMCE image plugin.
 */
"use strict";

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
let backdropimageTools = {};

/**
 * Helper function.
 */
backdropimageTools.backdropDialog = function (editor) {
  let dialogUrl = editor.options.get('imageDialogUrl');
  let dialogSettings = {dialogClass: 'editor-image-dialog'};
  let existingValues = backdropimageTools.existingValues(editor);

  let saveCallback = function(returnValues) {
    let image = backdropimageTools.buildImage(editor, returnValues);
    let selected = editor.selection.getNode();
    // This has been a nested figure tag, but now becomes an img tag.
    if (selected.nodeName == 'IMG' && selected.parentNode && selected.parentNode.nodeName == 'FIGURE') {
      selected.parentNode.remove();
    }
    editor.execCommand('mceInsertContent', false, image);
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
  if (node.parentNode && node.parentNode.nodeName == 'FIGURE') {
    let parent = node.parentNode;
    existingValues['data-has-caption'] = 1;
    if (parent.hasAttribute('data-align')) {
      existingValues['data-align'] = parent.getAttribute('data-align');
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
  // @todo width/height... where?
  let node;

  if (values['data-has-caption']) {
    node = editor.dom.create('figure');
    if (values['data-align']) {
      node.setAttribute('data-align', values['data-align']);
    }
    let img = editor.dom.create('img');
    for (let key in values) {
      if (key == 'data-has-caption' || key == 'data-align') {
        continue;
      }
      if (key == 'data-file-id' && !values[key]) {
        continue;
      }
      img.setAttribute(key, values[key]);
    }
    node.appendChild(img);

    let captiontext = 'My caption';
    let selected = editor.selection.getNode();
    if (selected.parentNode && selected.parentNode.nodeName == 'FIGURE') {
      let parent = selected.parentNode;
      if (parent.lastChild && parent.lastChild.nodeName == 'FIGCAPTION') {
        captiontext = parent.lastChild.textContent;
      }
    }
    let figcaption = editor.dom.create('figcaption', {}, captiontext);
    node.appendChild(figcaption);
  }
  else {
    node = editor.dom.create('img');
    for (let key in values) {
      if (key == 'data-has-caption') {
        continue;
      }
      if (key == 'data-file-id' && !values[key]) {
        continue;
      }
      node.setAttribute(key, values[key]);
    }
  }

  return node.outerHTML;
}
