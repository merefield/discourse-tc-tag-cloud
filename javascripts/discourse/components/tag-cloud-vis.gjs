import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import didInsert from "@ember/render-modifiers/modifiers/did-insert";
import didUpdate from "@ember/render-modifiers/modifiers/did-update";
import { service } from "@ember/service";
import loadScript from "discourse/lib/load-script";
import DiscourseURL from "discourse/lib/url";

export default class TagCloudVis extends Component {
  @service siteSettings;
  @tracked words = [];

  async ensureD3() {
    await loadScript(settings.theme_uploads.d3Lib);
    return loadScript(settings.theme_uploads.d3Cloud);
  }

  @action
  draw() {
    function compare(a, b) {
      if (a.count < b.count) {
        return -1;
      }
      if (a.count > b.count) {
        return 1;
      }
      return 0;
    }

    if (!this.args.tags) {
      return;
    }

    this.words = this.args.tags;

    if (this.siteSettings.tags_listed_by_group) {
      let tagGroups = this.args.extras.tag_groups;
      tagGroups.forEach((tagGroup) => {
        tagGroup.tags.forEach((extraTag) => {
          this.words.push(extraTag);
        });
      });
    }

    this.words.sort(compare);

    this.words.map((word) => {
      word.size = Math.log(word.count + 1.75) * settings.tag_cloud_word_scale;
      word.href = `/tag/${word.text}`;
      return word;
    });

    let _this = this;

    this.ensureD3().then(() => {
      let layout = window.d3.layout
        .cloud()
        .size([settings.tag_cloud_width, settings.tag_cloud_height])
        .words(_this.words)
        .padding(5)
        .rotate(function () {
          return 0;
        })
        .font("Impact")
        .fontSize(function (d) {
          return d.size;
        })
        .on("end", draw);

      layout.start();

      function draw(words) {
        window.d3
          .select(".tag-cloud-vis")
          .append("svg")
          .attr("viewBox", `0 0 ${layout.size()[0]} ${layout.size()[1]}`)
          .append("g")
          .attr(
            "transform",
            "translate(" +
              layout.size()[0] / 2 +
              "," +
              layout.size()[1] / 2 +
              ")"
          )
          .selectAll("text")
          .data(words)
          .enter()
          .append("text")
          .style("font-size", function (d) {
            return d.size + "px";
          })
          .style("fill", function () {
            return `hsl(${
              Math.random() * 360
            },${settings.tag_cloud_color_saturation}%,${settings.tag_cloud_color_lightness}%)`;
          })
          .style("font-family", "Impact")
          .attr("text-anchor", "middle")
          .attr("transform", function (d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
          })
          .on("mouseover", function () {
            if (settings.tag_cloud_animate_mouse_over) {
              let newFontSize =
                parseInt(window.d3.select(this).style("font-size"), 10) * 1.1 +
                "px";
              window.d3
                .select(this)
                .transition()
                .duration(100)
                .style("cursor", "pointer")
                .style("font-size", newFontSize)
                .style("fill", function () {
                  return window.d3
                    .rgb(window.d3.select(this).style("fill"))
                    .darker(-0.7);
                });
            }
          })
          .on("mouseout", function () {
            if (settings.tag_cloud_animate_mouse_over) {
              let newFontSize =
                parseInt(window.d3.select(this).style("font-size"), 10) / 1.1 +
                "px";
              window.d3
                .select(this)
                .transition()
                .duration(100)
                .style("cursor", "default")
                .style("font-size", newFontSize)
                .style("fill", function () {
                  return window.d3
                    .rgb(window.d3.select(this).style("fill"))
                    .darker(0.7);
                });
            }
          })
          .on("click", function (d) {
            if (d.target.__data__.href) {
              DiscourseURL.routeTo(d.target.__data__.href);
            }
          })
          .text(function (d) {
            return d.text;
          });
      }
    });
  }

  <template>
    <div
      {{didInsert this.draw @tags}}
      {{didUpdate this.draw @tags}}
      class="tag-cloud-vis"
    ></div>
  </template>
}
