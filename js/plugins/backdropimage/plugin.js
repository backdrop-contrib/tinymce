/**
 * @file
 * Backdrop TinyMCE image plugin.
 */
(function () {
  'use strict';

  /**
   * @param object editor
   *   TinyMCE editor instance.
   *
   * @return object
   *  To feed into the backdrop image dialog form.
   */
  const getExistingValues = function (editor) {
    let node = editor.selection.getNode();
    let existingValues = {};

    if (node.nodeName === 'IMG') {
      let attribs = node.getAttributeNames();
      for (let i = 0; i < attribs.length; i++) {
        let name = attribs[i];
        if (name.startsWith('data-mce')) {
          continue;
        }
        existingValues[name] = node.attributes[name].value;
      }
      let parentFigure = editor.dom.getParents(node, 'FIGURE');
      if (parentFigure.length) {
        existingValues['data-has-caption'] = 1;
      }
    }

    return existingValues;
  };

  /**
   * Builds the image markup.
   *
   * @param object editor
   *   TinyMCE editor instance.
   * @param object returnValues
   *   Values returned from backdrop dialog.
   *
   * @return string
   */
  const buildImage = function (editor, returnValues) {
    let values = returnValues.attributes;
    // Do not insert an empty img tag.
    if (!values.src) {
      return '';
    }
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
        if (key === 'data-has-caption') {
          continue;
        }
        if (key === 'data-file-id' && !values[key]) {
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

      let captiontext = editor.options.get('backdropimageInitialCaption');
      let parentFigure = editor.dom.getParents(selected, 'FIGURE');
      if (parentFigure.length) {
        let parent = parentFigure[0];
        for (let i = 0; i < parent.childNodes.length; i++) {
          if (parent.childNodes[i].nodeName === 'FIGCAPTION') {
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
        if (key === 'data-has-caption') {
          continue;
        }
        if (key === 'data-file-id' && !values[key]) {
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
  };

  /**
   * Opens a Backdrop dialog.
   */
  const backdropDialog = function (editor) {
    let dialogUrl = editor.options.get('backdropimageDialogUrl');
    let dialogSettings = {dialogClass: 'editor-image-dialog'};
    let existingValues = getExistingValues(editor);

    let saveCallback = function(returnValues) {
      let image = buildImage(editor, returnValues);
      let selected = editor.selection.getNode();
      if (selected.nodeName === 'IMG') {
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
      if (returnValues.attributes.src && !returnValues.attributes.width && !returnValues.attributes.height) {
        let src = returnValues.attributes.src;
        let imgDomnode = editor.getBody().querySelector('[src="' + src + '"]');
        let imgToSize = new Image();
        imgToSize.onload = function() {
          imgDomnode.setAttribute('width', this.width);
          imgDomnode.setAttribute('height', this.height);
        };
        imgToSize.src = src;
      }
    };

    Backdrop.tinymce.openDialog(editor, dialogUrl, existingValues, saveCallback, dialogSettings);
  };

  /**
   * Limit allowed tags in figcaption to the same ones CKE4 allowed.
   * Plus "span", because otherwise inserting links in figcaptions breaks.
   */
  const tagsAllowedInFigcaption = ['a', 'em', 'strong', 'cite', 'code', 'br', 'span'];

  /**
   * Parses an array of AstNodes into a string.
   *
   * @param array captionContent
   *
   * @return string
   */
  const captionAstNodeToString = function (captionContent) {
    let content = '';
    if (!captionContent.length) {
      return content;
    }
    let dummy = document.createElement('figcaption');

    for (let i = 0; i < captionContent.length; i++) {
      let node = captionContent[i];
      let children = node.children();
      if (!children.length) {
        if (node.name === '#text') {
          dummy.append(document.createTextNode(node.value));
        }
        else {
          dummy.append(document.createElement(node.name));
        }
      }
      else {
        let parent = document.createElement(node.name);
        if (node.attributes.length) {
          for (const attr of node.attributes) {
            if (!attr.name.startsWith('data-mce')) {
              parent.setAttribute(attr.name, attr.value);
            }
          }
        }
        let lastChild = node.lastChild;
        while ((node = node.walk())) {
          // Caution, walk() does not only walk over this node, so we have to
          // stop ourselves.
          if (node.name === '#text') {
            if (node.parent.name === parent.nodeName.toLowerCase()) {
              parent.append(document.createTextNode(node.value));
            }
          }
          else {
            let nestedElm = document.createElement(node.name);
            if (node.firstChild && node.firstChild.value) {
              nestedElm.append(document.createTextNode(node.firstChild.value));
            }
            if (node.attributes.length) {
              for (const attr of node.attributes) {
                if (!attr.name.startsWith('data-mce')) {
                  nestedElm.setAttribute(attr.name, attr.value);
                }
              }
            }
            parent.append(nestedElm);
          }
          if (node === lastChild) {
            // Stop before leaving this node.
            break;
          }
        }
        dummy.append(parent);
      }
    }
    return dummy.innerHTML;
  };

  /**
   * Turns an attribute string into an AstNode instance.
   *
   * @param string attrContent
   *
   * @return object
   */
  const attributeToCaption = function (attrContent) {
    let caption = new tinymce.html.Node('figcaption', 1);
    let parsed = tinymce.html.DomParser({validate: false, forced_root_block: false}).parse(attrContent);
    let children = parsed.children();
    for (let i = 0; i < children.length; i++) {
      caption.append(children[i]);
    }
    return caption;
  };

  /**
   * Checks if a dom node is relevant for this plugin.
   *
   * @param object node
   *   Dom node (tag).
   *
   * @return bool
   *   True if this tag is something, this plugin handles.
   */
  const isRegularImg = function (node) {
    if (node.nodeName !== 'IMG') {
      return false;
    }
    if (node.hasAttribute('data-mce-object') || node.hasAttribute('data-mce-placeholder')) {
      return false;
    }
    if (node.src.startsWith('data:')) {
      return false;
    }
    return true;
  };

  // Register plugin features.
  tinymce.PluginManager.add('backdropimage', function(editor, url) {
    editor.on('PreInit', function () {
      // Override allowed tags schema for figcaption tags, to comply with
      // CKEditor implementation in core. For better interchangeability.
      editor.schema.addValidChildren('figcaption[' + tagsAllowedInFigcaption.join('|') + '|#text]');

      // Parser fires when the editor initializes, or the code plugin submits.
      editor.parser.addAttributeFilter('data-caption', function (nodes) {
        for (let i = 0; i < nodes.length; i++) {
          // These "node" are AstNode, not dom node.
          // @see https://www.tiny.cloud/docs/tinymce/6/apis/tinymce.html.node/#Node
          let link;
          if (nodes[i].parent.name === 'a') {
            link = nodes[i].parent.clone();
            nodes[i].parent.unwrap();
          }
          if (nodes[i].parent.name === 'p') {
            nodes[i].parent.unwrap();
          }
          let img = nodes[i].clone();
          let caption = attributeToCaption(img.attr('data-caption'));
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
            // Remove empty figures, leave others untouched as figure can
            // contain almost anything. Not just images.
            if (!nodes[i].children().length) {
              nodes[i].remove();
            }
            continue;
          }
          let img = childImgs[0].clone();
          let captions = nodes[i].getAll('figcaption');
          if (captions.length) {
            let captionContent = captions[0].children();
            let content = captionAstNodeToString(captionContent);
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
          // Get all links, but filter out links in figcaptions.
          let childLinks = nodes[i].getAll('a');
          if (childLinks.length) {
            childLinks = childLinks.filter(function (item) {
              if (item.parent.name === 'figcaption') {
                return false;
              }
              if (item.parent.parent && item.parent.parent.name === 'figcaption') {
                return false;
              }
              return true;
            });
          }
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
    });

    editor.ui.registry.addToggleButton('backdropimage', {
      icon: 'image',
      tooltip: 'Insert/Edit Image',
      onAction: function () {
        backdropDialog(editor);
      },
      onSetup: function (api) {
        api.setActive(false);
        editor.on('SelectionChange', function () {
          let node = editor.selection.getNode();
          if (isRegularImg(node)) {
            api.setActive(true);
          }
          else {
            api.setActive(false);
          }
        });
        editor.on('dblclick', function (ev) {
          if (isRegularImg(ev.target)) {
            backdropDialog(editor);
            ev.stopImmediatePropagation();
          }
        });
        // @see https://github.com/backdrop-contrib/tinymce/issues/56
        editor.on('ObjectSelected', function (obj) {
          if (obj.target.nodeName !== 'IMG') {
            return;
          }
          editor.selection.select(obj.target);
        });
      }
    });

    editor.ui.registry.addMenuItem('backdropimage', {
      icon: 'image',
      text: 'Image...',
      onAction: function () {
        backdropDialog(editor);
      }
    });

    editor.ui.registry.addContextMenu('backdropimage', {
      update: function (element) {
        if (isRegularImg(element)) {
          return 'backdropimage';
        }
        return '';
      }
    });

  });

})();
