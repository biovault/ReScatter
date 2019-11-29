/**
 * Created by baldur on 03/01/16.
 */
let instance = null

/**
 * @classdesc
 * TutorialControl provides a way of embedding YouTube tutorials into a simple popup div
 */
export default class TutorialControl{
    constructor(tutorialsConfig) {

        if (instance) {
            return instance;
        }

        this.enabled = false;
        this.containerId = ReScatter.CONTROL_ID.TUTORIAL;
        this.loadedVideos = {};
        this.titles = [];
        tutorialsConfig.forEach((val,index) => {
            this.loadedVideos[String(index)] = val.location;
            this.titles.push({id: index, value: val.title});
        })

        let self = this;
        this.tutorialsControl = webix.ui({
            view: "window",
            container: self.containerId,
            hidden: true,
            move: true,
            css: "tutorialWindow",
            sizeToContent: true,
            //width: 350,
            //height:70,
            id: "tutorialVideosFormWindow",
            head: {
                view: "toolbar", margin: -4, cols: [
                    {view: "label", label: "Tutorial videos"},
                    {
                        view: "icon", icon: "times-circle", css: "alter",
                        on: {
                            onItemClick: function (id, e) {
                                self.changedTutorialVisibility();
                            }
                        }
                    }
                ]
            },
            body: {
                id: "tutorialVideosForm",
                view: "form",
                height: 516,
                width: 850,
                type: "clean",
                complexData: true,
                elements: [
                    /* for locally source videos - useful for debug */
                    {
                        view: "video",
                        id: "tutorialVideoPlayer",
                        hidden: true,
                        src: [
                        ]
                    },
                    {
                        view: "iframe",
                        id: "youtubeembedding",
                        hidden: false,
                        src: self.loadedVideos["1"],
                        width: 854, height: 480,
                        on: {
                            // there does not seem to be a way to get the allowscreen
                            // attribute through the webix interface force it before load
                            onBeforeLoad: function () {
                                let iFrame = $$("youtubeembedding").getIframe();
                                iFrame.setAttribute('allowfullscreen', 'allowfullscreen');
                            }
                        }

                    },
                    {
                        view: "select",
                        id: "tutorialVideosList",
                        label: "Select tutorial video:",
                        labelWidth: 250,
                        value: 1,
                        options: self.titles,
                        on: {
                            onChange: function () {
                                let vidPath = self.loadedVideos[this.getValue()];
                                if (vidPath.startsWith("https://www.youtube.com/") || vidPath.startsWith("https://www.youtube-nocookie.com/")) {
                                    $$("tutorialVideoPlayer").hide();
                                    $$("youtubeembedding").show();
                                    $$("youtubeembedding").load(vidPath);
                                } else {
                                    $$("tutorialVideoPlayer").show();
                                    $$("youtubeembedding").hide();
                                    let player = $$("tutorialVideoPlayer").getVideo();
                                    if ($$("tutorialVideoPlayer").getNode().getElementsByTagName("source")[0].getAttribute('src') === vidPath) {
                                        return;
                                    }
                                    player.pause();
                                    $$("tutorialVideoPlayer").getNode().getElementsByTagName("source")[0].setAttribute('src', vidPath);
                                    $$("tutorialVideoPlayer").getNode().getElementsByTagName("source")[0].setAttribute('type', "video/mp4");
                                    player.play();
                                }

                                //$$("tutorialVideoPlayer").define("src", vidPath);
                            }
                        }
                    }

                ]
            },
            on: {
                onShow: function () {
                    let video = $$("tutorialVideoPlayer").getVideo();
                    if (!video.hasAttribute('preload')) {
                        video.setAttribute('preload', 'auto');
                    }
                    // force a reload to get the "allowfullscreen" working
                    // on startup
                    let iFrame = $$("youtubeembedding").getIframe();
                    let sourceVid = iFrame.getAttribute("src");
                    $$("youtubeembedding").load(sourceVid);
                },
                onHide: function () {
                    let video = $$("tutorialVideoPlayer").getVideo();
                    video.pause();
                }
            }
        });
        return instance;
    }


    enableTutorial () {
        this.tutorialsControl.show();
        this.enabled = true;
        this.updateCheckBox();
    }

    disableTutorial () {
        this.tutorialsControl.hide();
        this.enabled = false;
        this.updateCheckBox();
    }

    changedTutorialVisibility () {
        if (this.enabled) {
            this.disableTutorial();
        } else {
            this.enableTutorial();
        }
    }

    updateCheckBox () {
        let checkbox = document.querySelector('#' + ReScatter.CONTROL_ID.TUTORIALCHECKBOX);
        if (this.enabled) {
            checkbox.nextSibling.data = "Hide tutorial";
            //checkbox.parentNode.classList.remove('active');
        } else {
            checkbox.nextSibling.data = "Show tutorial";
            //checkbox.parentNode.classList.add('active');
        }
    }

    destroy () {

    }
}


