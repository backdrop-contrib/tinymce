/**
 * @file
 * Backdrop TinyMCE list properties plugin.
 */
(function () {
  'use strict';

  /**
   * Opens a TinyMCE dialog with a form.
   *
   * @param object editor
   *   TinyMCE instance.
   */
  const openDialog = function (editor) {
    let parentOl = getOlParent(editor.selection.getNode());
    if (!parentOl) {
      return;
    }
    editor.windowManager.open({
      title: 'List properties...',
      body: {
        type: 'panel',
        items: [
          {
            type: 'input',
            name: 'startnum',
            label: 'Start list at number',
            inputMode: 'numeric'
          },
          {
            type: 'checkbox',
            name: 'reverseorder',
            label: 'Reversed order'
          }
        ]
      },
      initialData: {
        startnum: editor.dom.getAttrib(parentOl, 'start', '1'),
        reverseorder: parentOl.hasAttribute('reversed')
      },
      buttons: [
        {
          type: 'cancel',
          name: 'cancel',
          text: 'Cancel'
        },
        {
          type: 'submit',
          name: 'save',
          text: 'Save',
          primary: true
        }
      ],
      onSubmit: function (api) {
        const data = api.getData();
        if (data.reverseorder) {
          parentOl.setAttribute('reversed', 'reversed');
        }
        else {
          parentOl.removeAttribute('reversed');
        }
        if (data.startnum > 1) {
          parentOl.setAttribute('start', data.startnum);
        }
        else {
          parentOl.removeAttribute('start');
        }
        api.close();
      }
    });
  };

  /**
   * Get the Dom parent OL if exists.
   *
   * @param HTMLElement node
   *
   * @return HTMLElement|false
   */
  const getOlParent = function (node) {
    const closestLi = node.closest('li');
    if (closestLi && closestLi.parentNode.nodeName === 'OL') {
      return closestLi.parentNode;
    }
    return false;
  };

  // Register plugin features.
  tinymce.PluginManager.add('backdroplistprop', function(editor, url) {
    editor.ui.registry.addMenuItem('backdroplistorder', {
      icon: 'ordered-list',
      text: 'List properties...',
      onAction: function () {
        openDialog(editor);
      }
    });

    editor.ui.registry.addContextMenu('backdroplistprops', {
      update: function (element) {
        if (getOlParent(element)) {
          return 'backdroplistorder';
        }
        return '';
      }
    });
  });

})();
