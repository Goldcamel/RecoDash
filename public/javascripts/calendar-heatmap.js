function calendarHeatmap() {
  // defaults
  // var width = 750;
  // var height = 110;
  var left_offset = 30;
  var top_offset = 15;
  var width = 1300;
  var height = 175; 
  var legendWidth = 150;
  var selector = 'body';
  var SQUARE_LENGTH = 20;
  var SQUARE_PADDING = 2;
  var MONTH_LABEL_PADDING = 6;
  var now = moment().add(8,'hours').endOf('day').toDate();
  var yearAgo = moment().startOf('day').subtract(1, 'year').toDate();
  var startDate = null;
  var counterMap= {};
  var data = [];
  var max = null;
  var colorRange = ['#D8E6E7', '#218380'];
  var tooltipEnabled = true;
  var tooltipUnit = 'contribution';
  var legendEnabled = true;
  var onClick = null;
  var weekStart = 0; //0 for Sunday, 1 for Monday
  var locale = {
    months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    days: ['日', '一', '二', '三', '四', '五', '六'],
    No: '无',
    on: '在',
    Less: 'Less',
    More: 'More'
  };
  var v = Number(d3.version.split('.')[0]);

  // setters and getters
  chart.data = function (value) {
    if (!arguments.length) { return data; }
    data = value;

    counterMap= {};

    data.forEach(function (element, index) {
        var key= moment(element.date).format( 'YYYY-MM-DD' );
        var counter= counterMap[key] || 0;
        counterMap[key]= counter + element.count;
    });

    return chart;
  };

  chart.max = function (value) {
    if (!arguments.length) { return max; }
    max = value;
    return chart;
  };

  chart.selector = function (value) {
    if (!arguments.length) { return selector; }
    selector = value;
    return chart;
  };

  chart.startDate = function (value) {
    if (!arguments.length) { return startDate; }
    yearAgo = value;
    now = moment(value).endOf('day').add(1, 'year').toDate();
    return chart;
  };

  chart.colorRange = function (value) {
    if (!arguments.length) { return colorRange; }
    colorRange = value;
    return chart;
  };

  chart.tooltipEnabled = function (value) {
    if (!arguments.length) { return tooltipEnabled; }
    tooltipEnabled = value;
    return chart;
  };

  chart.tooltipUnit = function (value) {
    if (!arguments.length) { return tooltipUnit; }
    tooltipUnit = value;
    return chart;
  };

  chart.legendEnabled = function (value) {
    if (!arguments.length) { return legendEnabled; }
    legendEnabled = value;
    return chart;
  };

  chart.onClick = function (value) {
    if (!arguments.length) { return onClick(); }
    onClick = value;
    return chart;
  };

  chart.locale = function (value) {
    if (!arguments.length) { return locale; }
    locale = value;
    return chart;
  };

  function chart() {

    var div= document.getElementById("calendar_tile");

    d3.select(chart.selector()).selectAll('svg.calendar-heatmap').remove(); // remove the existing chart, if it exists

    var dateRange = ((d3.time && d3.time.days) || d3.timeDays)(yearAgo, now); // generates an array of date objects within the specified range
    var monthRange = ((d3.time && d3.time.months) || d3.timeMonths)(moment(yearAgo).startOf('month').toDate(), now); // it ignores the first month if the 1st date is after the start of the month
    var firstDate = moment(dateRange[0]);
    if (chart.data().length == 0) {
      max = 0;
    } else if (max === null) {
      max = d3.max(chart.data(), function (d) { return d.count; }); // max data value
    }

    // color range
    var color = ((d3.scale && d3.scale.linear) || d3.scaleLinear)()
      .range(chart.colorRange())
      .domain([0, max]);

    var tooltip;
    var dayRects;
    
    var windowWidth =  document.getElementById('history_calendar').clientWidth;
    var svgWidth = windowWidth - 60;
    var moveLength = width - svgWidth;
    console.log(svgWidth);
    drawChart();

    function drawChart() {
      var svg = d3.select(chart.selector())
        .style('position', 'relative')
        .append('svg')
        // .attr('width', svgWidth)
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'calendar-heatmap')
        .style('padding', '16px');

      var svggroup = svg.append('g')
      //   .attr('transform', 'translate(-' + moveLength + ', 0)');

      dayRects = svggroup.selectAll('.day-cell')
        .data(dateRange);  //  array of days for the last yr

      var enterSelection = dayRects.enter().append('rect')
        .attr('class', 'day-cell')
        .attr('width', SQUARE_LENGTH)
        .attr('height', SQUARE_LENGTH)
        .attr('fill', function(d) { return color(countForDate(d)); })
        .attr('x', function (d, i) {
          var cellDate = moment(d);
          var result = cellDate.week() - firstDate.week() + (firstDate.weeksInYear() * (cellDate.weekYear() - firstDate.weekYear()));
          return result * (SQUARE_LENGTH + SQUARE_PADDING) + left_offset;
        })
        .attr('y', function (d, i) {
          return MONTH_LABEL_PADDING + formatWeekday(d.getDay()) * (SQUARE_LENGTH + SQUARE_PADDING) + top_offset;
        });

      if (typeof onClick === 'function') {
        (v === 3 ? enterSelection : enterSelection.merge(dayRects)).on('click', function(d) {
          var count = countForDate(d);
          onClick({ date: d, count: count});
        });
      }

      if (chart.tooltipEnabled()) {
        (v === 3 ? enterSelection : enterSelection.merge(dayRects)).on('mouseover', function(d, i) {
          tooltip = d3.select(chart.selector())
            .append('div')
            .attr('class', 'day-cell-tooltip')
            .html(tooltipHTMLForDate(d))
            .style('left', function () { return (Math.floor(i / 7) * SQUARE_LENGTH + left_offset) + 'px'; })
            .style('top', function () {
              return formatWeekday((d.getDay()) * (SQUARE_LENGTH + SQUARE_PADDING) + MONTH_LABEL_PADDING * 2 + top_offset) + 'px';
            });
        })
        .on('mouseout', function (d, i) {
          tooltip.remove();
        });
      }

      dayRects.exit().remove();
      var monthLabels = svggroup.selectAll('.month')
          .data(monthRange)
          .enter().append('text')
          .attr('class', 'month-name')
          .text(function (d) {
            return locale.months[d.getMonth()];
          })
          .attr('id', function(d, i) {
            return 'month' + i;
          })
          .attr('x', function (d, i) {
            var matchIndex = 0;
            dateRange.find(function (element, index) {
              matchIndex = index;
              return moment(d).isSame(element, 'month') && moment(d).isSame(element, 'year');
            });

            return Math.floor(matchIndex / 7) * (SQUARE_LENGTH + SQUARE_PADDING) + SQUARE_LENGTH + left_offset;
          })
          .attr('y', 0 + top_offset);  // fix these to the top

      d3.select("#month0").remove();

      locale.days.forEach(function (day, index) {
        index = formatWeekday(index);
        if (index % 2) {
            svggroup.append('text')
            .attr('class', 'day-initial')
            .attr('transform', 'translate(10,' + ((SQUARE_LENGTH + SQUARE_PADDING) * (index + 1) + 12) + ')')
            .style('text-anchor', 'middle')
            .attr('dy', '2')
            .text(day);
        }
      });
    }

    function tooltipHTMLForDate(d) {
      var date = moment(d);

      var key= moment(d).format( 'YYYY-MM-DD' );
      count = counterMap[key];

      return '<span><strong> 总得分:' + (count != null ? count : locale.No) + '</strong> ' + locale.on + ' ' + formatDate(date) + '</span>';
    }

    function formatDate(date) {
      var year = date.year();
      var month = date.month();
      var day = date.date();
      var weekday = date.day();

      return '周' + locale.days[weekday] + ', ' + year + '年' + (month + 1) + '月' + day + '日';
    }

    function countForDate(d) {
        var key= moment(d).format( 'YYYY-MM-DD' );
        return counterMap[key] || 0;
    }

    function formatWeekday(weekDay) {
      if (weekStart === 1) {
        if (weekDay === 0) {
          return 6;
        } else {
          return weekDay - 1;
        }
      }
      return weekDay;
    }

    var daysOfChart = chart.data().map(function (day) {
//      return day.date.toDateString();
        return day.date;
    });

  }

  return chart;
}


// polyfill for Array.find() method
/* jshint ignore:start */
if (!Array.prototype.find) {
  Array.prototype.find = function (predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}
/* jshint ignore:end */
