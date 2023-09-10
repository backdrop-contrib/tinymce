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
      // Register additional string variables.
      options.setup = function (editor) {
        for (let item in format.editorSettings.backdrop) {
          editor.options.register(item, { processor: "string" });
        }
      };

      tinymce.init(options);
    },

    detach: function (element, format, trigger) {
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
      var $target = $('.tox-edit-area');//hm...
      //$target.css('position', 'relative');//??
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
        event: 'tinymce-internal.tinymce',//not sure
        progress: {'type': 'throbber'},
        submit: {
          editor_object: existingValues// todo filter module magic
        }
      });
      // Trigger ajax.
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
