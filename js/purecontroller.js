var PureController = {

    config: {
        fan1: 1,
        fan2: 2,
        fog1: 3,
        fog2: 4,
        par1: 5,
        par2: 6,
        acl11: 7,
        acl12: 8,
        acl13: 9,
        acl14: 10,
        acl21: 11,
        acl22: 12,
        acl23: 13,
        acl24: 14,

        led11R: 201,
        led11G: 202,
        led11B: 203,
        led12R: 204,
        led12G: 205,
        led13R: 206,
        led13R: 207,
        led13G: 208,
        led13B: 209,

        led21R: 211,
        led21G: 212,
        led21B: 213,
        led22R: 214,
        led22G: 215,
        led23R: 216,
        led23R: 217,
        led23G: 218,
        led23B: 219
    },

    outputs: new Array(512),
    bindings: {},

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

        $('*[data-type=output]').each(function() {
            var key = $(this).data('bind');
            if (!PureController.bindings[key]) {
                PureController.bindings[key] = [ this ];
            } else {
                PureController.bindings[key].push(this);
            }

        })

        for(var key in PureController.config) {

            PureController.setValue(key, 0);

        }

    },

    updatePreview: function() {
        var r = parseInt($('input[type=range]#led_r').val()),
            g = parseInt($('input[type=range]#led_g').val()),
            b = parseInt($('input[type=range]#led_b').val())
        $('#rgb-preview div').css('background-color', 'rgb('+r+','+g+','+b+')');
    },

    setValue: function(channelName, value) {
        if (channelName.indexOf(',') >= 0) {
            var channelNames = channelName.split(',');
            for(var i = 0;i<channelNames.length;i++) {
                PureController.setValue(channelNames[i],value);
            }
            return;
        }

        var channel = PureController.config[channelName];
        PureController.outputs[channel] = value;

        if (PureController.bindings[channelName]) {
            for(var i=0;i<PureController.bindings[channelName].length;i++) {
                var element = PureController.bindings[channelName][i];
                element.style.backgroundColor = 'rgb('+value+','+value+','+value+')';
            };
        } else {
            console.warn('control '+channelName+' not found');
        }


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
