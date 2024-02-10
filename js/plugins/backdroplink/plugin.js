/**
 * @file
 * Backdrop TinyMCE link plugin.
 */
(function () {

  'use strict';

  /**
   * Opens a Backdrop dialog.
   *
   * @param object editor
   *   TinyMCE editor instance.
   */
  const backdropDialog = function (editor) {
    let dialogUrl = editor.options.get('backdroplinkDialogUrl');
    let dialogSettings = {dialogClass: 'editor-link-dialog'};
    let existingValues = getExistingValues(editor);

    let saveCallback = function(returnValues) {
      let link = buildLink(editor, returnValues);
      if (typeof existingValues.href === 'undefined') {
        editor.execCommand('mceInsertContent', false, link);
      }
      else {
        editor.execCommand('mceReplaceContent', false, link);
      }
    };

    Backdrop.tinymce.openDialog(editor, dialogUrl, existingValues, saveCallback, dialogSettings);
  };

  /**
   * @param object editor
   *   TinyMCE editor instance.
   *
   * @return object
   *  To feed into the backdrop link dialog form.
   */
  const getExistingValues = function (editor) {
    let node = editor.selection.getNode();
    let existingValues = {};

    // This image is already wrapped in a link.
    if (node.nodeName === 'IMG' && node.parentNode.nodeName === 'A') {
      node = node.parentNode;
    }

    if (node.nodeName === 'A') {
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
        existingValues[name] = node.attributes[name].value;
      }
    }
    else if (node.nodeName !== 'IMG') {
      let content = editor.selection.getContent({ format: 'text' });
      existingValues = {
        text: content
      };
    }

    return existingValues;
  };

  /**
   * Builds link markup.
   *
   * @param object editor
   *   TinyMCE editor instance.
   * @param object returnValues
   *   Values returned from backdrop dialog.
   *
   * @return string
   */
  const buildLink = function (editor, returnValues) {
    let textContent = '';
    let values = returnValues.attributes;

    let a = editor.dom.create('a');
    for (let key in values) {
      if (key === 'text') {
        textContent = values[key];
        continue;
      }
      if (key === 'data-file-id' && !values[key]) {
        continue;
      }
      a.setAttribute(key, values[key]);
    }

    let node = editor.selection.getNode();
    if (node.nodeName === 'IMG') {
      let clone = node.cloneNode(true);
      clone.removeAttribute('data-mce-src');
      a.appendChild(clone);
    }
    else if (node.nodeName === 'A' && node.childNodes.length) {
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

    if (!values.href) {
      return a.innerHTML;
    }
    return a.outerHTML;
  };

  // Register plugin features.
  tinymce.PluginManager.add('backdroplink', function(editor, url) {
    editor.ui.registry.addToggleButton('backdroplink', {
      icon: 'link',
      tooltip: 'Insert/Edit Link',
      onAction: function () {
        backdropDialog(editor);
      },
      onSetup: function (api) {
        api.setActive(false);
        editor.on('SelectionChange', function () {
          let node = editor.selection.getNode();
          // The anchor plugin marks its links as not editable.
          if (node.nodeName === 'A' && node.isContentEditable) {
            api.setActive(true);
          }
          else {
            api.setActive(false);
          }
        });
      }
    });
    editor.ui.registry.addButton('backdropunlink', {
      icon: 'unlink',
      tooltip: 'Remove link',
      onAction: function () {
        editor.execCommand('unlink');
      },
      onSetup: function (api) {
        api.setEnabled(false);
        editor.on('SelectionChange', function () {
          let node = editor.selection.getNode();
          if (node.nodeName === 'A' || node.parentNode.nodeName === 'A') {
            api.setEnabled(true);
          }
          else {
            api.setEnabled(false);
          }
        });
      }
    });

    editor.ui.registry.addMenuItem('backdroplink', {
      icon: 'link',
      text: 'Link...',
      onAction: function () {
        backdropDialog(editor);
      }
    });
    editor.ui.registry.addMenuItem('backdropunlink', {
      icon: 'unlink',
      text: 'Remove link',
      onAction: function () {
        editor.execCommand('unlink');
      }
    });

    editor.ui.registry.addContextMenu('backdroplink', {
      update: function (element) {
        if (element.href || element.parentNode.href) {
          return 'backdroplink backdropunlink';
        }
        return '';
      }
    });
  });

})();
