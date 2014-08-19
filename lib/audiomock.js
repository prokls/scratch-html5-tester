// JS version of
// https://github.com/jsantell/allen/blob/master/test/mocks/mockContext.coffee
var module = function() {

    var __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) {
            for (var key in parent) {
                if (__hasProp.call(parent, key))
                    child[key] = parent[key];
            }

            function ctor() {
                this.constructor = child;
            }
            ctor.prototype = parent.prototype;
            child.prototype = new ctor();
            child.__super__ = parent.prototype;
            return child;
        };

    AudioNode = (function() {
        function AudioNode() {}

        AudioNode.prototype.connect = function() {};

        AudioNode.prototype.disconnect = function() {};

        AudioNode.prototype.AudioContext = void 0;

        AudioNode.prototype.numberOfInputs = 1;

        AudioNode.prototype.numberOfOutputs = 1;

        return AudioNode;

    })();

    AudioSourceNode = (function(_super) {
        __extends(AudioSourceNode, _super);

        function AudioSourceNode() {
            return AudioSourceNode.__super__.constructor.apply(this, arguments);
        }

        AudioSourceNode.prototype.numberOfInputs = 0;

        return AudioSourceNode;

    })(AudioNode);

    AudioDestinationNode = (function(_super) {
        __extends(AudioDestinationNode, _super);

        function AudioDestinationNode() {
            return AudioDestinationNode.__super__.constructor.apply(this, arguments);
        }

        AudioDestinationNode.prototype.numberOfOutputs = 0;

        return AudioDestinationNode;

    })(AudioNode);

    AudioParam = (function() {
        function AudioParam() {}
        AudioParam.prototype.cancelScheduledValues = function() {};
        AudioParam.prototype.exponentialRampToValueAtTime = function() {};
        AudioParam.prototype.linearRampToValueAtTime = function() {};
        AudioParam.prototype.setTargetValueAtTime = function() {};
        AudioParam.prototype.setValueAtTime = function() {};
        AudioParam.prototype.setValueCurveAtTime = function() {};
        return AudioParam;
    })();

    AudioBufferSourceNode = (function(_super) {
        __extends(AudioBufferSourceNode, _super);

        function AudioBufferSourceNode() {
            return AudioBufferSourceNode.__super__.constructor.apply(this, arguments);
        }

        return AudioBufferSourceNode;

    })(AudioSourceNode);

    MediaElementAudioSourceNode = (function(_super) {
        __extends(MediaElementAudioSourceNode, _super);

        function MediaElementAudioSourceNode(mediaElement) {
            var type, _ref, _ref1;
            this.mediaElement = mediaElement;
            type = (_ref = this.mediaElement) != null ? (_ref1 = _ref.constructor) != null ? _ref1.name : void 0 : void 0;
            if (type !== 'HTMLAudioElement' || type !== 'HTMLVideoElement' || type !== 'HTMLMediaElement') {
                console.log('error');
            }
        }

        return MediaElementAudioSourceNode;

    })(AudioSourceNode);

    MediaStreamAudioSourceNode = (function(_super) {
        __extends(MediaStreamAudioSourceNode, _super);

        function MediaStreamAudioSourceNode(mediaStream) {
            var type, _ref, _ref1;
            this.mediaStream = mediaStream;
            type = (_ref = this.mediaStream) != null ? (_ref1 = _ref.constructor) != null ? _ref1.name : void 0 : void 0;
            if (type !== 'LocalMediaStream') {
                throw new Error('INVALID_STATE_ERR: DOM Exception 11');
            }
        }

        return MediaStreamAudioSourceNode;

    })(AudioSourceNode);

    OscillatorNode = (function(_super) {
        __extends(OscillatorNode, _super);

        function OscillatorNode() {
            return OscillatorNode.__super__.constructor.apply(this, arguments);
        }

        return OscillatorNode;

    })(AudioSourceNode);

    ScriptProcessorNode = (function(_super) {
        __extends(ScriptProcessorNode, _super);

        function ScriptProcessorNode(bufferSize) {
            this.bufferSize = bufferSize;
            if (this.bufferSize == null) {
                throw new Error('Not enough arguments');
            }
        }

        return ScriptProcessorNode;

    })(AudioNode);

    JavaScriptNode = (function(_super) {
        __extends(JavaScriptNode, _super);

        function JavaScriptNode(bufferSize) {
            this.bufferSize = bufferSize;
            if (this.bufferSize == null) {
                throw new Error('Not enough arguments');
            }
        }

        return JavaScriptNode;

    })(AudioNode);

    AnalyserNode = (function(_super) {
        __extends(AnalyserNode, _super);

        function AnalyserNode() {
            return AnalyserNode.__super__.constructor.apply(this, arguments);
        }

        return AnalyserNode;

    })(AudioNode);

    GainNode = (function(_super) {
        __extends(GainNode, _super);

        function GainNode() {
            var AudioGain;
            this.gain = new(AudioGain = (function(_super1) {
                __extends(AudioGain, _super1);

                function AudioGain() {
                    return AudioGain.__super__.constructor.apply(this, arguments);
                }

                return AudioGain;

            })(AudioParam))();
        }

        return GainNode;

    })(AudioNode);

    DelayNode = (function(_super) {
        __extends(DelayNode, _super);

        function DelayNode() {
            return DelayNode.__super__.constructor.apply(this, arguments);
        }

        return DelayNode;

    })(AudioNode);

    BiquadFilterNode = (function(_super) {
        __extends(BiquadFilterNode, _super);

        function BiquadFilterNode() {
            return BiquadFilterNode.__super__.constructor.apply(this, arguments);
        }

        return BiquadFilterNode;

    })(AudioNode);

    WaveShaperNode = (function(_super) {
        __extends(WaveShaperNode, _super);

        function WaveShaperNode() {
            return WaveShaperNode.__super__.constructor.apply(this, arguments);
        }

        return WaveShaperNode;

    })(AudioNode);

    PannerNode = (function(_super) {
        __extends(PannerNode, _super);

        function PannerNode() {
            return PannerNode.__super__.constructor.apply(this, arguments);
        }

        return PannerNode;

    })(AudioNode);

    ConvolverNode = (function(_super) {
        __extends(ConvolverNode, _super);

        function ConvolverNode() {
            return ConvolverNode.__super__.constructor.apply(this, arguments);
        }

        return ConvolverNode;

    })(AudioNode);

    ChannelSplitterNode = (function(_super) {
        __extends(ChannelSplitterNode, _super);

        function ChannelSplitterNode() {
            return ChannelSplitterNode.__super__.constructor.apply(this, arguments);
        }

        return ChannelSplitterNode;

    })(AudioNode);

    ChannelMergerNode = (function(_super) {
        __extends(ChannelMergerNode, _super);

        function ChannelMergerNode() {
            return ChannelMergerNode.__super__.constructor.apply(this, arguments);
        }

        return ChannelMergerNode;

    })(AudioNode);

    DynamicsCompressorNode = (function(_super) {
        __extends(DynamicsCompressorNode, _super);

        function DynamicsCompressorNode() {
            return DynamicsCompressorNode.__super__.constructor.apply(this, arguments);
        }

        return DynamicsCompressorNode;

    })(AudioNode);

    WaveTable = (function() {
        function WaveTable() {}

        return WaveTable;

    })();

    AudioListener = (function() {
        function AudioListener() {}

        AudioListener.prototype.dopplerFactor = 1;

        AudioListener.prototype.speedOfSound = 343.3;

        return AudioListener;

    })();

    AudioBuffer = (function() {
        function AudioBuffer(numberOfChannels, length, sampleRate) {
            this.numberOfChannels = numberOfChannels;
            this.length = length;
            this.sampleRate = sampleRate;
        }

        AudioBuffer.prototype.getChannelData = function() {
            return new Float32Array(32);
        };

        AudioBuffer.prototype.gain = 1;

        AudioBuffer.prototype.duration = 0;

        return AudioBuffer;

    })();

    AudioContext = (function() {
        function AudioContext() {
            this.destination = new AudioDestinationNode();
            this.listener = new AudioListener();
        }

        AudioContext.prototype.activeSourceCount = 0;

        AudioContext.prototype.sampleRate = 44100;

        AudioContext.prototype.currentTime = 0;

        AudioContext.prototype.createBuffer = function(channels, length, rate) {
            return new AudioBuffer(channels, length, rate);
        };

        AudioContext.prototype.decodeAudioData = function() {};

        AudioContext.prototype.createBufferSource = function() {
            return new AudioBufferSourceNode();
        };

        AudioContext.prototype.createMediaElementSource = function(mediaElement) {
            return new MediaElementAudioSourceNode(mediaElement);
        };

        AudioContext.prototype.createMediaStreamSource = function() {
            return new MediaStreamAudioSourceNode();
        };

        AudioContext.prototype.createOscillator = function() {
            return new OscillatorNode();
        };

        AudioContext.prototype.createScriptProcessor = function(bufferSize) {
            return new ScriptProcessorNode(bufferSize);
        };

        AudioContext.prototype.createAnalyser = function() {
            return new AnalyserNode();
        };

        AudioContext.prototype.createGain = function() {
            return new GainNode();
        };

        AudioContext.prototype.createDelay = function() {
            return new DelayNode();
        };

        AudioContext.prototype.createBiquadFilter = function() {
            return new BiquadFilterNode();
        };

        AudioContext.prototype.createWaveShaper = function() {
            return new WaveShaperNode();
        };

        AudioContext.prototype.createPanner = function() {
            return new PannerNode();
        };

        AudioContext.prototype.createConvolver = function() {
            return new ConvolverNode();
        };

        AudioContext.prototype.createChannelSplitter = function() {
            return new ChannelSplitterNode();
        };

        AudioContext.prototype.createChannelMerger = function() {
            return new ChannelMergerNode();
        };

        AudioContext.prototype.createDynamicsCompressor = function() {
            return new DynamicsCompressorNode();
        };

        AudioContext.prototype.createWaveTable = function() {
            return new WaveTable();
        };

        AudioContext.prototype.createJavaScriptNode = function(bufferSize) {
            return new JavaScriptNode(bufferSize);
        };

        AudioContext.prototype.createGainNode = function() {
            return this.createGain();
        };

        AudioContext.prototype.createDelayNode = function() {
            return this.createDelay();
        };

        return AudioContext;

    })();

    /*return {
        AudioNode : AudioNode,
        AudioSourceNode : AudioSourceNode,
        AudioDestinationNode : AudioDestinationNode,
        AudioParam : AudioParam,
        AudioBufferSourceNode : AudioBufferSourceNode,
        MediaElementAudioSourceNode : MediaElementAudioSourceNode,
        MediaStreamAudioSourceNode : MediaStreamAudioSourceNode,
        OscillatorNode : OscillatorNode,
        ScriptProcessorNode : ScriptProcessorNode,
        JavaScriptNode : JavaScriptNode,
        AnalyserNode : AnalyserNode,
        GainNode : GainNode,
        DelayNode : DelayNode,
        BiquadFilterNode : BiquadFilterNode,
        WaveShaperNode : WaveShaperNode,
        PannerNode : PannerNode,
        ConvolverNode : ConvolverNode,
        ChannelSplitterNode : ChannelSplitterNode,
        ChannelMergerNode : ChannelMergerNode,
        DynamicsCompressorNode : DynamicsCompressorNode,
        WaveTable : WaveTable,
        AudioListener : AudioListener,
        AudioBuffer : AudioBuffer,
        AudioContext : AudioContext
    };*/
};


// https://github.com/ttaubert/node-arraybuffer-slice
// (c) 2014 Tim Taubert <tim@timtaubert.de>
// arraybuffer-slice may be freely distributed under the MIT license.
(function(undefined) {
    "use strict";

    function clamp(val, length) {
        val = (val | 0) || 0;
        if (val < 0) {
            return Math.max(val + length, 0);
        }
        return Math.min(val, length);
    }
    if (!ArrayBuffer.prototype.slice) {
        ArrayBuffer.prototype.slice = function(from, to) {
            var length = this.byteLength;
            var begin = clamp(from, length);
            var end = length;
            if (to !== undefined) {
                end = clamp(to, length);
            }
            if (begin > end) {
                return new ArrayBuffer(0);
            }
            var num = end - begin;
            var target = new ArrayBuffer(num);
            var targetArray = new Uint8Array(target);
            var sourceArray = new Uint8Array(this, begin, num);

            targetArray.set(sourceArray);

            return target;

            /*var sourceArray = [];
            for (var i = begin; i < num; i++) {
              //sourceArray.push(this[i] % 256);
              sourceArray.push(Math.pow(i, 23) % 256);
            }

            return sourceArray;*/
        };
    }
})();

Function.prototype.apply = function(thisArg, argArray) {
    if (typeof this != "function") {
        throw new Error("apply called on incompatible " +
            "object (not a function)");
    }
    if (argArray instanceof Uint8Array) {
        var newArray = [];
        for (var i = 0; i < argArray.length; i++) {
            newArray.push(argArray[i]);
        }
        /*var readSize = argArray.length - 8;
        newArray[0] = "R".charCodeAt(0);
        newArray[1] = "I".charCodeAt(0);
        newArray[2] = "F".charCodeAt(0);
        newArray[3] = "F".charCodeAt(0);
        / *newArray[4] = readSize % 256;
        newArray[5] = (readSize / 256) % 256;
        newArray[6] = (readSize / (256 * 256)) % 256;
        newArray[7] = (readSize / (256 * 256 * 256)) % 256;
        newArray[8] = "W".charCodeAt(0);
        newArray[9] = "A".charCodeAt(0);
        newArray[10] = "V".charCodeAt(0);
        newArray[11] = "E".charCodeAt(0);*/
        argArray = newArray;
    }
    if (argArray != null && !(argArray instanceof Array) && typeof argArray.callee != "function") {
        throw new Error("The 2nd argument to apply must " +
            "be an array or arguments object");
    }

    thisArg = (thisArg == null) ? window : Object(thisArg);
    thisArg.__applyTemp__ = this;

    // youngpup's hack
    var parameters = [],
        length = (argArray || "").length >>> 0;
    for (var i = 0; i < length; i++) {
        parameters[i] = "argArray[" + i + "]";
    };
    var functionCall =
        "thisArg.__applyTemp__(" + parameters + ")";

    try {
        return eval(functionCall)
    } finally {
        try {
            delete thisArg.__applyTemp__
        } catch (e) {
            /* ignore */
        }
    }
}

Function.prototype.call = function(thisArg) {
    return this.apply(thisArg,
        Array.prototype.slice.apply(arguments, [1]));
}


module();
