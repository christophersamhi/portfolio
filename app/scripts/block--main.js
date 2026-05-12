import $ from "jquery/dist/jquery.min.js";

$(document).ready(function () {
    $.get("./components/block--main.html", function (data) {
        $(".block--main-placeholder").replaceWith(data);
    });
});
