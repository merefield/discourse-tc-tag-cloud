import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import TagCloudVis from "./tag-cloud-vis";

export default class TagSourcer extends Component {
  @tracked isLoading = false;
  @tracked tags;
  @tracked extras;

  constructor() {
    super(...arguments);
    this.isLoading = true;

    ajax(`/tags.json`)
      .then((tags) => {
        this.tags = tags.tags;
        this.extras = tags.extras;
        this.isLoading = false;
      })
      .catch((err) => {
        popupAjaxError(err);
        this.isLoading = false;
      });
  }

  get showOnFrontPage() {
    return settings.tag_cloud_include_on_front_page;
  }

  <template>
    {{#if this.showOnFrontPage}}
      <TagCloudVis @tags={{this.tags}} @extras={{this.extras}} />
    {{/if}}
  </template>
}
