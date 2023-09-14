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
        options.images_upload_handler = tinymceImageUploadHandler;
      }

      // Register additional string variables.
      options.setup = function (editor) {
        for (let item in format.editorSettings.backdrop) {
          editor.options.register(item, { processor: "string" });
        }
        editor.on('PreInit', function (editor) {
          // @see https://github.com/tinymce/tinymce/issues/4830
          editor.target.contentDocument.documentElement.setAttribute('lang', options.language);
        });
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

/**
 * Custom image upload handler.
 */
const tinymceImageUploadHandler = function (blobInfo, progress) {
  return new Promise( function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    let myurl = tinymce.activeEditor.options.get('images_upload_url');
    xhr.open('POST', myurl);

    xhr.onerror = function () {
      reject({ message: 'HTTP Error: ' + xhr.status, remove: true });
    };

    xhr.onload = function () {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject({ message: 'HTTP Error: ' + xhr.status, remove: true });
        return;
      }

      const json = JSON.parse(xhr.responseText);

      if (!json) {
        reject({ message: 'Invalid JSON response', remove: true });
        return;
      }

      // Image validation errors.
      if (!json.uploaded) {
        if (json.errors) {
          reject({ message: json.errors, remove: true });
        }
        else {
          reject({ message: 'Upload failed', remove: true });
        }
        return;
      }

      resolve(json.location);

      // Event to trigger setting data-file-id and dimensions in backdropimage.
      let data = {
        'src': json.location,
        'fileId': json.fileId,
        'width': json.width,
        'height': json.height
      };
      setTimeout(function () {
        let imgDomnode = tinymce.activeEditor.getBody().querySelector('[src^="' + data.src + '"]');
        if (imgDomnode) {
          imgDomnode.setAttribute('width', data.width);
          imgDomnode.setAttribute('height', data.height);
          imgDomnode.setAttribute('data-file-id', data.fileId);
        }
      }, 500);
    };

    const formData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());

    xhr.send(formData);
  });
};
