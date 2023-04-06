// 把ohlc数据做成oclh数据
function splitKlineData(rawData) {
    var categoryData = [];
    var values = [];
    var volumes = [];

    // oclh
    for (var i = 0; i < rawData.length; i++) {
        var item = rawData[i];

        categoryData.push(item[0]);
        values.push([item[1], item[4], item[3], item[2]]);
        volumes.push(item[5]);
    }

    return {
        categoryData: categoryData,
        values: values,
        volumes: volumes
    };
}

// 交易记录
function splitOrderData(rawData, data) {
    var values = [];
    // 处理同一坐标有2个以上数据
    var coordXArr = [];
    var coordYCount = 0;
    for (var i = 0; i < rawData.length; i++) {
        var item = rawData[i];

        const coordX = item[0];
        var coordY = item[3];

        const cIdx = data.categoryData.indexOf(coordX);
        if (cIdx != -1) {
            const oclh = data.values[cIdx];
            coordY = oclh[2] - 25;
        }

        // 不存在
        if (coordXArr.indexOf(coordX) == -1) {
            coordXArr.push(coordX);
            coordYCount = 0;
        } else {
            coordYCount += 1;
            const cIdx = data.categoryData.indexOf(coordX);
            if (cIdx != -1) {
                const oclh = data.values[cIdx];
                coordY = oclh[2] - 25 - 45;
            }

            if (coordYCount != 1) {
                coordY -= (coordYCount - 1) * 30;
            }
        }

        // [ "20230403 22:00:00", "0", "0", 5786.0, 1, null ]
        const dir = item[1];
        const comb_offset_flag = item[2];

        var direction = '';
        if(dir == '0' && comb_offset_flag == '0') {
            direction = '买开';
        } else if(dir == '0' && comb_offset_flag != '0') {
            direction = '买平';
        } else if(dir == '1' && comb_offset_flag == '0') {
            direction = '卖开';
        } else if(dir == '1' && comb_offset_flag != '0') {
            direction = '卖平';
        }

        var symbol = "roundRect";
        var value = direction;
        var bgColor = '#ec0000';
        var textColor = '#ffffff';
        var borderWidth = 0;
        var borderColor = '#ec0000';

        if (direction == '买开') {
            bgColor = '#ec0000';
        } else if (direction == '卖开') {
            bgColor = '#008F28';
        }
        if (direction == "卖平" || direction == "买平") {
            bgColor = "#ffffff";
            value += "\n" + item[5];
            borderWidth = 0.5;

            if (direction == "卖平") {
                textColor = '#ec0000';
                borderColor = textColor;
            } else {
                textColor = '#008F28';
                borderColor = textColor;
            }
        }

        var mark = {
            name: "Mark",
            coord: [coordX, coordY],
            symbol: symbol,
            symbolSize: [25, 25],
            value: value,
            label: {
                color: textColor,
                fontSize: '9'
            },
            itemStyle: {
                borderWidth: borderWidth,
                borderColor: borderColor,
                color: bgColor
            }
        };
        values.push(mark);
    }

    return values;
}

// ma
function calculateMA(dayCount, data) {
    var result = [];
    for (var i = 0, len = data.values.length; i < len; i++) {
        if (i < dayCount) {
            result.push("-");
            continue;
        }
        var sum = 0;
        for (var j = 0; j < dayCount; j++) {
            sum += data.values[i - j][1];
        }
        const ma = sum / dayCount;
        result.push(ma.toFixed(0));
    }
    return result;
}

// expma
function calculateEMA(dayCount, data) {
    var result = [];
    // EXPMA
    // prevMA = (2 * close + (timePeriod - 1) * prevMA) / (timePeriod + 1);
    var prevMA = data.values[0][1];
    result.push("-");
    for (var i = 1, len = data.values.length; i < len; i++) {
        prevMA =
            (2 * data.values[i][1] + (dayCount - 1) * prevMA) / (dayCount + 1);
        if (i < dayCount) {
            result.push("-");
            continue;
        }
        result.push(prevMA.toFixed(0));
    }

    return result;
}
        

// atr
function calculateATR(dayCount, data) {
    var result = [];
    for (var i = 0, len = data.values.length; i < len; i++) {
        if (i < dayCount) {
            result.push("-");
            continue;
        }
        var sum = 0;
        for (var j = 0; j < dayCount; j++) {
            const item = data.values[i - j];
            const ref_item = data.values[i - j - 1];
            // oclh
            const high = item[3];
            const low = item[2];

            const tr = Math.max(
                high - low,
                Math.abs(ref_item[1] - high),
                Math.abs(ref_item[1] - low)
            );
            sum += tr;
        }
        const atr = sum / dayCount;
        result.push(atr.toFixed(2));
    }
    return result;
}

// 计算唐奇安通道
function calculateDC(dayCount, data) {
    var hh = [];
    var ll = [];
    var cc = [];
    for (var i = 0, len = data.values.length; i < len; i++) {
        if (i < dayCount) {
            hh.push("-");
            ll.push("-");
            cc.push("-");
            continue;
        }
        var hhVal = data.values[i][3];
        var llVal = data.values[i][2];
        for (var j = 0; j < dayCount; j++) {
            // oclh
            var jhh = data.values[i - j][3];
            var jll = data.values[i - j][2];

            if (jhh > hhVal) {
                hhVal = jhh;
            }
            if (jll < llVal) {
                llVal = jll;
            }
        }

        hh.push(hhVal);
        ll.push(llVal);

        var ccVal = (hhVal + llVal) / 2;
        cc.push(ccVal.toFixed(0));
    }
    return {
        hh: hh,
        ll: ll,
        cc: cc
    };
}

