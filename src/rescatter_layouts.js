let glob = window ? window : global;
glob.ReScatter = ReScatter || {};

//<!-- Single plot layout -->
ReScatter.singlePlotLayout = `<div class="simple_grid_layout pad_layout" id="single_layout">
    <!-- 1 plot layout -->
    <div class="content_center" id="subPlot-1">
        <div class="row">
            <!-- subject 1 of 1 -->
            <div class="col-md-12">
                <h6 class="plot_title" id="subPlot-1-1-title"></h6>
                <div id="subPlot-1-1"></div>
            </div>
        </div>
    </div>
</div>`;

//<!-- 8-plot grid layout -->
ReScatter.gridPlotLayout = `<div class="simple_grid_layout pad_layout" id="8_grid_layout">
    <!-- 8 plot layout -->
    <div class="content_center" id="subPlot-8">
        <div class="row">
            <!-- subject 1 of 6 etc-->
            <div class="col-md-6 pad_plot">
                <h6 class="plot_title" id="subPlot-1-8-title"></h6>
                <div id="subPlot-1-8"></div>
            </div>
            <div class="col-md-6 pad_plot">
                <h6 class="plot_title" id="subPlot-2-8-title"></h6>
                <div id="subPlot-2-8"></div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 pad_plot">
                <h6 class="plot_title" id="subPlot-3-8-title"></h6>
                <div id="subPlot-3-8"></div>
            </div>
            <div class="col-md-6 pad_plot">
                <h6 class="plot_title" id="subPlot-4-8-title"></h6>
                <div id="subPlot-4-8"></div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 pad_plot">
                <h6 class="plot_title" id="subPlot-5-8-title"></h6>
                <div id="subPlot-5-8"></div>
            </div>
            <div class="col-md-6 pad_plot">
                <h6 class="plot_title" id="subPlot-6-8-title"></h6>
                <div id="subPlot-6-8"></div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 pad_plot">
                <h6 class="plot_title" id="subPlot-7-8-title"></h6>
                <div id="subPlot-7-8"></div>
            </div>
            <div class="col-md-6 pad_plot">
                <h6 class="plot_title" id="subPlot-8-8-title"></h6>
                <div id="subPlot-8-8"></div>
            </div>
        </div>
    </div>
</div>`;

//<!-- Master & Grid combined plot layout -->
ReScatter.masterGridLayout = `<div class="master_grid_layout pad_layout" id="master_grid_layout">
    <div class="content_center" id="mg-subPlot-8">
        <div class="row no_pad_plot">
            <div class="col-md-3 no_pad_plot">
                <div class="col-md-12 no_pad_plot">
                    <h6 class="plot_title" id="mg-subPlot-1-8-title"></h6>
                    <div id="mg-subPlot-1-8"></div>
                </div>
                <div class="col-md-12 no_pad_plot">
                    <h6 class="plot_title" id="mg-subPlot-3-8-title"></h6>
                    <div id="mg-subPlot-3-8"></div>
                </div>
            </div>
            <div class="col-md-6 no_pad_plot">
                <h6 class="plot_title" id="mg-master-title"></h6>
                <div id="mg-master"></div>
            </div>
            <div class="col-md-3 no_pad_plot">
                <div class="col-md-12 no_pad_plot">
                    <h6 class="plot_title" id="mg-subPlot-2-8-title"></h6>
                    <div id="mg-subPlot-2-8"></div>
                </div>
                <div class="col-md-12 no_pad_plot">
                    <h6 class="plot_title" id="mg-subPlot-4-8-title"></h6>
                    <div id="mg-subPlot-4-8"></div>
                </div>
            </div>
        </div>
        <div class="row no_pad_plot">
            <div class="col-md-3 no_pad_plot">
                <h6 class="plot_title" id="mg-subPlot-5-8-title"></h6>
                <div id="mg-subPlot-5-8"></div>
            </div>
            <div class="col-md-3 no_pad_plot">
                <h6 class="plot_title" id="mg-subPlot-6-8-title"></h6>
                <div id="mg-subPlot-6-8"></div>
            </div>
            <div class="col-md-3 no_pad_plot">
                <h6 class="plot_title" id="mg-subPlot-7-8-title"></h6>
                <div id="mg-subPlot-7-8"></div>
            </div>
            <div class="col-md-3 no_pad_plot">
                <h6 class="plot_title" id="mg-subPlot-8-8-title"></h6>
                <div id="mg-subPlot-8-8"></div>
            </div>
        </div>
    </div>
</div>`;

