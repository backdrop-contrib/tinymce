/**
 * @file
 * Backdrop TinyMCE list properties plugin.
 */
'use strict';

tinymce.PluginManager.add('backdroplistprop', function(editor, url) {
  editor.ui.registry.addMenuItem('backdroplistorder', {
    icon: 'sorting',
    text: 'List order',
    onAction: function () {
      backdropListProp.openDialog(editor);
    }
  });

  // Glue contextmenu that uses the listprops menu item from lists plugin and
  // adds the sorting/ordering functionality not provided by TinyMCE.
  editor.ui.registry.addContextMenu('backdroplistprops', {
    update: function (element) {
      if (backdropListProp.getOlParent(element)) {
        return 'backdroplistorder listprops';
      }
      return '';
    }
  });
});

const backdropListProp = {};

/**
 * @param object editor
 *   TinyMCE instance.
 */
backdropListProp.openDialog = function (editor) {
  let parentOl = backdropListProp.getOlParent(editor.selection.getNode());
  if (!parentOl) {
    return;
  }
  editor.windowManager.open({
    title: 'List ordering',
    body: {
      type: 'panel',
      items: [{
          type: 'checkbox',
          name: 'reverseorder',
          label: 'Reversed order'
        }]
    },
    initialData: {
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
      api.close();
    }
  });
}

/**
 * Get the Dom parent OL if exists.
 *
 * @param HTMLElement node
 *
 * @return HTMLElement|false
 */
backdropListProp.getOlParent = function (node) {
  const closestLi = node.closest('li');
  if (closestLi && closestLi.parentNode.nodeName == 'OL') {
    return closestLi.parentNode;
  }
  return false;
}
