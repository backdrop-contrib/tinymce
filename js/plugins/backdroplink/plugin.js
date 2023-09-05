/**
 * @file
 * Backdrop TinyMCE link plugin.
 */
"use strict";

tinymce.PluginManager.add('backdroplink', function(editor, url) {
  /* Add a button that opens a dialog */
  editor.ui.registry.addToggleButton('backdroplink', {
    icon: 'link',
    tooltip: 'Insert/Edit Link',
    onAction: function () {
      backdroplinkTools.backdropDialog(editor);
    },
    onSetup: function (api) {
      api.setActive(false);
      editor.on('SelectionChange', function () {
        let node = editor.selection.getNode();
        if (node.nodeName == 'A') {
          api.setActive(true);
        }
        else {
          api.setActive(false);
        }
      });
    }
  });

  editor.ui.registry.addMenuItem('backdroplink', {
    icon: 'link',
    text: 'Link...',
    onAction: function () {
      backdroplinkTools.backdropDialog(editor);
    }
  });

  editor.ui.registry.addContextMenu('backdroplink', {
    update: function (element) {
      if (element.href || element.parentNode.href) {
        return 'backdroplink unlink';
      }
      return '';
    }
  });
});

// Just a wrapper...
let backdroplinkTools = {};

/**
 * Helper function.
 */
backdroplinkTools.backdropDialog = function (editor) {
  let dialogUrl = editor.options.get('linkDialogUrl');
  let dialogSettings = {dialogClass: 'editor-link-dialog'};
  let existingValues = backdroplinkTools.existingValues(editor);

  let saveCallback = function(returnValues) {
    let link = backdroplinkTools.buildLink(editor, returnValues);
    if (typeof existingValues.href == 'undefined') {
      editor.execCommand('mceInsertContent', false, link);
    }
    else {
      editor.execCommand('mceReplaceContent', false, link);
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
 *  To feed into the backdrop link dialog form.
 */
backdroplinkTools.existingValues = function (editor) {
  let node = editor.selection.getNode();
  let existingValues = {};

  // This image is already wrapped in a link.
  if (node.nodeName == 'IMG' && node.parentNode.nodeName == 'A') {
    node = node.parentNode;
  }

  if (node.nodeName == 'A') {
    // Expand selection to whole anchor to prevent inserting a link into a link.
    editor.selection.select(node);
    if (node.textContent) {
      existingValues.text = node.textContent;
    }

    let attribs = node.getAttributeNames();
    for (let i = 0; i < attribs.length; i++) {
      let name = attribs[i];
      if (name.startsWith('data-mce')) {
        continue;
      }
      existingValues[name] = node.attributes[name]['value'];
    }
  }
  else if (node.nodeName != 'IMG') {
    let content = editor.selection.getContent({ format: 'text' });
    existingValues = {
      text: content
    };
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
backdroplinkTools.buildLink = function (editor, returnValues) {
  let textContent = '';
  let values = returnValues.attributes;

  let a = editor.dom.create('a');
  for (let key in values) {
    if (key == 'text') {
      textContent = values[key];
      continue;
    }
    if (key == 'data-file-id' && !values[key]) {
      continue;
    }
    a.setAttribute(key, values[key]);
  }

  let node = editor.selection.getNode();
  if (node.nodeName == 'IMG') {
    a.appendChild(node);
  }
  else if (node.nodeName == 'A' && node.childNodes.length) {
    for (let i = 0; i < node.childNodes.length; i++) {
      let clone = node.childNodes[i].cloneNode(true);
      a.appendChild(clone);
    }
  }
  else {
    if (!textContent.length) {
      textContent = a.getAttribute('href');
    }
    a.textContent = textContent;
  }

  return a.outerHTML;
}
