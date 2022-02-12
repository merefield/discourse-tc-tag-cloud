import { ajax } from "discourse/lib/ajax";
import Component from "@ember/component";
import discourseComputed from "discourse-common/utils/decorators";

export default Component.extend({
  tagName: "",
  tags: "",
  isLoading: true,

  init() {
    this._super(...arguments);

    ajax(`/tags.json`).then((tags) => {
      this.set("tags", tags.tags);
      this.set("isLoading", false);
    });
  },

  @discourseComputed("settings.tag_cloud_include_on_front_page")
  showOnFrontPage () {
    return settings.tag_cloud_include_on_front_page;
  }
});