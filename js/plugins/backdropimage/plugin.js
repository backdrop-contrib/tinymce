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
      editor.on('UpdateImageMetadata', function (ev) {
        // The src gets a timestamp attached, so we search by "begins with" (^).
        let imgDomnode = editor.getBody().querySelector('[src^="' + ev.data.src + '"]');
        if (imgDomnode) {
          imgDomnode.setAttribute('width', ev.data.width);
          imgDomnode.setAttribute('height', ev.data.height);
          imgDomnode.setAttribute('data-file-id', ev.data.fileId);
        }
      });
      // Parser fires when the editor initializes, or the code plugin submits.
      editor.parser.addAttributeFilter('data-caption', function (nodes) {
        for (let i = 0; i < nodes.length; i++) {
          // These "node" are AstNode, not dom node.
          // @see https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.html.node/#Node
          let link;
          if (nodes[i].parent.name == 'a') {
            link = nodes[i].parent.clone();
            nodes[i].parent.unwrap();
          }
          if (nodes[i].parent.name == 'p') {
            nodes[i].parent.unwrap();
          }
          let img = nodes[i].clone();
          let caption = backdropimageTools.attributeToCaption(img.attr('data-caption'));
          let fig = new tinymce.html.Node('figure', 1);
          if (img.attr('data-align')) {
            fig.attr('class', 'align-' + img.attr('data-align'));
          }
          if (link) {
            link.append(img);
            fig.append(link);
          }
          else {
            fig.append(img);
          }
          fig.append(caption);
          img.attr('data-caption', null);

          nodes[i].replace(fig);
        }
      });
      // Serializer fires when saving, opening with code plugin, or switching
      // filter formatting options.
      editor.serializer.addNodeFilter('figure', function (nodes) {
        for (let i = 0; i < nodes.length; i++) {
          let childImgs = nodes[i].getAll('img');
          if (!childImgs.length) {
            nodes[i].remove();
            continue;
          }
          let img = childImgs[0].clone();
          let captions = nodes[i].getAll('figcaption');
          if (captions.length) {
            let captionContent = captions[0].children();
            let content = backdropimageTools.captionAstNodeToString(editor, captionContent);
            img.attr('data-caption', content);
          }
          // Also cleanup internal attributes.
          img.attr('data-mce-src', null);
          img.attr('data-mce-selected', null);
          // To p or not to p - tiny wraps it, anyway, but filter module doesn't handle well.
          let p = new tinymce.html.Node('p', 1);
          if (nodes[i].attr('data-align')) {
            img.attr('data-align', nodes[i].attr('data-align'));
          }
          nodes[i].wrap(p);

          let link;
          let childLinks = nodes[i].getAll('a');
          if (childLinks.length) {
            link = childLinks[0].clone();
            link.attr('data-mce-href', null);
            link.attr('data-mce-selected', null);
            link.append(img);
            nodes[i].replace(link);
          }
          else {
            nodes[i].replace(img);
          }
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
    if (!returnValues.attributes.width && !returnValues.attributes.height) {
      let src = returnValues.attributes.src;
      let imgDomnode = editor.getBody().querySelector('[src="' + src + '"]');
      let imgToSize = new Image();
      imgToSize.onload = function() {
        imgDomnode.setAttribute('width', this.width);
        imgDomnode.setAttribute('height', this.height);
      }
      imgToSize.src = src;
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
  let node, link;
  let selected = editor.selection.getNode();
  let parentLink = editor.dom.getParents(selected, 'A');
  if (parentLink.length) {
    link = parentLink[0].cloneNode(false);
    link.removeAttribute('data-mce-href');
    link.removeAttribute('data-mce-selected');
  }

  if (values['data-has-caption']) {
    let figAttrib = {};
    if (returnValues.attributes['data-align']) {
      figAttrib['class'] = 'align-' + returnValues.attributes['data-align'];
    }
    node = editor.dom.create('figure', figAttrib);
    let img = editor.dom.create('img');
    for (let key in values) {
      if (key == 'data-has-caption') {
        continue;
      }
      if (key == 'data-file-id' && !values[key]) {
        continue;
      }
      img.setAttribute(key, values[key]);
    }

    if (link) {
      link.appendChild(img);
      node.appendChild(link);
    }
    else {
      node.appendChild(img);
    }

    let captiontext = 'My caption';// @todo configurable?
    let parentFigure = editor.dom.getParents(selected, 'FIGURE');
    if (parentFigure.length) {
      let parent = parentFigure[0];
      for (let i = 0; i < parent.childNodes.length; i++) {
        if (parent.childNodes[i].nodeName == 'FIGCAPTION') {
          captiontext = parent.childNodes[i].innerHTML;
          break;
        }
      }
    }
    let figcaption = editor.dom.create('figcaption', {}, captiontext);
    node.appendChild(figcaption);
  }
  else {
    let img = editor.dom.create('img');
    for (let key in values) {
      if (key == 'data-has-caption') {
        continue;
      }
      if (key == 'data-file-id' && !values[key]) {
        continue;
      }
      img.setAttribute(key, values[key]);
    }
    if (link) {
      link.appendChild(img);
      node = link;
    }
    else {
      node = img;
    }
  }
  return node.outerHTML;
}

/**
 * Helper function to parse an array of AstNodes into a string.
 *
 * @param object editor
 * @param array captionContent
 *
 * @return string
 */
backdropimageTools.captionAstNodeToString = function (editor, captionContent) {
  let content = '';
  if (!captionContent.length) {
    return content;
  }
  let allowedTags = ['a', 'em', 'strong'];
  let dummy = editor.dom.create('figcaption');

  for (let i = 0; i < captionContent.length; i++) {
    if (captionContent[i].type == 3) {
      dummy.append(document.createTextNode(captionContent[i].value));
    }
    else if (captionContent[i].type == 1) {
      if (allowedTags.includes(captionContent[i].name)) {
        dummy.append(editor.dom.create(captionContent[i].name, {}, captionContent[i].firstChild.value));
      }
    }
  }
  return dummy.innerHTML;
}

/**
 * Helper function to turn an attribute string into an AstNode instance.
 *
 * @param string attrContent
 *
 * @return object
 */
backdropimageTools.attributeToCaption = function (attrContent) {
  let allowedTags = ['A', 'EM', 'STRONG'];
  let caption = new tinymce.html.Node('figcaption', 1);
  let domNode = document.createElement('figcaption');
  domNode.innerHTML = attrContent;

  for (let i = 0; i < domNode.childNodes.length; i++) {
    let n = domNode.childNodes[i];
    if (n.nodeName == '#text') {
      let text = new tinymce.html.Node('#text', 3);
      text.value = n.textContent;
      caption.append(text);
    }
    else if (allowedTags.includes(n.nodeName)) {
      let tag = n.nodeName.toLowerCase();
      let node = new tinymce.html.Node(tag, 1);
      let text = new tinymce.html.Node('#text', 3);
      text.value = n.innerText;
      node.append(text);
      caption.append(node);
    }
  }
  return caption;
}
