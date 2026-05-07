import $ from "jquery/dist/jquery.min.js";

$(window).on('load', function () {
    setTimeout(function () {
        $('body').css('opacity', 1);
    }, 300);
});