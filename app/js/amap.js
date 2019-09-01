$(function () {
  document.oncontextmenu = function () {
    return false;
  }
});
var map = new AMap.Map("map", {
  zoom: 13,
  resizeEnable: true,
  isHotspot: false,
  doubleClickZoom: false
});
var city, linesearch, stationSearch, readyAdd = [], brtlist, curColor, enableAutoViewport, isCityList = false;
AMap.plugin('AMap.CitySearch', function () {
  citySearch = new AMap.CitySearch();
  let defCity = localStorage.getItem("defCity");
  if (defCity && !location.search) {
    map.setCity(defCity, function() {
      city = defCity;
      map.setZoom(13);
      $(".container:first").show();
    });
  } else {
    citySearch.getLocalCity(function (status, result) {
      if (status === 'complete' && result.info === 'OK') {
        $(".container:first").show();
        city = result.city;
        $("#curCity").text(city);
      }
    });
  }
});
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
  let url = location.search;
  if (url) {
    stationSearch.searchById(url.replace("?", ""), function (status, result) {
      if (status === 'complete' && result.info === 'OK') {
        let station = result.stationInfo[0];
        map.panTo([station.location.lng, station.location.lat]);
        map.getCity(function (res) {
          city = res.city ? res.city : res.province;
          lineSearch.setCity(city);
          stationSearch.setCity(city);
          chooseStation(station);
          $("#curCity").text(city);
          $("#city_title").text(city);
        });
      } else {
        history.replaceState(null, null, "amap.html");
      }
    })
  }
});
var traffic = new AMap.TileLayer.Traffic({
  'autoRefresh': true,
  'interval': 180,
});
map.on("zoomend", change);
map.on("dragend", change);
map.on("touchend", change);
function change () {
  map.getCity(function (res) {
    city = res.city ? res.city : res.province;
    lineSearch.setCity(city);
    stationSearch.setCity(city);
    $("#curCity").text(city);
    $("#city_title").text(city);
  });
}
function add () {
  let line = $("#busList").val().toUpperCase() + "路";
  enableAutoViewport = true;
  addLine(line);
  history.replaceState(null, null, "amap.html");
}
function addLine (line, defaultColor = $("#strokeColor").val()) {
  if ($.inArray(line, readyAdd) == -1 || $("#repeat").prop("checked")) {
    lineSearch.search(line, function (status, result) {
      if (status === 'complete' && result.info === 'OK') {
        let direction = $("#busListItem").val();
        let lineArr = result.lineInfo[direction];
        let name = lineArr.name;
        let lineName = name.substring(0, name.indexOf("("));
        let distance = parseFloat(lineArr.distance).toFixed(1);
        let pathArr = lineArr.path;
        let stops = lineArr.via_stops;
        let lineColor = defaultColor ? defaultColor : randomColor();
        let polyline = new AMap.Polyline({
          map: map,
          path: pathArr,
          strokeColor: lineColor,
          strokeOpacity: $("#strokeOpacity").val(),
          strokeWeight: $("#strokeWeight").val(),
          strokeDasharray: [25, 10],
          lineJoin: "round",
          lineCap: "round",
          cursor: "default",
          extData: lineName
        });
        readyAdd.push(lineName);
        if ($("#strokeStation").val() == "true") {
          for (let i = 0; i < lineArr.via_stops.length; i++) {
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
            marker.on("click", function () {
              passBus(stops[i].id).then(function(res) { 
                new AMap.InfoWindow({
                  content: `<p>${stops[i].name}<span class="info_dis">全程${distance}公里</span></p><p>${name}</p><p class="info_lines">途经公交:${res}</p>`,
                  offset: new AMap.Pixel(-1, 0),
                  closeWhenClickMap: true
                }).open(map, poi);
              });
            });
          }
        }
        if (enableAutoViewport) {
          map.setFitView();
        }
        polyline.on("mouseover", function (e) {
          curColor = e.target.getOptions().strokeColor;
          e.target.setOptions({ zIndex: 100, strokeColor: "#F33", showDir: true });
        });
        polyline.on("mouseout", function (e) {
          e.target.setOptions({ zIndex: 50, strokeColor: curColor, showDir: false });
        });
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
        alert(`未检索到"${line}"，请确认有此线路数据后再试`);
      }
    });
  } else {
    alert(`${line}已添加`);
  }
}
function search () {
  stationSearch.search($("#stationList").val(), function (status, result) {
    if (status === 'complete' && result.info === 'OK') {
      let searchArr = result.stationInfo;
      let stationArr = searchArr.filter(item => item.buslines.length);
      if (stationArr.length) {
        let searchNum = stationArr.length;
        if (searchNum) {
          clear();
          enableAutoViewport = false;
          if (searchNum == 1) {
            chooseStation(stationArr[0]);
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
                content: `<p>${stationArr[i].name}</p><button onclick='chooseStation(${JSON.stringify(stationArr[i])})' class="info_btn">选择此站点绘制途经公交线网</button>`,
                offset: new AMap.Pixel(4, -32),
                closeWhenClickMap: true
              });
              marker.on("mouseover", function (e) {
                e.target.info.open(map, e.target.getPosition());
              });
              if (i == 0) {
                marker.info.open(map, stationArr[0].location);
              }
            }
            map.setFitView();
          }
        }
      } else {
        alert(`未检索到"${$("#stationList").val()}"，请确认有此站点数据后再试`);
      }
    } else {
      alert(`未检索到"${$("#stationList").val()}"，请确认有此站点数据后再试`);
    }
  });
}
function passBus(id) {
  return new Promise(function(resolve, reject) {
    stationSearch.searchById(id, function (status, result) {
      if (status === 'complete' && result.info === 'OK') {
        let buslines = result.stationInfo[0].buslines;
        let str = "", arr = [];
        for (let i = 0; i < buslines.length; i++) {
          let lineName = buslines[i].name.replace("(停运)", "");
          lineName = lineName.substring(0, lineName.indexOf("("));
          if ($.inArray(lineName, arr) == -1) {
            str = str + lineName + ",";
            arr.push(lineName);
          }
        }
        resolve(str.substring(0, str.length - 1));
      }
    });
  });
}
function chooseStation (station) {
  let marks = map.getAllOverlays("marker");
  for (let i = 0; i < marks.length; i++) {
    marks[i].setMap(null);
  }
  let center = [station.location.lng, station.location.lat];
  map.setCenter(center);
  let marker = new AMap.Marker({
    map: map,
    position: center,
    icon: new AMap.Icon({
      image: "pic/marker.png",
      size: new AMap.Size(25, 35),
      imageSize: new AMap.Size(25, 35)
    }),
    animation: "AMAP_ANIMATION_DROP"
  });
  let list = "", arr = [];
  for (let i = 0; i < station.buslines.length; i++) {
    let lineName = station.buslines[i].name.replace("(停运)", "");
    lineName = lineName.substring(0, lineName.indexOf("("));
    if ($.inArray(lineName, arr) == -1) {
      list = list + lineName + ",";
      arr.push(lineName);
      $("#randomColor").val() === "false" ? addLine(lineName) : addLine(lineName, false);
    }
  }
  list = list.substring(0, list.length - 1);
  marker.info = new AMap.InfoWindow({
    content: `<p>${station.name}</p><p style="font-size:14px">途经公交:${list}</p>`,
    offset: new AMap.Pixel(4, -32),
    closeWhenClickMap: true
  });
  marker.on("click", function (e) {
    e.target.info.open(map, e.target.getPosition());
  });
  $(".remark").show();
  $("#amount").text(arr.length);
  history.replaceState(null, null, `amap.html?${station.id}`);
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
  let arr1 = [0, 51, 102, 153, 204].sort(() => {
    return Math.random() - 0.5;
  });
  let arr2 = [arr1[0] + Math.round(Math.random() * 20), arr1[1] + Math.round(Math.random() * 20)].concat(255);
  let arr3 = arr2.sort(() => {
    return Math.random() - 0.5;
  });
  let color = `rgb(${arr3.join()})`;
  return color
}
function clear () {
  map.clearMap();
  readyAdd.length = 0;
  brtlist = "";
  $(".remark").hide();
}
function chooseCity (adcode) {
  map.setCity(adcode, function (res) {
    if (res) {
      clear();
      $("#cityBox").hide();
      map.setZoom(13);
    }
  });
}
$("#curCity").click(function () {
  if (!isCityList) {
    $.getJSON("api/city.json", function (res) {
      if (res) {
        let domList = "";
        for (let i = 0; i < res.length; i++) {
          domList += `<dt>${res[i].province}</dt><dd>`;
          let cities = res[i].city;
          for (let j = 0; j < cities.length; j++) {
            domList += `<li onclick='chooseCity(${cities[j].adcode})'>${cities[j].name}</li>`;
          }
          domList += "</dd>";
        }
        $("#cityList").html(domList);
      }
    });
  }
  $("#cityBox").slideToggle();
});
$("#ruleBtn").click(function () {
  if (!ruler) {
    map.plugin(["AMap.RangingTool"], function () {
      var ruler = new AMap.RangingTool(map);
      ruler.on("end", function () {
        ruler.turnOff();
      });
      ruler.turnOn();
    });
  } else {
    ruler.turnOn();
  }
});
$("#brtBtn").click(function () {
  if (!brtlist) {
    $.ajax({
      type: "POST",
      url: "api/search.php",
      data: "city=" + city,
      dataType: "json",
      success: function (res) {
        if (res) {
          brtlist = res;
          enableAutoViewport = false;
          for (let i = 0; i < brtlist.length; i++) {
            if ($.inArray(brtlist[i], readyAdd) == -1 || $("#repeat").prop("checked")) {
              $("#randomColor").val() === "false" ? addLine(brtlist[i]) : addLine(brtlist[i], false);
            }
          }
          history.replaceState(null, null, "amap.html");
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
$("#cityBtn").click(function () {
  let cityName = $("#cityName").val();
  if (cityName) {
    map.setCity(cityName, function() {
      $("#cityBox").hide();
      $("#cityName").val("");
      clear();
      map.setZoom(13);
    });
  }
});
$("#defBtn").click(function () {
  localStorage.setItem("defCity", city);
});
$("#clearBtn").click(function () {
  clear();
});
$("#subBtn").click(function () {
  window.open("metro.html");
});
$("#backBtn").click(function () {
  window.open("index.html");
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