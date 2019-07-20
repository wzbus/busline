window.onload = function () {
  document.oncontextmenu = function () {
    return false;
  }
};
var map = new AMap.Map("map", {
  zoom: 13,
  resizeEnable: true,
  isHotspot: false,
  doubleClickZoom: false
});
var city, linesearch, stationSearch, readyAdd = [], colorList = [], brtlist, colorOption, lineColor, enableAutoViewport;
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
        let direction = $("#busListItem").val();
        let lineArr = result.lineInfo[direction];
        let name = lineArr.name;
        let lineName = name.substring(0, name.indexOf("("));
        let distance = parseFloat(lineArr.distance).toFixed(1);
        let pathArr = lineArr.path;
        let stops = lineArr.via_stops;
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
          cursor: "default",
          extData: lineName
        });
        readyAdd.push(lineName);
        if ($("#strokeStation").val() == "true") {
          for (let i = 0, len = lineArr.via_stops.length; i < len; i++) {
            let poi = stops[i].location;
            let marker = new AMap.CircleMarker({
              map: map,
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
            });
            marker.info = new AMap.InfoWindow({
              content: "<p>" + stops[i].name + "</p><p>" + name + "</p><p style='font-size: 12px;color: #666;'>全程" + distance + "公里</p>",
              offset: new AMap.Pixel(-1, 0),
              closeWhenClickMap: true
            });
            marker.on("click", function (e) {
              e.target.info.open(map, poi);
            });
          }
        }
        if (enableAutoViewport) {
          map.setFitView();
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
      map.setFitView();
      if (searchNum) {
        clear();
        enableAutoViewport = false;
        if (searchNum == 1) {
          passBus(stationArr[0].buslines);
        } else {
          for (let i = 0; i < searchNum; i++) {
            let marker = new AMap.Marker({
              map: map,
              position: stationArr[i].location,
              icon: new AMap.Icon({
                image: "pic/marker.png",
                size: new AMap.Size(25, 35),
                imageSize: new AMap.Size(25, 35)
              }),
              title: stationArr[i].name
            });
            marker.info = new AMap.InfoWindow({
              content: "<p>" + stationArr[i].name + "</p><button onclick='passBus(" + JSON.stringify(stationArr[i].buslines) + "," + JSON.stringify(stationArr[i].location) + ")' style='background: transparent;text-decoration: underline;color: #5298ff;'>选择此站点绘制途经公交线网</button>",
              offset: new AMap.Pixel(4, -32),
              closeWhenClickMap: true
            });
            marker.on("mouseover", function (e) {
              e.target.info.open(map, e.target.getPosition());
            });
          }
        }
      }
    } else {
      alert("未检索到\"" + $("#stationList").val() + "\"，请确认有此站点数据后再试");
    }
  });
}
function passBus (list, location) {
  let marks = map.getAllOverlays("marker");
  for (let i = 0; i < marks.length; i++) {
    marks[i].setMap(null);
  }
  for (let i = 0, len = list.length; i < len; i++) {
    let lineName = list[i].name.replace("(停运)", "");
    lineName = lineName.substring(0, lineName.indexOf("("));
    addLine(lineName);
  }
  new AMap.Marker({
    map: map,
    position: [location.lng, location.lat],
    icon: new AMap.Icon({
      image: "pic/marker.png",
      size: new AMap.Size(25, 35),
      imageSize: new AMap.Size(25, 35)
    }),
    animation: "AMAP_ANIMATION_DROP"
  });
  $(".remark").show();
  $("#amount").text(list.length);
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
  $(".remark").hide();
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
          enableAutoViewport = false;
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
$("#clearBtn").click(function () {
  clear();
});
$("#subBtn").click(function () {
  window.open("metro.html");
});
$("#mapBtn").click(function () {
  window.open("bmap.html");
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