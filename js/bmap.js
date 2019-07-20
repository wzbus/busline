window.onload = function () {
  document.oncontextmenu = function () {
    return false;
  }
};
var subway, city, inputLine, inputStation, lineOpacity, lineColor, colorOption, currentPolyline, polyline, brtlist,
  readyAdd = [], num = [], colorList = [], enableAutoViewport;
$("#search").click(function () {
  let start = $("#start").val();
  let end = $("#end").val();
  if (start && end) {
    let drct = new BMapSub.Direction(subway);
    drct.search(start, end);
  } else {
    return false;
  }
});
jQuery.noConflict();
(function ($) {
  var map = new BMap.Map("map", {
    enableMapClick: false
  });
  var traffic = new BMap.TrafficLayer();
  var myCity = new BMap.LocalCity();
  myCity.get(getCity);
  map.enableScrollWheelZoom();
  map.enableKeyboard();
  map.enableInertialDragging();
  map.disableDoubleClickZoom();
  map.addControl(new BMap.CityListControl({
    anchor: BMAP_ANCHOR_TOP_LEFT,
    offset: new BMap.Size(10, 10),
    onChangeSuccess: function (e) {
      city = e.city;
      clear();
      brtlist = '';
    }
  }));
  var cr = new BMap.CopyrightControl({
    anchor: BMAP_ANCHOR_BOTTOM_RIGHT,
    offset: new BMap.Size(5, 2)
  });
  map.addControl(cr);
  cr.addCopyright({
    id: 1,
    content: "<a href='index.html'>www.84ditu.com</a>"
  });
  var stationIcon = new BMap.Icon("pic/station_icon.png", new BMap.Size(12, 12));
  var getPolylineOptions = function getPolylineOptions () {
    return {
      strokeColor: lineColor,
      strokeWeight: $("#strokeWeight").val(),
      strokeOpacity: $("#strokeOpacity").val(),
      strokeStyle: $("#strokeStyle").val()
    }
  };
  var bus = new BMap.BusLineSearch(map, {
    onGetBusListComplete: function onGetBusListComplete (result) {
      let busListItem = $("#busListItem").val();
      let fstLine = result.getBusListItem(busListItem);
      bus.getBusLine(fstLine);
      if (!result.Zz.length) {
        alert("未检索到\"" + result.keyword + "\"，请确认有此线路数据后再试");
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
      map.addOverlay(polyline);
      let lineName = busline.name.substring(0, busline.name.indexOf("("));
      readyAdd.push(lineName.substring(0, lineName.length - 1).toUpperCase());
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
      });
    }
  });
  map.addEventListener("zoomend", function () {
    let geocoder = new BMap.Geocoder();
    geocoder.getLocation(map.getCenter(), function (e) {
      city = e.addressComponents.city;
    })
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
  function add () {
    let line = $("#busList").val().replace("路", "").toUpperCase();
    colorOption = "false";
    enableAutoViewport = true;
    addLine(line);
  }
  function addLine (line) {
    if ($.inArray(line, readyAdd) == -1) {
      bus.getBusList(line);
    } else {
      alert(line + "路已添加");
    }
  }
  function search () {
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
            let point = new BMap.Point(pois[0].point.lng, pois[0].point.lat);
            map.panTo(point);
            let marker = new BMap.Marker(point);
            marker.setAnimation(BMAP_ANIMATION_DROP);
            map.addOverlay(marker);
            let passBus = local.getResults().getPoi(0).address.split(";");
            $(".remark").show();
            $("#amount").text(passBus.length);
            for (let i = 0, len = passBus.length; i < len; i++) {
              addLine(passBus[i]);
            }
          } else {
            alert("未检索到\"" + $("#stationList").val() + "\"，请确认有此站点数据后再试");
          }
        });
      }
    });
    let station = $("#stationList").val() + '-公交站,';
    local.search(station, {
      forceLocal: "ture"
    });
  }
  function clear () {
    for (let i = 0, len = map.getOverlays().length; i < len; i++) {
      map.getOverlays()[i].enableMassClear();
    }
    map.clearOverlays();
    readyAdd = [];
    colorList = [];
    brtlist = "";
    $(".remark").hide();
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
  $("#subBtn").click(function () {
    if (["贵阳市", "乌鲁木齐市", "温州市", "济南市", "兰州市"].indexOf(city) != -1) {
      alert("当前贵阳、乌鲁木齐、温州、济南、兰州无数据");
    } else {
      $.getScript("https://api.map.baidu.com/api?type=subway&v=1.0&ak=CrkK1Axboq7E3K93fOE0GHfjII2z8Lwf&s=1")
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
            subway = new BMapSub.Subway("subMap", subwaycity.citycode);
            subway.setZoom(0.5);
            let zoomControl = new BMapSub.ZoomControl({
              anchor: BMAPSUB_ANCHOR_BOTTOM_RIGHT,
              offset: new BMapSub.Size(10, 100)
            });
            subway.addControl(zoomControl);
            subway.addEventListener('tap', function (e) {
              let detail = new BMapSub.DetailInfo(subway);
              detail.search(e.station.name);
            });
          } else {
            alert("当前城市无地铁");
          }
        })
        .fail(function () {
          alert("加载脚本失败，请检查网络后再试");
        });
    }
  });
  $(".search_revert").click(function () {
    let temp = $("#start").val();
    let end = $("#end").val();
    $("#start").val(end);
    $("#end").val(temp);
  });
  $("#close").click(function () {
    $("#subway").hide();
  });
  $("#brtBtn").click(function () {
    if (!brtlist) {
      $.ajax({
        type: "POST",
        url: "search.php",
        data: "city="+city,
        dataType: "json",
        success: function (res) {
          if (res) {
            brtlist = res;
            colorOption = $("#randomColor").val();
            enableAutoViewport = false;
            for (let i = 0, len = brtlist.length; i < len; i++) {
              if ($.inArray(brtlist[i], readyAdd) == -1) {
                bus.getBusList(brtlist[i]);
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
  $("#mapBtn").click(function () {
    window.open("amap.html");
  });
  $("#diyBtn").click(function () {
    let poi = map.getCenter();
    window.open(`diy.html?lng=${poi.lng}&lat=${poi.lat}`);
  });
  $("#clearBtn").click(function () {
    clear();
  });
  $("#mapStyle").change(function () {
    map.setMapStyleV2({
      styleId: $(this).val()
    });
    $("#layerBtn").removeClass("disable").text("显示实时路况");
  });
  $("#mapLayer").change(function () {
    if ($(this).val() == "false") {
      map.removeTileLayer(traffic);
    } else if ($("#mapStyle").val() == "c10f815814efe92503249e060e268f4c") {
      map.addTileLayer(traffic);
    } else {
      alert("该底图下不支持实时路况，请将风格改为默认");
      $(this).val("false");
    }
  });
  $(".drawBtn").not("#clearBtn").click(function () {
    $(this).next().slideToggle().parent().siblings().find(".container").hide();
  });
  $(".closeBtn").click(function () {
    $(this).parent().parent().slideToggle();
  });
})(jQuery);