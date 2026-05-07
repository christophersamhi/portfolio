import $ from "jquery/dist/jquery.min.js";

$(document).ready(function () {
    $(function () {
        $.get("./components/header.html", function (data) {
            $(".header-placeholder").replaceWith(data);
        });
    });
});