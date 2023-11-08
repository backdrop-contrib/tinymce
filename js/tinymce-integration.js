(function (Backdrop, $) {

  "use strict";

  Backdrop.editors.tinymce = {

    attach: function (element, format) {
      // Get rid of js-resizing.
      $(element).siblings('.grippie').hide();

      if (!$('#tinymce-modal').length) {
        $('<div id="tinymce-modal"/>').hide().appendTo('body');
      }

      let options = format.editorSettings.tiny_options;
      options.selector = '#' + element.id;
      // Prevent editor from changing urls, which mangles urls inserted via
      // Backdrop link dialog.
      options.convert_urls = false;

      // Additional variables from hook.
      for (let item in format.editorSettings.backdrop) {
        options[item] = format.editorSettings.backdrop[item];
      }

      // If image uploads are active, we also need the paste handler.
      if (options.images_upload_url) {
        // Layouts block editing: image dialog opened from a block dialog,
        // results in upload (paste) handler to be undefined (nested iframes).
        // Only happens, if js aggregation is off.
        if (typeof tinymceImageUploadHandler == 'function') {
          options.images_upload_handler = tinymceImageUploadHandler;
        }
        else {
          // We turn off pasting images in this case. Selecting via library, or
          // regular uploads will still work.
          options.paste_data_images = false;
        }
      }

      // Content language defaults to interface language.
      let contentLang = options.language;
      // If this element's form has a language select list, toggle content lang
      // based on that value.
      if (element.form.querySelector('#edit-langcode') != null) {
        let languageToggle = element.form.querySelector('#edit-langcode');
        if (languageToggle.value != 'und') {
          contentLang = languageToggle.value;
        }
        languageToggle.addEventListener('change', function (ev) {
          let langcode = ev.target.value;
          if (langcode == 'und') {
            langcode = options.language;
          }
          let event = new CustomEvent('contentLangSwitch', { detail: langcode });
          window.dispatchEvent(event);
        });
      }

      options.setup = function (editor) {
        // Register additional string variables.
        for (let item in format.editorSettings.backdrop) {
          editor.options.register(item, { processor: "string" });
        }
        // Listen to custom event from language select list toggle.
        window.addEventListener('contentLangSwitch', function (event) {
          editor.contentDocument.documentElement.setAttribute('lang', event.detail);
        });
        editor.on('PreInit', function (event) {
          // @see https://github.com/tinymce/tinymce/issues/4830
          editor.contentDocument.documentElement.setAttribute('lang', contentLang);
          // Unregister formats, if any.
          if (typeof format.editorSettings.unregisterFmts != 'undefined') {
            let fmts = format.editorSettings.unregisterFmts;
            for (let i = 0; i < fmts.length; i++) {
              editor.formatter.unregister(fmts[i]);
            }
          }
          // Override as noop-commands to prevent inline styles clutter on block
          // elements. That way indent/outdent are limited to list items.
          editor.addCommand('indent', function () {});
          editor.addCommand('outdent', function () {});
          // Register custom icons provided by plugins.
          if (typeof format.editorSettings.iconRegistry != 'undefined') {
            let icons = format.editorSettings.iconRegistry;
            for (let name in icons) {
              editor.ui.registry.addIcon(name, icons[name]);
            }
          }
          // @see https://github.com/backdrop-contrib/tinymce/issues/18
          editor.shortcuts.add('ctrl+1', 'Jump to menubar', function () {
            let menuBar = document.getElementsByClassName('tox-menubar');
            if (menuBar.length) {
              menuBar[0].getElementsByTagName('button')[0].focus();
            }
          });
          editor.shortcuts.add('ctrl+2', 'Jump to toolbar', function () {
            let myToolBar = document.getElementsByClassName('tox-toolbar-overlord');
            if (myToolBar.length) {
              myToolBar[0].getElementsByTagName('button')[0].focus();
            }
          });
        });
      };

      tinymce.init(options);
    },

    detach: function (element, format, trigger) {
      if (trigger == 'serialize') {
        return;
      }
      let idSelector = '#' + element.id;
      tinymce.remove(idSelector);
    }
  };

  /**
   * Mostly copy-paste from ckeditor module.
   */
  Backdrop.tinymce = {
    saveCallback: null,
    openDialog: function (editor, url, existingValues, saveCallback, dialogSettings) {
      var classes = dialogSettings.dialogClass ? dialogSettings.dialogClass.split(' ') : [];
      classes.push('editor-dialog');
      var $content = $('<div class="tinymce-dialog-loading"><span class="tinymce-dialog-loading-link"><a>' + Backdrop.t('Loading...') + '</a></span></div>');
      var $target = $('.tox-edit-area');
      $target.css('position', 'relative');
      $content.appendTo($target);

      dialogSettings = {
        dialogClass: classes.join(' '),
        autoResize: true,
        modal: true,
        target: '#tinymce-modal'
      }
      new Backdrop.ajax('tinymce-modal', $content.find('a').get(0), {
        accepts: 'application/vnd.backdrop-dialog',
        dialog: dialogSettings,
        selector: '.tinymce-dialog-loading-link',
        url: url,
        event: 'tinymce-internal.tinymce',
        progress: {'type': 'throbber'},
        submit: {
          editor_object: existingValues
        }
      });
      // Trigger AJAX event to open modal.
      $content.find('a')
          .on('click', function () { return false; })
          .trigger('tinymce-internal.tinymce');

      // After a short delay, show "Loading…" message.
      window.setTimeout(function () {
        $content.find('span').animate({top: '0px'});
      }, 500);
      Backdrop.tinymce.saveCallback = saveCallback;
    }
  }
  $(window).on('dialog:beforecreate', function (e, dialog, $element, settings) {
    $('.tinymce-dialog-loading').animate({top: '-40px'}, function () {
      $(this).remove();
    });
  });

  // The filter module triggers this?
  $(window).on('editor:dialogsave', function (e, values) {
    if (Backdrop.tinymce.saveCallback) {
      Backdrop.tinymce.saveCallback(values);
    }
  });

  // Fires when hitting dialog Save or Close buttons.
  $(window).on('dialogclose', function(event, ui) {
    if (event.target.id == 'tinymce-modal' && tinymce.activeEditor) {
      tinymce.activeEditor.iframeElement.focus();
    }
  });

  // Respond to dialogs that are closed, removing the current save handler.
  $(window).on('dialog:afterclose', function (e, dialog, $element) {
    if (Backdrop.tinymce.saveCallback) {
      Backdrop.tinymce.saveCallback = null;
    }
  });

})(Backdrop, jQuery);
