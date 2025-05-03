/**
 * @file
 * Backdrop behavior attached to filter_admin_format_form.
 */
(function ($, Backdrop) {

"use strict";

Backdrop.behaviors.tinymceAdmin = {
  attach: function (context, settings) {
    let selectedEditor = $('select[name="editor"]').val();
    if (selectedEditor !== 'tinymce') {
      return;
    }
    let selectProfile = $('#edit-editor-settings-tinymce-settings-profile');
    let valueStore = selectProfile.val();
    let featureList = Backdrop.behaviors.tinymceAdmin.buildFeatures();
    Backdrop.editorConfiguration.addedFeature(featureList[valueStore]);

    selectProfile.on('change', function (event) {
      let newProfile = this.value;
      let oldProfile = valueStore;

      Backdrop.editorConfiguration.removedFeature(featureList[oldProfile]);
      Backdrop.editorConfiguration.addedFeature(featureList[newProfile]);
      valueStore = this.value;
    });
  },
  detach: function () {
    let selected = $('#edit-editor-settings-tinymce-settings-profile').val();
    if (typeof selected === 'undefined') {
      return;
    }
    let featureList = Backdrop.behaviors.tinymceAdmin.buildFeatures();
    Backdrop.editorConfiguration.removedFeature(featureList[selected]);
  },
  buildFeatures: function () {
    // @see core/modules/filter/js/filter.admin.js
    let settings = Backdrop.settings.tinymceprofiletags;
    let list = {};
    for (let profile in settings) {
      let feature = new Backdrop.EditorFeature(profile);
      let requiredHtml = [{'tags': settings[profile]}];
      for (let n = 0; n < requiredHtml.length; n++) {
        let ruleDefinition = requiredHtml[n];
        ruleDefinition.required = true;
        let profileRule = new Backdrop.EditorFeatureHTMLRule(ruleDefinition);
        feature.addHTMLRule(profileRule);
      }
      list[profile] = feature;
    }
    return list;
  }
};

Backdrop.behaviors.tinymceAdminSummaries = {
  attach: function () {
    let $form = $('#filter-admin-format-form');
    $form.find('#edit-editor-settings-image-browser').backdropSetSummary( function() {
      if ($form.find('input[name="editor_settings[image_browser][enable]"]:checked').length) {
        return Backdrop.t('Enabled');
      }
      else {
        return Backdrop.t('Not enabled');
      }
    });
    $form.find('#edit-editor-settings-tabs-image-styles').backdropSetSummary( function() {
      if ($form.find('input[name="editor_settings[image_styles][status]"]:checked').length) {
        return Backdrop.t('Enabled');
      }
      else {
        return Backdrop.t('Not enabled');
      }
    });
    $form.find('#edit-editor-settings-tabs-image-settings').backdropSetSummary( function() {
      if ($form.find('input[name="editor_settings[image_upload][status]"]:checked').length) {
        let message = Backdrop.t('Enabled');
        let directory = $form.find('input[name="editor_settings[image_upload][directory]"]').val();
        if (directory) {
          message += ', ' + Backdrop.t('upload to %dir', {'%dir': directory});
        }
        return message;
      }
      else {
        return Backdrop.t('Not enabled');
      }
    });
    $form.find('#edit-editor-settings-tabs-file-settings').backdropSetSummary( function() {
      if ($form.find('input[name="editor_settings[file_upload][status]"]:checked').length) {
        let message =  Backdrop.t('Enabled');
        let directory = $form.find('input[name="editor_settings[file_upload][directory]"]').val();
        if (directory) {
          message += ', ' + Backdrop.t('upload to %dir', {'%dir': directory});
        }
        return message;
      }
      else {
        return Backdrop.t('Not enabled');
      }
    });
  }
};

})(jQuery, Backdrop);
