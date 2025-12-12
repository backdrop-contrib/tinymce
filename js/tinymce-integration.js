(function (Backdrop, $) {

  "use strict";

  Backdrop.editors.tinymce = {

    attach: function (element, format) {
      // Get rid of js-resizing.
      $(element).siblings('.grippie').hide();

      if (!$('#tinymce-modal').length) {
        $('<div id="tinymce-modal"/>').hide().appendTo('body');
      }

      // Prevent jquery.ui dialog focusin handling breaking tox form elements.
      $(document).on('focusin', function (event) {
        // It's impossible to make this more specific because of split buttons.
        if (element.form && element.form.classList.contains('layout-block-configure-form')) {
          event.stopImmediatePropagation();
        }
      });

      let options = format.editorSettings.tiny_options;
      options.selector = '#' + element.id;
      // Prevent editor from changing urls, which mangles urls inserted via
      // Backdrop link dialog.
      options.convert_urls = false;

      // Add tiny's skin name to body classes for easier styling.
      let skinClass = 'tinymce-skin-' + options.skin;
      if (!$('body').hasClass(skinClass)) {
        $('body').addClass(skinClass);
      }
      // Add a class to the editing area body to allow styling per form.
      options.body_class = 'form-' + element.form.id;

      // Additional variables from hook.
      for (let item in format.editorSettings.backdrop) {
        options[item] = format.editorSettings.backdrop[item];
      }

      // If image uploads are active, we also need the paste handler.
      if (options.images_upload_url) {
        // Layouts block editing: image dialog opened from a block dialog,
        // results in upload (paste) handler to be undefined (nested iframes).
        // Only happens, if js aggregation is off.
        if (typeof tinymceImageUploadHandler === 'function') {
          options.images_upload_handler = tinymceImageUploadHandler;// jshint ignore:line
        }
        else {
          // We turn off pasting images in this case. Selecting via library, or
          // regular uploads will still work.
          options.paste_data_images = false;
        }
      }

      // Content language defaults to current page language.
      let contentLang = format.editorSettings.contentLanguageDefault;
      // If this element's form has a language select list, toggle content lang
      // based on that value.
      if (element.form.querySelector('#edit-langcode') !== null) {
        let languageToggle = element.form.querySelector('#edit-langcode');
        if (languageToggle.value !== 'und') {
          contentLang = languageToggle.value;
        }
        languageToggle.addEventListener('change', function (ev) {
          let langcode = ev.target.value;
          if (langcode === 'und') {
            langcode = format.editorSettings.contentLanguageDefault;
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
          if (typeof format.editorSettings.unregisterFmts !== 'undefined') {
            let fmts = format.editorSettings.unregisterFmts;
            for (let i = 0; i < fmts.length; i++) {
              editor.formatter.unregister(fmts[i]);
            }
          }

          // Override with custom function to prevent inline styles, as
          // "Limit allowed HTML tags" filter setting prevents their display.
          // That way indent/outdent is limited to list items.
          if (!format.editorSettings.allowInlineStyle) {
            const indentOrig = editor.editorCommands.commands.exec.indent;
            editor.addCommand('indent', function () {
              const blocks = editor.selection.getSelectedBlocks();
              if (blocks.length && blocks[0].closest('li')) {
                indentOrig();
              }
            });
            const outdentOrig = editor.editorCommands.commands.exec.outdent;
            editor.addCommand('outdent', function () {
              const blocks = editor.selection.getSelectedBlocks();
              if (blocks.length && blocks[0].closest('li')) {
                outdentOrig();
              }
            });
          }

          // Register custom icons provided by plugins.
          if (typeof format.editorSettings.iconRegistry !== 'undefined') {
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
      if (trigger === 'serialize') {
        tinymce.triggerSave();
        return;
      }
      let idSelector = '#' + element.id;
      tinymce.remove(idSelector);
    }
  };

  /**
   * Provides Backdrop dialog handling for TinyMCE plugins.
   */
  Backdrop.tinymce = {
    saveCallback: null,
    dialogTriggerClass: 'tinymce-dialog-open-trigger',
    openDialog: function (editor, url, existingValues, saveCallback, dialogSettings) {
      let classes = dialogSettings.dialogClass ? dialogSettings.dialogClass.split(' ') : [];
      classes.push('editor-dialog');
      dialogSettings = {
        classes: {
          'ui-dialog': classes.join(' ')
        },
        autoResize: true,
        modal: true,
        target: '#tinymce-modal'
      };
      // Trigger element gets removed again as soon as the dialog opens.
      let trigger = document.createElement('div');
      trigger.style.display = 'none';
      trigger.classList.add(this.dialogTriggerClass);
      document.body.append(trigger);

      new Backdrop.ajax('tinymce-modal', trigger, {
        accepts: 'application/vnd.backdrop-dialog',
        dialog: dialogSettings,
        selector: '#tinymce-modal',
        url: url,
        event: 'click',
        progress: {'type': 'none'},
        submit: {
          editor_object: existingValues
        }
      });
      // Store the save callback to be executed when this dialog is closed.
      Backdrop.tinymce.saveCallback = saveCallback;
      // Make sure, the editor owning the dialog button is the active one.
      editor.focus();
      // Trigger opening this modal and start loading animation.
      trigger.click();
      editor.setProgressState(true);
    }
  };

  // Content for dialog is loaded. Remove the obsolete trigger and stop
  // TinyMCE's loading animation.
  $(window).on('dialog:beforecreate', function () {
    $('.' + Backdrop.tinymce.dialogTriggerClass).remove();
    if (tinymce.activeEditor) {
      tinymce.activeEditor.setProgressState(false);
    }
  });

  // The filter module triggers this.
  $(window).on('editor:dialogsave', function (e, values) {
    if (Backdrop.tinymce.saveCallback) {
      Backdrop.tinymce.saveCallback(values);
    }
  });

  // Fires when hitting dialog Save or Close buttons.
  $(window).on('dialogclose', function(event, ui) {
    if (event.target.id === 'tinymce-modal' && tinymce.activeEditor) {
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
