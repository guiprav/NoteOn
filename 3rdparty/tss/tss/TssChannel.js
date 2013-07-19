/**
 * T'SoundSystem for JavaScript
 */

/**
 * TssChannel prototype
 *
 * This prototype implements virtual sound devices which are used in
 * original T'SS v1 series.
 * @author Takashi Toyoshima <toyoshim@gmail.com>
 *
 * @constructor
 */
function TssChannel () {
    this.buffer = null;
    this.fmBuffer = [ null, null, null, null ];
    this.player = null;
    this.module = [];
    this.timer = [
        { enable: false, timer: 0, count: 0, self: null, callback: null },
        { enable: false, timer: 0, count: 0, self: null, callback: null }
    ];
    this.maxChannel = 0;
    this.wave = [];
}

TssChannel.MODULE_CHANNEL_L = 0;
TssChannel.MODULE_CHANNEL_R = 1;
TssChannel.FM_OUT_MODE_OFF = 0;
TssChannel.FM_OUT_MODE_NEW = 1;
TssChannel.FM_OUT_MODE_ADD = 2;
TssChannel._RND_TABLE = new Int8Array(4096);
TssChannel._SIN_TABLE = new Int8Array(256);

// Calculate tables.
(function () {
    var i;
    for (i = 0; i < 4096; i++) {
        var u8 = ((~~(Math.random() * 0x7fffffff)) >> 8) & 0xff;
        if (u8 >= 0x80)
            u8 = u8 - 0x100;
        TssChannel._RND_TABLE[i] = u8;
    }

    for (i = 0; i < 256; i++)
        TssChannel._SIN_TABLE[i] = ~~(Math.sin(Math.PI * i / 128) * 64 + 0.5);
})();

/**
 * @see MasterChannel
 * @param length buffer length or size in shorts
 */
TssChannel.prototype.setBufferLength = function (length) {
    this.buffer = new Int32Array(length);
    for (var i = 0; i < 4; i++) {
        this.fmBuffer[i] = new Int32Array(length);
    }
};

/**
 * @see MasterChannel
 * @return audio stream buffer
 */
TssChannel.prototype.getBuffer = function () {
    return this.buffer;
};

/**
 * @see MasterChannel
 * @param newPlayer player to call back
 */
TssChannel.prototype.setPlayer = function (newPlayer) {
    this.player = newPlayer;
};

/**
 * @see MasterChannel
 * @param length sound length in short to generate
 */
TssChannel.prototype.generate = function (length) {
    var offset = 0;
    while (offset < length) {
        var timerCount = (length - offset) >> 2;
        var timerId;
        for (timerId = 0; timerId < 2; timerId++) {
            if (this.timer[timerId].enable &&
                    (this.timer[timerId].count < timerCount))
                timerCount = this.timer[timerId].count;
        }
        var generateCount = timerCount << 2;
        this._generateInternal(offset, generateCount);
        offset += generateCount;
        for (timerId = 0; timerId < 2; timerId++) {
            if (!this.timer[timerId].enable)
                continue;
            this.timer[timerId].count -= timerCount;
            if (0 != this.timer[timerId].count)
                continue;
            // Invoke callback.
            this.timer[timerId].count = this.timer[timerId].timer;
            this.timer[timerId].callback.apply(this.timer[timerId].self);
        }
    }
};

/**
 * Check if the module channele id is in range of maxChannel.
 * @param id module channel id
 * @throws RangeError module channel id is out of range of maxChannel
 */
TssChannel.prototype._CheckId = function (id) {
    if ((typeof id == "undefined") || (id > this.maxChannel))
        throw new RangeError("TSC: Invalid module channel: " + id);
};

/**
 * Set max channel number.
 * @param maxChannel max channel number
 */
TssChannel.prototype.setMaxChannel = function (maxChannel) {
    this.maxChannel = maxChannel;
    for (var ch = 0; ch < maxChannel; ch++)
        this.module[ch] = new TssChannel.Module(this, ch);
};

/**
 * Set wave data.
 * @param id table id
 * @param wave wave data of Int8Array
 */
TssChannel.prototype.setWave = function (id, wave) {
    Log.getLog().info("TSC: Set wave table " + id);
    Log.getLog().info(wave);
    this.wave[id] = wave;
};

/**
 * Set timer callback. Timer will be disabled if callback is null.
 * @param id timer id which must be 0 or 1
 * @param count timer count by sampling number
 * @param callback callback function
 */
TssChannel.prototype.setTimerCallback = function (id, count, self, callback) {
    console.log(new Error().stack);
    if (id > 2)
        return;
    if ((null != callback) && (count <= 0))
        return;
    this.timer[id] = {
        enable: null != callback,
        timer: count,
        count: count,
        self: self,
        callback: callback
    };
};

/**
 * Set module frequency.
 * @param id module id
 * @param frequency frequency
 * @throws RangeError module channel id is out of range of maxChannel
 */
TssChannel.prototype.setModuleFrequency = function (id, frequency) {
    this._CheckId(id);
    this.module[id].frequency = frequency;
};

/**
 * Set module volume.
 * @param id module id
 * @param ch channel
 * @param volume volume
 * @throws RangeError module channel id is out of range of maxChannel
 */
TssChannel.prototype.setModuleVolume = function (id, ch, volume) {
    this._CheckId(id);
    if (ch == TssChannel.MODULE_CHANNEL_L)
        this.module[id].volume.l = volume;
    else if (ch == TssChannel.MODULE_CHANNEL_R)
        this.module[id].volume.r = volume;
    else
        Log.getLog().error("TSC: Invalid volume channel: " + ch);
};

/**
 * Get module volume.
 * @param id module id
 * @param ch channel
 * @throws RangeError module channel id or channel id is out of range
 */
TssChannel.prototype.getModuleVolume = function (id, ch) {
    this._CheckId(id);
    if (ch == TssChannel.MODULE_CHANNEL_L)
        return this.module[id].volume.l;
    else if (ch == TssChannel.MODULE_CHANNEL_R)
        return this.module[id].volume.r;
    throw new RangeError("TSC: Invalid volume channel:" + id)
};

/**
 * Set module device type
 * @param id module id
 * @param type device type id
 * @throws RangeError module channel id is out of range of maxChannel
 */
TssChannel.prototype.setModuleType = function (id, type) {
    this._CheckId(id);
    this.module[id].setType(type);
    if (TssChannel.Module.TYPE_SCC == type) {
        if (!this.wave[0])
            Log.getLog().warn("TSC: wave table 0 not found");
    }
};

/**
 * Get module device type
 * @param id module id
 * @return device type id
 * @throws RangeError module channel id is out of range of maxChannel
 */
TssChannel.prototype.getModuleType = function (id) {
    this._CheckId(id);
    return this.module[id].type;
};

/**
 * Set module voice.
 * @param id module id
 * @param voice voice id
 * @throws RangeError module channel id is out of range of maxChannel
 */
TssChannel.prototype.setModuleVoice = function (id, voice) {
    this._CheckId(id);
    this.module[id].voice = voice;
    var type = this.getModuleType(id);
    if (TssChannel.Module.TYPE_SCC == type) {
        if (!this.wave[voice])
            Log.getLog().warn("TSC: wave table " + voice + " not found");
    }
};

/**
 * Set module fm input pipe.
 * @see TssChannel.Module.setFmInPipe
 * @param id module id
 * @param rate modulation rate
 * @param pipe pipe id
 * @throws RangeError module channel id is out of range of maxChannel
 */
TssChannel.prototype.setModuleFmInPipe = function (id, rate, pipe) {
    this._CheckId(id);
    this.module[id].setFmInPipe(rate, pipe);
};

/**
 * Set module fm output pipe.
 * @see TssChannel.Module.setFmOutPipe
 * @param id module id
 * @param mode connection mode
 * @param pipe pipe id
 * @throws RangeError module channel id is out of range of maxChannel
 */
TssChannel.prototype.setModuleFmOutPipe = function (id, mode, pipe) {
    this._CheckId(id);
    this.module[id].setFmOutPipe(mode, pipe);
};

/**
 * Set module phase.
 * @param id module id
 * @param phase phase to set
 * @throws RangeError module channel id is out of range of maxChannel
 */
TssChannel.prototype.setModulePhase = function (id, phase) {
    this._CheckId(id);
    this.module[id].phase = phase;
};

/**
 * Generate sounds into a partial buffer.
 * @param offset offset in buffer to start
 * @param count sie to generate
 */
TssChannel.prototype._generateInternal = function (offset, count) {
    var buffer = this.buffer.subarray(offset, offset + count);
    var fmBuffer = [
        this.fmBuffer[0].subarray(offset, offset + count),
        this.fmBuffer[1].subarray(offset, offset + count),
        this.fmBuffer[2].subarray(offset, offset + count),
        this.fmBuffer[3].subarray(offset, offset + count)
    ];
    for (var i = 0; i < count; i++)
        buffer[i] = 0;
    for (var ch = 0; ch < this.maxChannel; ch++)
        this.module[ch].generate(buffer, fmBuffer);
};

/**
 * Module prototype
 *
 * This prototype implements inner class to emulate sound devices.
 * @constructor
 * @param channel parent channel object
 * @param ch module id
 */
TssChannel.Module = function (channel, ch) {
    this.id = ch;
    this.channel = channel;
    this.volume = {
        l: 0,
        r: 0
    };
    this.frequency = 0;
    this.fm = {
        inRate: 0,
        inPipe: 0,
        outMode: 0,
        outPipe: 0
    };
    this.multiple = 1;
    this.setType(TssChannel.Module.TYPE_PSG);
};

TssChannel.Module.TYPE_INVALID = -1;
TssChannel.Module.TYPE_PSG = 0;
TssChannel.Module.TYPE_FC = 1;
TssChannel.Module.TYPE_NOISE = 2;
TssChannel.Module.TYPE_SIN = 3;
TssChannel.Module.TYPE_SCC = 4;
TssChannel.Module.TYPE_OSC = 5;  // TODO
TssChannel.Module.TYPE_GB_SQUARE = 13;  // TODO
TssChannel.Module.TYPE_GB_WAVE = 14;  // TODO

/**
 * Set module device type.
 * @param type device type id
 */
TssChannel.Module.prototype.setType = function (type) {
    this.type = type;
    this.count = 0;
    this.phase = 0;
    this.voice = 0;
    switch (type) {
        case TssChannel.Module.TYPE_PSG:
            this.generate = this.generatePsg;
            break;
        case TssChannel.Module.TYPE_FC:
            this.generate = this.generateFc;
            this.voice = 3;
            break;
        case TssChannel.Module.TYPE_NOISE:
            this.generate = this.generateNoise;
            break;
        case TssChannel.Module.TYPE_SCC:
            this.generate = this.generateScc;
            break;
        case TssChannel.Module.TYPE_SIN:
            this.generate = this.generateSin;
            break;
        default:
            // TODO: Implement other types.
            Log.getLog().warn("TSC: unknown device type " + type);
            this.generate = this.generatePsg;
            break;
    }
};

/**
 * Set frequency modulation input pipe connection. The input pipe affect
 * pow(-2, rate) if rate is not 0. Otherwise, Pipe is not used.
 * @param rate input rate
 * @param pipe pipe id
 */
TssChannel.Module.prototype.setFmInPipe = function (rate, pipe) {
    this.fm.inRate = rate;
    this.fm.inPipe = pipe;
};

/**
 * Set frequency modulation output pipe connection.
 * @param mode connection mode
 *      TssChannel.FM_OUT_MODE_OFF: Don't use frequency modulation
 *      TssChannel.FM_OUT_MODE_ADD: Add output into specified pipe
 *      TssChannel.FM_OUT_MODE_NEW: Write output into specified pipe
 * @param pipe pipe id
 */
TssChannel.Module.prototype.setFmOutPipe = function (mode, pipe) {
    this.fm.outMode = mode;
    this.fm.outPipe = pipe;
};

/**
 * Generate a PSG-like sound.
 * @param buffer Int32Array to which generate sound
 * @param fmBuffer Int32Array to which output fm data, or from which input one
 */
TssChannel.Module.prototype.generatePsg = function (buffer, fmBuffer) {
    var volumeL = this.volume.l << 4;
    var volumeR = this.volume.r << 4;
    var length = buffer.length;
    var plus = this.frequency * 2 * this.multiple;
    var count = this.count;
    var phase = this.phase;
    if (0 == phase) {
        volumeL = -volumeL;
        volumeR = -volumeR;
    }
    for (var i = 0; i < length; i += 2) {
        buffer[i + 0] += volumeL;
        buffer[i + 1] += volumeR;
        count += plus;
        while (count > MasterChannel.SAMPLE_FREQUENCY) {
            volumeL = -volumeL;
            volumeR = -volumeR;
            count -= MasterChannel.SAMPLE_FREQUENCY;
            phase++;
            phase &= 1;
        }
    }
    this.count = count;
    this.phase = phase;
};

/**
 * Generate a NES-like sound.
 * @param buffer Int32Array to which generate sound
 * @param fmBuffer Int32Array to which output fm data, or from which input one
 */
TssChannel.Module.prototype.generateFc = function (buffer, fmBuffer) {
    var volumeL = this.volume.l << 4;
    var volumeR = this.volume.r << 4;
    var length = buffer.length;
    var plus = this.frequency * 8 * this.multiple;
    var count = this.count;
    var phase = this.phase;
    var voice = this.voice;
    if (phase < voice) {
        volumeL = -volumeL;
        volumeR = -volumeR;
    }
    for (var i = 0; i < length; i += 2) {
        buffer[i + 0] += volumeL;
        buffer[i + 1] += volumeR;
        count += plus;
        while (count > MasterChannel.SAMPLE_FREQUENCY) {
            count -= MasterChannel.SAMPLE_FREQUENCY;
            phase++;
            phase &= 7;
            if ((phase == 0) || (phase == voice)) {
                volumeL = -volumeL;
                volumeR = -volumeR;
            }
        }
    }
    this.count = count;
    this.phase = phase;
};

/**
 * Generate a noise sound. The noise is not white noise (maybe brawn?).
 * @param buffer Int32Array to which generate sound
 * @param fmBuffer Int32Array to which output fm data, or from which input one
 */
TssChannel.Module.prototype.generateNoise = function (buffer, fmBuffer) {
    var volumeL = this.volume.l >> 2;
    var volumeR = this.volume.r >> 2;
    var length = buffer.length;
    var plus = this.frequency * this.multiple;
    var count = this.count;
    var phase = this.phase;
    for (var i = 0; i < length; i += 2) {
        var rnd = TssChannel._RND_TABLE[phase];
        buffer[i + 0] += rnd * volumeL;
        buffer[i + 1] += rnd * volumeR;
        count += plus;
        while (count > 0) {
            phase++;
            phase &= 0x0fff;
            count -= 880;
        }
    }
    this.count = count;
    this.phase = phase;
};

TssChannel.Module.prototype.generateScc = function (buffer, fmBuffer) {
    var wave = this.channel.wave[this.voice];
    if (!wave)
        return;
    var out = buffer;
    if (TssChannel.FM_OUT_MODE_OFF != this.fm.outMode)
        out = fmBuffer[this.fm.outPipe];
    var volumeL = this.volume.l >> 2;
    var volumeR = this.volume.r >> 2;
    var length = buffer.length;
    var plus = this.frequency * 32 * this.multiple;
    var count = this.count;
    var phase = this.phase;
    var i;
    if (0 == this.fm.inRate) {
        if (TssChannel.FM_OUT_MODE_NEW == this.fm.outMode) {
            for (i = 0; i < length; i += 2) {
                out[i + 0] = wave[phase] * volumeL;
                out[i + 1] = wave[phase] * volumeR;
                count += plus;
                while (count > MasterChannel.SAMPLE_FREQUENCY) {
                    count -= MasterChannel.SAMPLE_FREQUENCY;
                    phase++;
                    phase &= 31;
                }
            }
        } else {
            for (i = 0; i < length; i += 2) {
                out[i + 0] += wave[phase] * volumeL;
                out[i + 1] += wave[phase] * volumeR;
                count += plus;
                while (count > MasterChannel.SAMPLE_FREQUENCY) {
                    count -= MasterChannel.SAMPLE_FREQUENCY;
                    phase++;
                    phase &= 31;
                }
            }
        }
    } else {
        var fm = fmBuffer[this.fm.inPipe];
        var inRate = this.fm.inRate << 3;
        var fmPhaseL;
        var fmPhaseR;
        if (TssChannel.FM_OUT_MODE_NEW == this.fm.outMode) {
            for (i = 0; i < length; i += 2) {
                fmPhaseL = (phase + (fm[i + 0] >> inRate)) & 31;
                fmPhaseR = (phase + (fm[i + 1] >> inRate)) & 31;
                out[i + 0] = wave[fmPhaseL] * volumeL;
                out[i + 1] = wave[fmPhaseR] * volumeR;
                count += plus;
                while (count > MasterChannel.SAMPLE_FREQUENCY) {
                    count -= MasterChannel.SAMPLE_FREQUENCY;
                    phase++;
                    phase &= 31;
                }
            }
        } else {
            for (i = 0; i < length; i += 2) {
                fmPhaseL = (phase + (fm[i + 0] >> inRate)) & 31;
                fmPhaseR = (phase + (fm[i + 1] >> inRate)) & 31;
                out[i + 0] += wave[fmPhaseL] * volumeL;
                out[i + 1] += wave[fmPhaseR] * volumeR;
                count += plus;
                while (count > MasterChannel.SAMPLE_FREQUENCY) {
                    count -= MasterChannel.SAMPLE_FREQUENCY;
                    phase++;
                    phase &= 31;
                }
            }
        }
    }
    this.count = count;
    this.phase = phase;
};

/**
 * Generate a Sine wave sound.
 * @param buffer Int32Array to which generate sound
 * @param fmBuffer Int32Array to which output fm data, or from which input one
 */
TssChannel.Module.prototype.generateSin = function (buffer, fmBuffer) {
    var out = buffer;
    if (TssChannel.FM_OUT_MODE_OFF != this.fm.outMode)
        out = fmBuffer[this.fm.outPipe];
    var volumeL = this.volume.l >> 1;
    var volumeR = this.volume.r >> 1;
    var length = buffer.length;
    var plus = this.frequency * 256 * this.multiple;
    var count = this.count;
    var phase = this.phase;
    var i;
    if (0 == this.fm.inRate) {
        if (TssChannel.FM_OUT_MODE_NEW == this.fm.outMode) {
            for (i = 0; i < length; i += 2) {
                out[i + 0] = TssChannel._SIN_TABLE[phase] * volumeL;
                out[i + 1] = TssChannel._SIN_TABLE[phase] * volumeR;
                count += plus;
                while (count > MasterChannel.SAMPLE_FREQUENCY) {
                    count -= MasterChannel.SAMPLE_FREQUENCY;
                    phase++;
                    phase &= 0xff;
                }
            }
        } else {
            for (i = 0; i < length; i += 2) {
                out[i + 0] += TssChannel._SIN_TABLE[phase] * volumeL;
                out[i + 1] += TssChannel._SIN_TABLE[phase] * volumeR;
                count += plus;
                while (count > MasterChannel.SAMPLE_FREQUENCY) {
                    count -= MasterChannel.SAMPLE_FREQUENCY;
                    phase++;
                    phase &= 0xff;
                }
            }
        }
    } else {
        var fm = fmBuffer[this.fm.inPipe];
        var inRate = this.fm.inRate;
        var fmPhaseL;
        var fmPhaseR;
        if (TssChannel.FM_OUT_MODE_NEW == this.fm.outMode) {
            for (i = 0; i < length; i += 2) {
                fmPhaseL = (phase + (fm[i + 0] >> inRate)) & 0xff;
                fmPhaseR = (phase + (fm[i + 1] >> inRate)) & 0xff;
                out[i + 0] = TssChannel._SIN_TABLE[fmPhaseL] * volumeL;
                out[i + 1] = TssChannel._SIN_TABLE[fmPhaseR] * volumeR;
                count += plus;
                while (count > MasterChannel.SAMPLE_FREQUENCY) {
                    count -= MasterChannel.SAMPLE_FREQUENCY;
                    phase++;
                    phase &= 0xff;
                }
            }
        } else {
            for (i = 0; i < length; i += 2) {
                fmPhaseL = (phase + (fm[i + 0] >> inRate)) & 0xff;
                fmPhaseR = (phase + (fm[i + 1] >> inRate)) & 0xff;
                out[i + 0] += TssChannel._SIN_TABLE[fmPhaseL] * volumeL;
                out[i + 1] += TssChannel._SIN_TABLE[fmPhaseR] * volumeR;
                count += plus;
                while (count > MasterChannel.SAMPLE_FREQUENCY) {
                    count -= MasterChannel.SAMPLE_FREQUENCY;
                    phase++;
                    phase &= 0xff;
                }
            }
        }
    }
    this.count = count;
    this.phase = phase;
};
