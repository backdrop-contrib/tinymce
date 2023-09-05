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
        if (node.nodeName == 'IMG') {
          api.setActive(true);
        }
        else {
          api.setActive(false);
        }
      });
      editor.on('dblclick', function (ev) {
        let node = editor.selection.getNode();
        if (node.nodeName == 'IMG') {
          backdropimageTools.backdropDialog(editor);
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
  let dialogUrl = editor.options.get('backdropimageDialogUrl');
  let dialogSettings = {dialogClass: 'editor-image-dialog'};
  let existingValues = backdropimageTools.existingValues(editor);

  let saveCallback = function(returnValues) {
    let image = backdropimageTools.buildImage(editor, returnValues);
    let selected = editor.selection.getNode();
    if (selected.nodeName == 'IMG') {
      let parentFigure = editor.dom.getParents(selected, 'FIGURE');
      let parentLink = editor.dom.getParents(selected, 'A');
      if (parentFigure.length) {
        parentFigure[0].remove();
      }
      else if (parentLink.length) {
        parentLink[0].remove();
      }
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

    let parentFigure = editor.dom.getParents(node, 'FIGURE');
    if (parentFigure.length) {
      existingValues['data-has-caption'] = 1;
      let parent = parentFigure[0];
      if (parent.hasAttribute('data-align')) {
        existingValues['data-align'] = parent.getAttribute('data-align');
      }
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

    let selected = editor.selection.getNode();
    let parentLink = editor.dom.getParents(selected, 'A');
    if (parentLink.length) {
      let link = parentLink[0].cloneNode(false);
      link.removeAttribute('data-mce-href');
      link.removeAttribute('data-mce-selected');
      link.appendChild(img);
      node.appendChild(link);
    }
    else {
      node.appendChild(img);
    }

    let captiontext = 'My caption';
    let parentFigure = editor.dom.getParents(selected, 'FIGURE');
    if (parentFigure.length) {
      let parent = parentFigure[0];
      for (let i = 0; i < parent.childNodes.length; i++) {
        if (parent.childNodes[i].nodeName == 'FIGCAPTION') {
          captiontext = parent.childNodes[i].textContent;
          break;
        }
      }
    }
    let figcaption = editor.dom.create('figcaption', {}, captiontext);
    node.appendChild(figcaption);
  }
  else {
    // @todo Switching from figure to image (uncheck caption setting) removes
    // link around image. Probably a bug in backdropimage plugin.
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
