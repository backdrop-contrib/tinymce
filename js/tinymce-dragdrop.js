/**
 * @file
 * Backdrop behaviors for the builder tool.
 */
(function ($, Backdrop) {
  "use strict";

  Backdrop.behaviors.tinymceAdminToggleButtonText = {
    attach: function () {
      const buttonLabels = {
        visible: Backdrop.t('Hide button info'),
        invisible: Backdrop.t('Show button info')
      };
      const textToggle = '<a href="" class="tinymce-toggle-text" aria-hidden="true">' + buttonLabels.invisible + '<a>';
      // Selector before core 1.30.0.
      $('#edit-tb .fieldset-description').after(textToggle);
      // Changed CSS class as of core 1.30.0.
      $('#edit-tb .fieldset-wrapper .description').after(textToggle);
      $('.tinymce-toggle-text').on('click', function (event) {
        event.preventDefault();
        let $toggle = $(event.target);

        if (!$toggle.hasClass('text-visible')) {
          $toggle.addClass('text-visible');
          $toggle.text(buttonLabels.visible);
          $('#edit-tb .wrapper li span').removeClass('element-invisible');
        }
        else {
          $toggle.removeClass('text-visible');
          $toggle.text(buttonLabels.invisible);
          $('#edit-tb .wrapper li span').addClass('element-invisible');
        }
      });
    }
  };

  Backdrop.behaviors.tinymceAdminDragdrop = {
    attach: function (context, settings) {

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
      };

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

      // Keyboard navigation.
      $('#edit-tb .tinybutton').on('keydown', function (ev) {
        if ($(this).parent().attr('id') === 'buttons-active') {
          // 39 = Arrow right.
          if (ev.which === 39) {
            $(this).insertAfter($(this).next());
            $(this).focus();
            updateFormItem();
          }
          // 37 = Arrow left.
          else if (ev.which === 37) {
            $(this).insertBefore($(this).prev());
            $(this).focus();
            updateFormItem();
          }
          // 173 = "-" key.
          else if (ev.which === 173) {
            $(this).next().focus();
            $(this).appendTo('#buttons-available');
            let message = Backdrop.t('%button removed from active elements.', {
              '%button': $(this).text()
            });
            $('#announce-addremove').html(message);
            updateFormItem();
          }
        }
        else {
          // 171 = "+" key.
          if (ev.which === 171) {
            $(this).appendTo('#buttons-active');
            $(this).focus();
            let message = Backdrop.t('%button added to active elements.', {
              '%button': $(this).text()
            });
            $('#announce-addremove').html(message);
            updateFormItem();
          }
        }
      });
    }
  };
})(jQuery, Backdrop);
