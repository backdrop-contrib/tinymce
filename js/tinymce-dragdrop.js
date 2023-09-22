(function ($, Backdrop) {
  "use strict";
  Backdrop.behaviors.tinymceAdminDragdrop = {
    attach: function (context, settings) {
      let values = $('#edit-toolbar').val();
      $('#buttons-active').sortable({
        connectWith: '#buttons-available',
        items: '.tinybutton',
        stop: function () {
          updateFormItem();
        }
      });
      $('#buttons-available').sortable({
        connectWith: '#buttons-active',
        items: '.tinybutton',
        stop: function () {
          updateFormItem();
        }
      });
      $('#buttons-space .tinybutton').draggable({
        connectToSortable: '#buttons-active',
        helper: 'clone',
        stop: function () {
          updateFormItem();
        }
      });

      let updateFormItem = function () {
        setTimeout(function () {
          let toolbarconf = '';
          $('#buttons-active .tinybutton').each( function (i) {
            if (i > 0) {
              toolbarconf += ' ';
            }
            if (this.id) {
              toolbarconf += this.id;
            }
            else if (this.classList.contains('separator')) {
              toolbarconf += '|';
            }
          });
          $('#edit-toolbar').val(toolbarconf);
        }, 500);
      }
    }
  }
})(jQuery, Backdrop);
