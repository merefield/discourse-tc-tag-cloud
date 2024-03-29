import loadScript from "discourse/lib/load-script";
import DiscourseURL from "discourse/lib/url";
import { alias, notEmpty } from "@ember/object/computed";
import Component from "@ember/component";
import { observes } from 'discourse-common/utils/decorators';

export default Component.extend({
  classNames: "tag-cloud-vis",
  words: alias("tags"),
  hasItems: notEmpty("tags"),

  ensureD3() {
    return loadScript(settings.theme_uploads.d3Lib).then(() => {
      return loadScript(settings.theme_uploads.d3Cloud);
    });
  },

  didInsertElement() {
    if (!this.site.mobileView) {
      this.waitForData() 
    }
  },

  @observes("hasItems")
  waitForData() {
    if(!this.hasItems) {
      return;
    } else {
      this.setup();
    }
  },

  setup() {
    function compare(a, b) {
      if (a.count < b.count) {
        return -1;
      }
      if (a.count > b.count) {
        return 1;
      }
      return 0;
    }

    if (this.siteSettings.tags_listed_by_group) {
      let tagGroups = this.extras.tag_groups
      tagGroups.forEach((tagGroup) => {
        tagGroup.tags.forEach((extraTag) => {
          this.words.push(extraTag)
        })
      })
    }

    this.words.sort(compare);

    this.words.map((word) => {
      word.size = Math.log(word.count + 1.75) * settings.tag_cloud_word_scale;
      word.href = `/tag/${word.text}`;
      return word;
    });

    var _this = this;

    this.ensureD3().then(() => {
      var layout = d3.layout
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
        d3.select(".tag-cloud-vis")
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
          .on("mouseover", function (d, i) {
            if (settings.tag_cloud_animate_mouse_over) {
              let newFontSize =
                parseInt(d3.select(this).style("font-size")) * 1.1 + "px";
              d3.select(this)
                .transition()
                .duration(100)
                .style("cursor", "pointer")
                .style("font-size", newFontSize)
                .style("fill", function () {
                  return d3.rgb(d3.select(this).style("fill")).darker(-0.7);
                });
            }
          })
          .on("mouseout", function (d, i) {
            if (settings.tag_cloud_animate_mouse_over) {
              let newFontSize =
                parseInt(d3.select(this).style("font-size")) / 1.1 + "px";
              d3.select(this)
                .transition()
                .duration(100)
                .style("cursor", "default")
                .style("font-size", newFontSize)
                .style("fill", function () {
                  return d3.rgb(d3.select(this).style("fill")).darker(0.7);
                });
            }
          })
          .on("click", function (d, i) {
            if (d.target.__data__.href) {
              DiscourseURL.routeTo(d.target.__data__.href);
            }
          })
          .text(function (d) {
            return d.text;
          });
      }
    });
  },
});
