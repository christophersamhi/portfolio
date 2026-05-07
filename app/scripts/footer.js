import $ from "jquery/dist/jquery.min.js";

$(document).ready(function () {
    $(function () {
        $.get("./components/footer.html", function (data) {
            $(".footer-placeholder").replaceWith(data);
        });
    });
});