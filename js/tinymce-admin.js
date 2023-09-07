/**
 * @file
 * Backdrop behavior attached to filter_admin_format_form.
 */
(function ($, Backdrop) {

"use strict";

Backdrop.behaviors.tinymceAdmin = {
  attach: function (context, settings) {
    let selectedEditor = $('select[name="editor"]').val();
    if (selectedEditor != 'tinymce') {
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
    if (typeof selected == 'undefined') {
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
        let buttonRule = new Backdrop.EditorFeatureHTMLRule(ruleDefinition);
        feature.addHTMLRule(buttonRule);
      }
      list[profile] = feature;
    }
    return list;
  }
};

})(jQuery, Backdrop);
