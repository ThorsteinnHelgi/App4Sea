/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

App4Sea = App4Sea || {};

    $(document).ready(function () {
        console.log("Document ready");

        // Init Map.OpenLayers
        App4Sea.Map.OpenLayers.Init();

        // Hook click event to MenuItem
        $(".MenuItem").click(function () {
            console.log("MenuItem click");

            var url = $(this).attr("data-url");
            var target = $(this).attr("data-target");
            window.open(url, target);
        });
    });

    $( window ).on( "load", function() {
        console.log( "Window load" );

        setTimeout(function(){    
            console.log("setTimeout");

            $("#splash-overlay").fadeOut();
        }, 2000);

        //$("#splash-overlay").show();//Do show
        //$("#splash-overlay-content").show();//.center();//Do fn.center
        //$("#splash_image").show();//.center();//Do fn.center

        var info = $("#ToolTipInfo");

        info.tooltip('hide');
        info.tooltip({
            animation: false,
            trigger: 'manual'
        });
    }
);