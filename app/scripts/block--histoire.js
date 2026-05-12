import $ from "jquery/dist/jquery.min.js";

$(document).ready(function () {
    $.get("./components/block--histoire.html", function (data) {
        $(".block--histoire-placeholder").replaceWith(data);
    });
});
