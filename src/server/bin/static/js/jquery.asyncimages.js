(function ($) {

    $.fn.imageAsync = function (options) {
        var settings = $.extend({}, $.fn.imageAsync.defaults, options);

        return this.each(function () {

            if ($(this).attr('src')) {

                var originalImageSrc = $(this).attr('src');
                var imgHeight = $(this).attr('height'); // bug in firefox: even if img has no height attr, it will come back as 16
                var imgWidth = $(this).attr('width');

                // bug in Firefox when setting src='' OR removing src attribute which causes a double request for an image
                // A better idea would be to set source to a very small, 1x1 gif

                var originalImage = $(this)
            .attr('src', 'images/blankartwork.png')
            .wrap('<span class="' + settings.progressClassName + '"></span>')
            .parent('span')
            .css('display', 'inline-block')
            .width(imgWidth)
            .height(imgHeight);

                var img = new Image();
                $(img)
            .load(function () { originalImage.replaceWith(this); })
            .error(function () { })
            .attr('src', originalImageSrc)
            .attr('width', imgWidth)
            .attr('height', imgHeight);

            }

        });

    }

    $.fn.imageAsync.defaults = {
        progressClassName: "progress"
    };

})(jQuery);