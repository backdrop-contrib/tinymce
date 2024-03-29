/**
 * @file
 * Custom image upload handler for drag-and-drop.
 *
 * @see Backdrop.editors.tinymce.attach
 */
(function () {
  'use strict';

  window.tinymceImageUploadHandler = function (blobInfo, progress) {
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

        // Update other attributes, TinyMCE doesn't take care of.
        setTimeout(function () {
          if (json.errors) {
            // For example resized images.
            tinymce.activeEditor.notificationManager.open({
              text: json.errors,
              type: 'warning',
              icon: 'warn'
            });
          }
          let imgDomnode = tinymce.activeEditor.getBody().querySelector('[src^="' + json.location + '"]');
          if (imgDomnode) {
            imgDomnode.setAttribute('width', json.width);
            imgDomnode.setAttribute('height', json.height);
            imgDomnode.setAttribute('data-file-id', json.fileId);
            imgDomnode.setAttribute('alt', '');
          }
        }, 500);
      };

      const formData = new FormData();
      formData.append('file', blobInfo.blob(), blobInfo.filename());

      xhr.send(formData);
    });
  };
})();
