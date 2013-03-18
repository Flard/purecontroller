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

        led11: 201,
        led12: 208,
        led13: 209,

        led21: 211,
        led22: 218,
        led23: 219
    },

    outputs: new Array(512),
    bindings: {},
    bindingsRgb: {},

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
            if (id == 'led_r') {
                var values = [this.value, false, false];
            } else if (id == 'led_g') {
                var values = [false, this.value, false];
            } else if (id == 'led_b') {
                var values = [false, false, this.value];
            }
            PureController.setValue('led11,led12,led13,led21,led22,led23', values);

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

        });

        $('*[data-type=output-rgb]').each(function() {
            var key = $(this).data('bind');
            if (!PureController.bindingsRgb[key]) {
                PureController.bindingsRgb[key] = [ this ];
            } else {
                PureController.bindingsRgb[key].push(this);
            }

        });

        for(var key in PureController.config) {

            PureController.setValue(key, 0);

        }

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
        if (typeof value === 'array') {
            for(var i=0;i<value.length;i++ ){
                if (value[i] !== false) {
                    PureController.outputs[channels+i] = value[i];
                }
            }
        } else {
            PureController.outputs[channel] = value;
        }

        if (PureController.bindings[channelName]) {
            for(var i=0;i<PureController.bindings[channelName].length;i++) {
                var element = PureController.bindings[channelName][i];
                element.style.backgroundColor = 'rgb('+value+','+value+','+value+')';
            };
        } else if(PureController.bindingsRgb[channelName]) {

            for(var i=0;i<PureController.bindingsRgb[channelName].length;i++) {
                var element = PureController.bindingsRgb[channelName][i];

                element.style.backgroundColor = 'rgb('+value[0]+','+value[1]+','+value[2]+')';
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
            PureController.setValue('led11,led12,led13,led21,led22,led23', values);
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
            var newValues = [(from[0] + (((values[0] - from[0]) / steps) * step)),
                             (from[1] + (((values[1] - from[1]) / steps) * step)),
                             (from[2] + (((values[2] - from[2]) / steps) * step))];
            $('input[type=range]#led_r').val(newValues[0]);
            $('input[type=range]#led_g').val(newValues[1]);
            $('input[type=range]#led_b').val(newValues[2]);
            PureController.setValue('led11,led12,led13,led21,led22,led23', newValues);
            //$('input[type=range]').trigger('change');

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
