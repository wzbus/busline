var map = new AMap.Map("map", {
  zoom: 13,
  resizeEnable: true,
  isHotspot: false,
  doubleClickZoom: false
});
var city, linesearch, stationSearch, readyAdd = [], colorList = [], brtlist = [], colorOption, lineColor;
AMap.plugin('AMap.CitySearch', function () {
  citySearch = new AMap.CitySearch();
  citySearch.getLocalCity(function (status, result) {
    if (status === 'complete' && result.info === 'OK') {
      city = result.city;
      AMap.plugin(["AMap.LineSearch"], function () {
        lineSearch = new AMap.LineSearch({
          city: city,
          pageIndex: 1,
          pageSize: 2,
          extensions: 'all'
        });
      });
      AMap.plugin(["AMap.StationSearch"], function () {
        stationSearch = new AMap.StationSearch({
          city: city,
          pageIndex: 1,
          pageSize: 10
        });
      });
    }
  })
});
map.on("moveend", function () {
  map.getCity(function (res) {
    city = res.city;
  });
});
map.on("zoomend", function () {
  map.getCity(function (res) {
    city = res.city;
  });
});
var traffic = new AMap.TileLayer.Traffic({
  'autoRefresh': true,
  'interval': 180,
});
function add () {
  let line = $("#busList").val().toUpperCase() + "路";
  colorOption = "false";
  enableAutoViewport = true;
  addLine(line);
}
function addLine (line) {
  if ($.inArray(line, readyAdd) == -1) {
    lineSearch.setCity(city);
    lineSearch.search(line, function (status, result) {
      if (status === 'complete' && result.info === 'OK') {
        console.log(result)
        if (colorOption == "true") {
          randomColor();
          let color = `rgb(${num[0]},${num[1]},${num[2]})`;
          num = [];
          if ($.inArray(color, colorList) == -1) {
            colorList.push(color);
            lineColor = color;
          } else {
            randomColor();
          }
        } else {
          lineColor = $("#strokeColor").val();
        }
        let lineArr = result.lineInfo[$("#busListItem").val()];
        let name = lineArr.name;
        let lineName = name.substring(0, name.indexOf("("));
        let pathArr = lineArr.path;
        let stops = lineArr.via_stops;
        let polyline = new AMap.Polyline({
          map: map,
          path: pathArr,
          strokeColor: lineColor,
          strokeOpacity: $("#strokeOpacity").val(),
          strokeWeight: $("#strokeWeight").val(),
          strokeStyle: $("#strokeStyle").val(),
          strokeDasharray: [25, 10],
          lineJoin: "round",
          lineCap: "round",
          cursor: "pointer",
          extData: lineName
        });
        map.setFitView();
        readyAdd.push(lineName);
        //console.log(polyline.getExtData());
        if ($("#strokeStation").val() == "true") {
          for (let i = 0, len = lineArr.via_stops.length; i < len; i++) {
            let poi = stops[i].location;
            new AMap.CircleMarker({
              center: [poi.lng, poi.lat],
              radius: 4,
              strokeColor: lineColor,
              strokeWeight: 2,
              strokeOpacity: $("#strokeOpacity").val(),
              fillColor: '#fff',
              fillOpacity: 1,
              zIndex: 200,
              cursor: 'pointer',
              clickable: true,
              extData: lineName
            }).setMap(map);
          }
        }
        polyline.on("dblclick", function () {
          let marks = map.getAllOverlays();
          for (let i = 0; i < marks.length; i++) {
            if (marks[i].getExtData() == lineName) {
              marks[i].setMap(null);
              if (marks[i].CLASS_NAME == "AMap.Polyline") {
                let index = readyAdd.indexOf(lineName);
                readyAdd.splice(index, 1);
              }
            }
          }
        });
      } else {
        alert("未检索到\"" + line + "\"，请确认有此线路数据后再试");
      }
    });
  } else {
    alert(line + "已添加");
  }
}
function search () {
  colorOption = $("#randomColor").val();
  stationSearch.setCity(city);
  stationSearch.search($("#stationList").val(), function (status, result) {
    if (status === 'complete' && result.info === 'OK') {
      let stationArr = result.stationInfo;
      let searchNum = stationArr.length;
      if (searchNum > 0) {
        clear();
        console.log('查询结果：共' + searchNum + '个相关站点');
        for (let i = 0; i < searchNum; i++) {
          let marker = new AMap.Marker({
            icon: new AMap.Icon({
              image: "pic/bubble_icon.png",
              size: new AMap.Size(20, 35),
              imageSize: new AMap.Size(20, 35)
            }),
            position: stationArr[i].location,
            map: map,
            title: stationArr[i].name
          });
          marker.info = new AMap.InfoWindow({
            content: "<p>" + stationArr[i].name + "</p><button onclick='passBus(" + JSON.stringify(stationArr[i].buslines) + ")' style='background: transparent;text-decoration: underline;color: #5298ff;'>选择此站点绘制途经公交线网</button>",
            offset: new AMap.Pixel(0, -32)
          });
          marker.on("mouseover", function (e) {
            e.target.info.open(map, e.target.getPosition())
          });
        }
        map.setFitView();
      }
    } else {
      alert("未检索到\"" + $("#stationList").val() + "\"，请确认有此站点数据后再试");
    }
  });
}
function passBus (list) {
  for (let i = 0, len = list.length; i < len; i++) {
    //console.log(list[i].name)
    let lineName = list[i].name.replace("(停运)", "");
    lineName = lineName.substring(0, lineName.indexOf("("));
    addLine(lineName);
  }
}
$("#busList").bind({
  "input propertychange": function () {
    inputLine = $(this).val();
  },
  "focus": function () {
    inputLine = $(this).val();
    $(this).val("");
  },
  "blur": function () {
    $(this).val(inputLine);
  },
  "keyup": function () {
    if ($(this).val() && event.keyCode == "13") {
      add();
    }
  }
});
$("#stationList").bind({
  "input propertychange": function () {
    inputStation = $(this).val();
  },
  "focus": function () {
    inputStation = $(this).val();
    $(this).val("");
  },
  "blur": function () {
    $(this).val(inputStation);
  },
  "keyup": function () {
    if ($(this).val() && event.keyCode == "13") {
      search();
    }
  }
});
$("#addBtn").click(function () {
  add();
});
$("#searchBtn").click(function () {
  search();
});
function randomColor () {
  let arr1 = ["0", "51", "102", "153", "204"];
  let arr2 = arr1.sort(() => {
    return Math.random() - 0.5;
  });
  num = arr2.splice(0, 2).concat("255").sort(() => {
    return Math.random() - 0.5;
  });
}
function clear () {
  map.clearMap();
  readyAdd = [];
}
$("#brtBtn").click(function () {
  if (!brtlist) {
    $.ajax({
      type: "POST",
      url: "search.php",
      data: "city=" + city,
      dataType: "json",
      success: function (res) {
        if (res) {
          brtlist = res;
          colorOption = $("#randomColor").val();
          for (let i = 0, len = brtlist.length; i < len; i++) {
            if ($.inArray(brtlist[i], readyAdd) == -1) {
              addLine(brtlist[i]);
            }
          }
        } else {
          alert("当前城市无快速公交BRT路线");
        }
      },
      error: function () {
        alert("请求数据库失败");
      }
    });
  } else {
    alert("已添加BRT路线，请清除所有标识后重试");
  }
});
$("#subBtn").click(function () {
  $.getScript("https://webapi.amap.com/subway?v=1.0&key=3993e3ad25c516d9ad02c03937e028e0&callback=cbk")
    .done(function () {
      let list = BMapSub.SubwayCitiesList;
      let subwaycity;
      let cityname = city.replace("市", "");
      for (let i = 0, len = list.length; i < len; i++) {
        if (list[i].name == cityname) {
          subwaycity = list[i];
          break;
        }
      }
      if (subwaycity) {
        $("#subway").show();
      } else {
        alert("当前城市无地铁");
      }
    })
    .fail(function () {
      alert("加载脚本失败，请检查网络后再试");
    });
});
$("#clearBtn").click(function () {
  clear();
});
$("#diyBtn").click(function () {
  let poi = map.getCenter();
  window.open(`diy.html?lng=${poi.lng}&lat=${poi.lat}`);
});
$("#mapStyle").change(function () {
  map.setMapStyle('amap://styles/' + $(this).val());
});
$("#mapLayer").change(function () {
  if ($(this).val() == "false") {
    map.remove(traffic);
  } else {
    map.add(traffic);
  }
});
$(".drawBtn").not("#clearBtn").click(function () {
  $(this).next().slideToggle().parent().siblings().find(".container").hide();
});
$(".closeBtn").click(function () {
  $(this).parent().parent().slideToggle();
});