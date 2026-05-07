import $ from "jquery/dist/jquery.min.js";

$(document).ready(function () {
    $(function () {
        $.get("./components/block--services.html", function (data) {
            $(".block--services-placeholder").replaceWith(data);
        });
    });
});