"use strict";
window.onload = function () {
  document.onkeydown = function () {
    var e = window.event || arguments[0];
    if (e.keyCode == 123) {
      return false;
    } else {
      if (e.ctrlKey && e.shiftKey && e.keyCode == 73) {
        return false;
      } else {
        if (e.ctrlKey && e.keyCode == 85) {
          return false;
        }
      }
    }
  }
  document.oncontextmenu = function () {
    return false;
  }
};
var map = new BMap.Map("map", {
  enableMapClick: false
});
var city;
var myCity = new BMap.LocalCity();
myCity.get(getCity);
map.enableScrollWheelZoom();
map.enableKeyboard();
map.enableInertialDragging();
map.disableDoubleClickZoom();
map.addControl(new BMap.CityListControl({
  anchor: BMAP_ANCHOR_TOP_LEFT
}));
var cr = new BMap.CopyrightControl({
  anchor: BMAP_ANCHOR_BOTTOM_RIGHT,
  offset: new BMap.Size(5, 2)
});
map.addControl(cr);
cr.addCopyright({
  id: 1,
  content: "&copy;温州公交吧 | 中华全知道"
});
var inputLine, inputStation, lineOpacity, lineColor, colorOption, currentPolyline, polyline, diyLine, first, last, brtlist, readyAdd = [],
  addPoint = [], num = [], colorList = [], diyStation = false, enableEditing = false, enableAutoViewport = true;
var stationIcon = new BMap.Icon("station_icon.png", new BMap.Size(12, 12));
var getPolylineOptions = function getPolylineOptions () {
  return {
    strokeColor: lineColor,
    strokeWeight: $("#strokeWeight").val(),
    strokeOpacity: $("#strokeOpacity").val(),
    strokeStyle: $("#strokeStyle").val(),
    enableEditing: enableEditing
  }
};
var bus = new BMap.BusLineSearch(map, {
  onGetBusListComplete: function onGetBusListComplete (result) {
    let busListItem = $("#busListItem").val();
    let fstLine = result.getBusListItem(busListItem);
    bus.getBusLine(fstLine);
    if (!result.Zz.length) {
      alert("未检索到该线路名，请确认有此线路数据后再试");
    }
  },
  onGetBusLineComplete: function onGetBusLineComplete (busline) {
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
    polyline = new BMap.Polyline(busline.getPath(), getPolylineOptions());
    let lineName = busline.name.substr(0, busline.name.indexOf("("));
    map.addOverlay(polyline);
    readyAdd.push(lineName);
    let stationList = [];
    for (let i = 0, len = busline.getNumBusStations(); i < len; i++) {
      let busStation = busline.getBusStation(i);
      let marker = new BMap.Marker(busStation.position, {
        icon: stationIcon
      });
      stationList.push(new BMap.Point(busStation.position.lng, busStation.position.lat));
      if ($("#strokeStation").val() == "true") {
        map.addOverlay(marker);
        marker.setTitle(lineName + ":" + busStation.name);
        marker.addEventListener("click", function (e) {
          let opts = {
            width: 250,
            height: 80,
            title: e.target.getTitle().substr(e.target.getTitle().indexOf(":") + 1)
          };
          let content = busline.name;
          let infoWindow = new BMap.InfoWindow(content, opts);
          let point = new BMap.Point(e.target.getPosition().lng, e.target.getPosition().lat);
          map.openInfoWindow(infoWindow, point);
        });
      }
    }
    if (enableAutoViewport) {
      let view = map.getViewport(eval(stationList));
      map.centerAndZoom(view.center, view.zoom);
    }
    polyline.addEventListener("dblclick", function (e) {
      let allOverlay = map.getOverlays();
      for (let i = 0, len = allOverlay.length; i < len; i++) {
        if (allOverlay[i].toString() == "[object Marker]") {
          if (allOverlay[i].getTitle().substr(0, allOverlay[i].getTitle().indexOf(":")) == lineName) {
            allOverlay[i].enableMassClear();
          } else {
            allOverlay[i].disableMassClear();
          }
        } else {
          allOverlay[i].disableMassClear();
        }
      }
      e.target.enableMassClear();
      map.clearOverlays();
      let index = readyAdd.indexOf(lineName);
      readyAdd.splice(index, 1);
    });
    polyline.addEventListener("mouseover", function (e) {
      if (e.target == currentPolyline) {
        return false;
      }
      currentPolyline = e.target;
      lineOpacity = currentPolyline.getStrokeOpacity();
      currentPolyline.setStrokeOpacity("1");
    });
    polyline.addEventListener("mouseout", function (e) {
      e.target.setStrokeOpacity(lineOpacity);
    })
  }
});
map.addEventListener("moveend", function () {
  let geocoder = new BMap.Geocoder();
  geocoder.getLocation(map.getCenter(), function (e) {
    city = e.addressComponents.city;
  })
});
function getCity (res) {
  if (res) {
    city = res.name;
    map.centerAndZoom(city, 13);
  } else {
    city = "温州市";
  }
}
function randomColor () {
  let arr1 = ["0", "51", "102", "153", "204"];
  let arr2 = arr1.sort(() => {
    return Math.random() - 0.5;
  });
  num = arr2.splice(0, 2).concat("255").sort(() => {
    return Math.random() - 0.5;
  });
}
function addLine (line) {
  if ($.inArray(line, readyAdd) == -1) {
    bus.getBusList(line);
    $("#editBtn").removeClass("disable");
  } else {
    alert("该路线已添加");
  }
}
function clear () {
  for (let i = 0, len = map.getOverlays().length; i < len; i++) {
    map.getOverlays()[i].enableMassClear();
  }
  map.clearOverlays();
  readyAdd = [];
  addPoint = [];
  colorList = [];
  $("#brtBtn").attr("disabled", false).removeClass("disable");
  $("#editBtn").addClass("disable").text("启用路径编辑");
  $("#stopBtn").addClass("disable");
}
$("#container").click(function () {
  if (diyLine && !last) {
    addPoint = [];
    for (let i = 0, len = map.getOverlays().length; i < len; i++) {
      map.clearOverlays();
    }
  }
});
$("#busList").bind("input propertychange", function () {
  inputLine = $(this).val();
});
$("#busList").focus(function () {
  inputLine = $(this).val();
  $(this).val("");
});
$("#busList").blur(function () {
  $(this).val(inputLine);
});
$("#stationList").bind("input propertychange", function () {
  inputStation = $(this).val();
});
$("#stationList").focus(function () {
  inputStation = $(this).val();
  $(this).val("");
});
$("#stationList").blur(function () {
  $(this).val(inputStation);
});
$("#addBtn").click(function () {
  let line = $("#busList").val().replace("路", "");
  colorOption = "false";
  enableAutoViewport = true;
  addLine(line);
});
$("#searchBtn").click(function () {
  colorOption = $("#randomColor").val();
  enableAutoViewport = false;
  let local = new BMap.LocalSearch(map, {
    pageCapacity: 1,
    renderOptions: {
      map: map,
      autoViewport: false
    },
    onSearchComplete: function () {
      local.setMarkersSetCallback(function (pois) {
        if (pois[0].type == "1") {
          clear();
          let marker = pois[0].marker;
          let point = new BMap.Point(pois[0].point.lng, pois[0].point.lat);
          map.panTo(point);
          marker.setAnimation(BMAP_ANIMATION_DROP);
          let passBus = local.getResults().getPoi(0).address.split(";");
          for (let i = 0, len = passBus.length; i < len; i++) {
            addLine(passBus[i]);
          }
        } else {
          alert("未检索到该站名，请确认有此站点数据后再试");
        }
      });
    }
  });
  let station = $("#stationList").val() + '-公交站,';
  local.search(station, {
    forceLocal: "ture"
  });
});
$("#brtBtn").click(function () {
  let brt = true;
  switch (city) {
    case "杭州市":
      brtlist = ["B1", "B1C", "B1D", "B2", "B2区间", "B2C", "B4", "B4C", "B7", "B8", "B8B", "B支1", "B支1区间", "B支1快线", "B支2", "B支2C", "B支3", "B支3C", "B支4", "B支4快线", "B支7", "B支7C", "B支7D", "B支8"];
      break;
    case "温州市":
      brtlist = ["B1", "B2", "B3", "B4", "B101", "B102", "B103", "B104", "B105", "B106", "B107", "B108", "B109", "B111", "B112", "B113"];
      break;
    case "绍兴市":
      brtlist = ["BRT1号线", "BRT3号支线", "BRT5号线"];
      break;
    case "金华市":
      brtlist = ["B1", "B2", "B3-A", "B3-B", "B4", "B5", "金兰城际公交快线"];
      break;
    case "舟山市":
      brtlist = ["快速公交1号线"];
      break;
    default:
      brt = false;
      alert("该功能只支持浙江省城市。如当前城市有BRT线路，请放大地图再试");
  }
  if (brt) {
    clear();
    colorOption = $("#randomColor").val();
    enableAutoViewport = false;
    for (let i = 0, len = brtlist.length; i < len; i++) {
      if ($.inArray(brtlist[i], readyAdd) == -1) {
        bus.getBusList(brtlist[i]);
      }
    }
    $(this).attr("disabled", true).addClass("disable");
  }
});
$("#editBtn").click(function () {
  if (polyline) {
    if ($(this).hasClass("disable") == false) {
      polyline.enableEditing();
      $(this).addClass("disable").text("停用路径编辑");
    } else {
      polyline.disableEditing();
      $(this).removeClass("disable").text("启用路径编辑");
    }
  }
});
$("#clearBtn").click(function () {
  clear();
});
$("#mapStyle").change(function () {
  if ($(this).val() == 'default') {
    window.location.reload();
  } else {
    map.setMapStyleV2({
      styleId: $(this).val()
    });
  }
});
$("#drawLine").click(function () {
  $(this).addClass("disable").text("完成路径");
  $("#drawStation").removeClass("disable").text("添加标识");
  diyLine = true;
  first = true;
  diyStation = false;
  last = false;
  lineColor = $("#strokeColor").val();
  map.setDefaultCursor("crosshair");
  map.addEventListener("click", function (e) {
    if (diyLine) {
      let point = new BMap.Point(e.point.lng, e.point.lat);
      addPoint.push(point);
      let polyline = new BMap.Polyline(addPoint, getPolylineOptions());
      map.addOverlay(polyline);
      if (first) {
        let point = new BMap.Point(e.point.lng, e.point.lat);
        let marker = new BMap.Marker(point, {
          icon: stationIcon
        });
        map.addOverlay(marker);
        let label = new BMap.Label("起点", {
          offset: new BMap.Size(15, -5)
        });
        marker.setLabel(label);
        first = false;
      }
    }
  });
  map.addEventListener("dblclick", function (e) {
    $("#drawLine").removeClass("disable").text("添加路径");
    $("#editBtn").removeClass("disable");
    map.setDefaultCursor("url(http://api0.map.bdimg.com/images/openhand.cur) 8 8, default");
    if (!first) {
      let point = new BMap.Point(e.point.lng, e.point.lat);
      let marker = new BMap.Marker(point, {
        icon: stationIcon
      });
      map.addOverlay(marker);
      let label = new BMap.Label("终点", {
        offset: new BMap.Size(15, -5)
      });
      marker.setLabel(label);
      for (let i = 0, len = map.getOverlays().length; i < len; i++) {
        map.clearOverlays();
      }
      polyline = new BMap.Polyline(addPoint, getPolylineOptions());
      polyline.disableMassClear();
      map.addOverlay(polyline);
      readyAdd = [];
      addPoint = [];
      diyLine = false;
      first = true;
      last = true;
    }
  });
});
$("#drawStation").click(function () {
  $("#drawLine").removeClass("disable").text("添加路径");
  diyLine = false;
  diyStation = !diyStation;
  if (diyStation) {
    $(this).addClass("disable").text("完成标识");
    map.setDefaultCursor("pointer");
    map.addEventListener("click", function (e) {
      if (diyStation) {
        let point = new BMap.Point(e.point.lng, e.point.lat);
        let marker = new BMap.Marker(point, {
          icon: stationIcon
        });
        marker.disableMassClear();
        marker.enableDragging();
        map.addOverlay(marker);
        marker.addEventListener("dblclick", function (e) {
          e.target.enableMassClear();
          map.clearOverlays();
        });
      }
    });
  } else {
    $(this).removeClass("disable").text("添加标识");
    map.setDefaultCursor("url(http://api0.map.bdimg.com/images/openhand.cur) 8 8, default");
  }
});
$(".set").click(function () {
  diyLine = false;
  diyStation = false;
  map.setDefaultCursor("default");
  if ($(this).next().is(":hidden")) {
    $(this).find(".icon").text("-");
    $(this).siblings(".set").find(".icon").text("+");
  } else {
    $(this).find(".icon").text("+");
  }
  $(this).siblings(".set").next().hide();
  $(this).next().slideToggle();
  map.setDefaultCursor("url(http://api0.map.bdimg.com/images/openhand.cur) 8 8, default");
});