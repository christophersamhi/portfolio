import $ from "jquery/dist/jquery.min.js";

$(document).ready(function () {
    $.get("./components/block--equipe.html", function (data) {
        $(".block--equipe-placeholder").replaceWith(data);
    });
});
