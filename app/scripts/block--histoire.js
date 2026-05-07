import $ from "jquery/dist/jquery.min.js";
import Swiper from "swiper";
import "swiper/css";

$(document).ready(function () {

    $.get("./components/block--histoire.html", function (data) {
        $(".block--histoire-placeholder").replaceWith(data);
    });
});