import $ from "jquery/dist/jquery.min.js";
import Swiper from "swiper";
import "swiper/css";

$(document).ready(function () {

    $.get("./components/block--main.html", function (data) {
        $(".block--main-placeholder").replaceWith(data);
    });
});