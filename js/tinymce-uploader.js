/**
 * Custom image upload handler.
 *
 * @see Backdrop.editors.tinymce.attach
 */
"use strict";

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
