import $ from "jquery/dist/jquery.min.js";
import Swiper from "swiper";
import "swiper/css";

$(document).ready(function () {

    $.get("./components/block--equipe.html", function (data) {
        $(".block--equipe-placeholder").replaceWith(data);
    });
});