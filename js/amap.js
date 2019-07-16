var map = new AMap.Map("map", {
  zoom: 13,
  resizeEnable: true
});
var lists = [], readyAdd = [];
var city, linesearch, stationSearch;
AMap.plugin('AMap.CitySearch', function () {
  citySearch = new AMap.CitySearch();
  citySearch.getLocalCity(function (status, result) {
    if (status === 'complete' && result.info === 'OK') {
      city = result.city;
      AMap.plugin(["AMap.LineSearch"], function () {
        lineSearch = new AMap.LineSearch({
          city: city,
          pageIndex: 1,
          pageSize: 1,
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
})
function add () {
  let line = $("#busList").val().toUpperCase() + "路";
  colorOption = "false";
  enableAutoViewport = true;
  addLine(line);
}
function addLine (line) {
  if ($.inArray(line, readyAdd) == -1) {
    lineSearch.search(line, function (status, result) {
      if (status === 'complete' && result.info === 'OK') {
        let lineArr = result.lineInfo;
        let lineNum = result.lineInfo.length;
        if (lineNum == 0) {
        } else {
          let name = result.lineInfo[0].name;
          let lineName = name.substring(0, name.indexOf("("));
          //console.log(lineName)
          let pathArr = lineArr[0].path;
          let stops = lineArr[0].via_stops;
          let polyline = new AMap.Polyline({
            map: map,
            path: pathArr,
            strokeColor: $("#strokeColor").val(),
            strokeOpacity: $("#strokeOpacity").val(),
            strokeWeight: $("#strokeWeight").val(),
            strokeStyle: $("#strokeStyle").val(),
            strokeDasharray: [25, 10],
            cursor: "pointer",
            extData: lineName
          });
          map.setFitView();
          lists.push(polyline);
          readyAdd.push(lineName);
          //console.log(polyline.getExtData());
          if ($("#strokeStation").val() == "true") {
            for (let i = 0, len = lineArr[0].via_stops.length; i < len; i++) {
              let poi = stops[i].location;
              let marker = new AMap.CircleMarker({
                center: [poi.lng, poi.lat],
                radius: 4,
                strokeColor: $("#strokeColor").val(),
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
            for (let i = 0; i < lists.length; i++) {
              if (lists[i].getExtData() == lineName) {
                lists[i].setMap(null);
                let index = readyAdd.indexOf(lineName);
                readyAdd.splice(index, 1);
                lists.splice(index, 1);
                break;
              }
            }
          });
        }
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
          console.log(city);
          marker.info = new AMap.InfoWindow({
            content: "<p>" + stationArr[i].name + "</p><button onclick='passBus("+ stationArr[i].id +")' style='background: transparent;text-decoration: underline;color: #5298ff;'>选择此站点绘制途经公交线网</button>",
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
function passBus(id) {
  console.log(id);
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
  lists = [];
  readyAdd = [];
}
$("#clearBtn").click(function () {
  clear();
});
$("#diyBtn").click(function () {
  let poi = map.getCenter();
  window.open(`diy.html?lng=${poi.lng}&lat=${poi.lat}`);
});
$(".drawBtn").not("#clearBtn").click(function () {
  $(this).next().slideToggle().parent().siblings().find(".container").hide();
});
$(".closeBtn").click(function () {
  $(this).parent().parent().slideToggle();
});