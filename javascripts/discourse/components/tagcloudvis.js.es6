import loadScript from "discourse/lib/load-script";

export default Ember.Component.extend({
  classNames: "tag-cloud-vis",
  words: Ember.computed.alias("model.content"),

  ensurejQCloud() {
    return loadScript(settings.theme_uploads.jqcloud);
  },

  didInsertElement() {
    this.setup();
  },

  setup() {
    this.words.map((word) => {
      word.size = word.count;
      word.weight = word.count;
      word.link = `/tag/${word.text}`;
      return word;
    });

    var _this = this;

    this.ensurejQCloud().then(() => {

      var stepColor = ((step) => {
        return `hsl(${Math.random() * 360},${settings.tag_cloud_color_saturation}%,${settings.tag_cloud_color_lightness}%)`;
      });

      $(function () {
        // When DOM is ready, select the container element and call the jQCloud method, passing the array of words as the first argument.
        $(".tag-cloud-vis").jQCloud(_this.words, {
          width: settings.tag_cloud_width,
          height: settings.tag_cloud_height,
          autoResize: false,
          shape: settings.tag_cloud_shape,
          steps: settings.tag_cloud_steps,
          colors: stepColor,
          fontSize: {
            from: settings.tag_cloud_relative_fontsize_from,
            to: settings.tag_cloud_relative_fontsize_to
          }
        });
      });
    });
  },

  willDestroyElement() {
    $(".tag-cloud-vis").jQCloud('destroy');
  },
});
