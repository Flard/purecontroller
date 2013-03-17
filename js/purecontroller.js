var PureController = {

    config: {
        fan1: 100,
        fan2: 120,
        fog1: 101,
        fog2: 121,
        par1: 103,
        par2: 104,
        acl11: 1,
        acl12: 2,
        acl13: 3,
        acl14: 4,
        acl21: 5,
        acl22: 6,
        acl23: 7,
        acl24: 9,

        led11: 200,
        led12: 201,
        led13: 203,

        led21: 204,
        led22: 205,
        led23: 206
    },

    init: function() {

        $('button[data-type=channel]').on('mousedown', function() {

            var key = $(this).data('id');
            PureController.setValue(key, 255);

        }).on('mouseup', function() {

           var key = $(this).data('id');
           $(this).removeClass('btn-info');
           PureController.setValue(key, 0);

        }).on('dblclick', function() {

            var key = $(this).data('id');
            PureController.setValue(key, 255);
            $(this).addClass('btn-info');

        });

        $('input[type=range]').on('change', function() {
            var id = this.id;
            PureController.setValue(id, this.value);
            PureController.updatePreview();
        });

        $('button[data-type=ledpreset]').on('click', function() {
            var value = $(this).data('value');
            var values = value.split(',');
            var time = $(this).data('fade');
            PureController.fadeLed(values, time);
        });


    },

    updatePreview: function() {
        var r = parseInt($('input[type=range]#led_r').val()),
            g = parseInt($('input[type=range]#led_g').val()),
            b = parseInt($('input[type=range]#led_b').val())
        $('#rgb-preview').css('background-color', 'rgb('+r+','+g+','+b+')');
    },

    setValue: function(channel, value) {
        console.log(channel+': '+value);
    },

    _ledFade: false,
    fadeLed: function(values, time) {
        window.clearTimeout(PureController._ledFade);
        if (typeof time === 'undefined') {
            time = 3000;
        }
        var interval = 30, step = 0;

        if (time === 0) {
            $('input[type=range]#led_r').val(values[0]);
            $('input[type=range]#led_g').val(values[1]);
            $('input[type=range]#led_b').val(values[2]);
            $('input[type=range]').trigger('change');
            return;
        }

        var from = [
            parseInt($('input[type=range]#led_r').val()),
            parseInt($('input[type=range]#led_g').val()),
            parseInt($('input[type=range]#led_b').val())
        ];

        var steps = time / interval;

        var animFrame = function() {
            console.log(from[0], values[0], (((values[0] - from[0]) / steps) * step), from[0] + (((values[0] - from[0]) / steps) * step), step);
            $('input[type=range]#led_r').val(from[0] + (((values[0] - from[0]) / steps) * step));
            $('input[type=range]#led_g').val(from[1] + (((values[1] - from[1]) / steps) * step));
            $('input[type=range]#led_b').val(from[2] + (((values[2] - from[2]) / steps) * step));
            $('input[type=range]').trigger('change');

            step++;

            if (step <= steps) {
                PureController._ledFade = window.setTimeout(function() {
                    animFrame();
                }, interval);
            }
        };

        animFrame();

    }
};

Zepto(function($) {
    PureController.init();
});
