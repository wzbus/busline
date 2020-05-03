$(function () {
  document.oncontextmenu = function () {
    return false;
  }
  String.prototype.delBrace = function () {
    let str = this.toString();
    if (str.indexOf("(") > 0) {
      return str.substring(0, str.indexOf("("));
    } else {
      return str
    }
  }
});
var city, readyAdd = [], brtlist, curColor, ruler, isCityList = false, style = localStorage.getItem("style");
var map = new AMap.Map("map", {
  zoom: 13,
  resizeEnable: true,
  isHotspot: false,
  doubleClickZoom: false,
  mapStyle: `amap://styles/${style}`
});
AMap.plugin('AMap.CitySearch', function () {
  citySearch = new AMap.CitySearch();
  let defCity = localStorage.getItem("defCity");
  if (defCity) {
    map.setCity(defCity, function () {
      city = defCity;
      map.setZoom(13);
      $(".container:first").show();
      initPlugins();
    });
  } else {
    citySearch.getLocalCity(function (status, result) {
      if (status === 'complete' && result.info === 'OK') {
        $(".container:first").show();
        city = result.city;
        $("#curCity").text(city);
        initPlugins();
      }
    });
  }
});
function initPlugins () {
  AMap.plugin(["AMap.LineSearch"], function () {
    lineSearch = new AMap.LineSearch({
      city,
      pageIndex: 1,
      pageSize: 2,
      extensions: 'all'
    });
  });
  AMap.plugin(["AMap.StationSearch"], function () {
    stationSearch = new AMap.StationSearch({
      city,
      pageIndex: 1,
      pageSize: 10
    });
    let url = location.search;
    if (url) {
      stationSearch.searchById(url.replace("?", ""), function (status, result) {
        if (status === 'complete' && result.info === 'OK') {
          let station = result.stationInfo[0];
          map.panTo([station.location.lng, station.location.lat]);
          chooseStation(station);
        } else {
          history.replaceState(null, null, "amap.html");
        }
      });
    }
  });
  AMap.plugin(["AMap.PlaceSearch"], function () {
    placeSearch = new AMap.PlaceSearch({
      type: "公共设施",
      city,
      citylimit: true,
      extensions: "all",
      autoFitView: true
    });
  });
  AMap.plugin(["AMap.MouseTool"], function () {
    contextMenu = new AMap.ContextMenu();
    contextMenu.addItem("附近公交站", function () {
      disNearStation();
    }, 0);
    contextMenu.addItem("测距工具", function () {
      measure();
    }, 1);
  });
}
var traffic = new AMap.TileLayer.Traffic({
  autoRefresh: true,
  interval: 180,
});
map.on("zoomend", change);
map.on("dragend", change);
map.on("touchend", change);
map.on("rightclick", function (e) {
  curLnglat = e.lnglat;
  contextMenu.open(map, curLnglat);
});
if (style) {
  $("#mapStyle").val(style);
}
// 获取当前城市
function change () {
  map.getCity(function (res) {
    city = res.city ? res.city : res.province;
    lineSearch.setCity(city);
    stationSearch.setCity(city);
    placeSearch.setCity(city);
    $("#curCity").text(city);
    $("#city_title").text(city);
  });
}
// 点击添加路线
function add () {
  addLine($("#busList").val(), undefined, true);
  history.replaceState(null, null, "amap.html");
}
// 添加路线
function addLine (line, lineColor = $("#strokeColor").val(), enableAutoViewport) {
  if ($.inArray(line, readyAdd) == -1 || $("#repeat").prop("checked")) {
    if (new RegExp(/^[0-9a-zA-Z]+$/).test(line)) {
      line = line.toUpperCase() + "路";
    }
    lineSearch.search(line, function (status, result) {
      if (status === 'complete' && result.info === 'OK') {
        let direction = $("#busListItem").val();
        let lineArr = result.lineInfo[direction];
        let name = lineArr.name;
        let lineName = name.delBrace();
        let distance = parseFloat(lineArr.distance).toFixed(1);
        let pathArr = lineArr.path;
        let stops = lineArr.via_stops;
        let startTime = lineArr.stime.slice(0, 2) + ':' + lineArr.stime.slice(2);
        let endTime = lineArr.etime.slice(0, 2) + ':' + lineArr.etime.slice(2);
        let polyline = new AMap.Polyline({
          map,
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
              map,
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
              passBus(stops[i].id).then(function (res) {
                new AMap.InfoWindow({
                content: `<p class="info_p"><span class="info_name">${stops[i].name}</span><span class="info_dis">全程${distance}公里</span>${startTime ? `<span class="info_dis">首末班&nbsp;${startTime}~${endTime}</span>` : ""}</p><p>${name}</p><p class="info_lines">途经公交:${res}</p>`,
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
              map.remove(marks[i]);
              if (marks[i].CLASS_NAME == "Overlay.Polyline") {
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
// 搜索站点
function search () {
  stationSearch.search($("#stationList").val(), function (status, result) {
    if (status === 'complete' && result.info === 'OK') {
      let searchArr = result.stationInfo;
      let stationArr = searchArr.filter(item => item.buslines.length);
      if (stationArr.length) {
        let searchNum = stationArr.length;
        if (searchNum) {
          clear();
          if (searchNum == 1) {
            chooseStation(stationArr[0]);
          } else {
            for (let i = 0; i < searchNum; i++) {
              let marker = new AMap.Marker({
                map,
                position: stationArr[i].location,
                icon: new AMap.Icon({
                  image: "pic/marker.png",
                  size: new AMap.Size(25, 35),
                  imageSize: new AMap.Size(25, 35)
                }),
                title: stationArr[i].name,
                offset: new AMap.Pixel(-12.5, -40)
              });
              marker.info = new AMap.InfoWindow({
                content: `<p><span>${stationArr[i].name}</span></p><button onclick='chooseStation(${JSON.stringify(stationArr[i])})' class="info_btn">绘制该站点途经公交</button>`,
                offset: new AMap.Pixel(0, -36),
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
// 查询途经路线
function passBus (id) {
  return new Promise(function (resolve, reject) {
    stationSearch.searchById(id, function (status, result) {
      if (status === 'complete' && result.info === 'OK') {
        let buslines = result.stationInfo[0].buslines;
        let str = "", arr = [];
        for (let i = 0; i < buslines.length; i++) {
          let lineName = buslines[i].name.replace("(停运)", "").delBrace();
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
// 绘制指定站点途经路线
function chooseStation (station) {
  clear();
  let center = station.location;
  map.setCenter(center);
  let marker = new AMap.Marker({
    map,
    position: center,
    icon: new AMap.Icon({
      image: "pic/marker.png",
      size: new AMap.Size(25, 35),
      imageSize: new AMap.Size(25, 35)
    }),
    offset: new AMap.Pixel(-12.5, -40),
    animation: "AMAP_ANIMATION_DROP"
  });
  let list = "", arr = [], len = station.buslines.length, colors;
  let isRandomColor = $("#randomColor").val() === "true";
  isRandomColor && (colors = createColor(len));
  for (let i = 0; i < len; i++) {
    if (station.buslines[i].name.indexOf("停运") < 0) {
      let lineName = station.buslines[i].name.delBrace();
      if ($.inArray(lineName, arr) == -1) {
        list = list + lineName + ",";
        arr.push(lineName);
        isRandomColor ? addLine(lineName, colors[i]) : addLine(lineName);
      }
    }
  }
  list = list.substring(0, list.length - 1);
  marker.info = new AMap.InfoWindow({
    content: `<p class="info_p"><span class="info_name">${station.name}</span></p><p style="font-size:14px">途经公交:${list}</p>`,
    offset: new AMap.Pixel(0, -36),
    closeWhenClickMap: true
  });
  marker.on("click", function (e) {
    e.target.info.open(map, e.target.getPosition());
  });
  $(".remark").show();
  $("#amount").text(arr.length);
  history.replaceState(null, null, `amap.html?${station.id}`);
}
// 从多个站点中选择站点途经路线
function chooseNearStation (station) {
  clear();
  let center = station.location;
  map.setCenter(center);
  let marker = new AMap.Marker({
    map,
    position: center,
    icon: new AMap.Icon({
      image: "pic/marker.png",
      size: new AMap.Size(25, 35),
      imageSize: new AMap.Size(25, 35)
    }),
    offset: new AMap.Size(-12.5, -40),
    animation: "AMAP_ANIMATION_DROP"
  });
  let str = station.address;
  let buslines = str.split(";");
  let list = "", arr = [], len = buslines.length, colors;
  let isRandomColor = $("#randomColor").val() === "true";
  isRandomColor && (colors = createColor(len));
  for (let i = 0; i < len; i++) {
    if (buslines[i].indexOf("停运") < 0) {
      let lineName = buslines[i].delBrace();
      if ($.inArray(lineName, arr) == -1) {
        list = list + lineName + ",";
        arr.push(lineName);
        isRandomColor ? addLine(lineName, colors[i]) : addLine(lineName);
      }
    }
  }
  list = list.substring(0, list.length - 1);
  marker.info = new AMap.InfoWindow({
    content: `<p class="info_p"><span class="info_name">${station.name}</span></p><p style="font-size:14px">途经公交:${list}</p>`,
    offset: new AMap.Pixel(0, -36),
    closeWhenClickMap: true
  });
  marker.on("click", function (e) {
    e.target.info.open(map, e.target.getPosition());
  });
  history.replaceState(null, null, `amap.html?${station.id}`);
}
// 查询附近公交站
function disNearStation () {
  clear();
  map.add(new AMap.Circle({
    center: curLnglat,
    radius: 500,
    strokeColor: "#5298ff",
    strokeWeight: 2,
    strokeOpacity: 0.5,
    fillColor: "#5298ff",
    fillOpacity: 0.5
  }));
  placeSearch.searchNearBy('公交站', curLnglat, 500, function (status, result) {
    if (status === 'complete' && result.info === 'OK') {
      let stationArr = result.poiList.pois;
      let searchNum = stationArr.length;
      for (let i = 0; i < searchNum; i++) {
        let marker = new AMap.Marker({
          map,
          position: stationArr[i].location,
          icon: new AMap.Icon({
            image: "pic/marker.png",
            size: new AMap.Size(25, 35),
            imageSize: new AMap.Size(25, 35)
          }),
          title: stationArr[i].name,
          offset: new AMap.Pixel(-12.5, -40)
        });
        marker.info = new AMap.InfoWindow({
          content: `<p><span>${stationArr[i].name}</span></p><button onclick='chooseNearStation(${JSON.stringify(stationArr[i])})' class="info_btn">绘制该站点途经公交</button>`,
          offset: new AMap.Pixel(0, -36),
          closeWhenClickMap: true,
          autoMove: false
        });
        marker.on("mouseover", function (e) {
          e.target.info.open(map, e.target.getPosition());
        });
        if (i == 0) {
          marker.info.open(map, stationArr[0].location);
        }
      }
      map.setFitView();
    } else {
      contextMenu.close();
      alert("附近500米内无公交站点");
    }
  });
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
// 生成随机色
function createColor (count) {
  return randomColor({
    luminosity: 'blight',
    count
  })
}
// 清除所有标记
function clear () {
  map.clearMap();
  readyAdd.length = 0;
  brtlist = null;
  $(".remark").hide();
}
// 选择城市
function chooseCity (adcode) {
  map.setCity(adcode, function (res) {
    if (res) {
      clear();
      $("#cityBox").hide();
      map.setZoom(13);
    }
  });
}
// 测距工具
function measure () {
  contextMenu.close();
  if (!ruler) {
    map.plugin(["AMap.RangingTool"], function () {
      ruler = new AMap.RangingTool(map);
      ruler.turnOn();
      ruler.on("end", function () {
        ruler.turnOff();
      });
    });
  } else {
    ruler.turnOn();
  }
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
          let len = brtlist.length, colors;
          let isRandomColor = $("#randomColor").val() === "true";
          isRandomColor && (colors = createColor(len));
          for (let i = 0; i < len; i++) {
            if ($.inArray(brtlist[i], readyAdd) == -1 || $("#repeat").prop("checked")) {
              isRandomColor ? addLine(brtlist[i], colors[i]) : addLine(brtlist[i]);
            }
          }
          history.replaceState(null, null, "amap.html");
        } else {
          alert("当前城市无快速公交BRT路线数据");
        }
      },
      error: function () {
        alert("请求数据库失败");
      }
    });
  } else {
    alert("已添加BRT路线，请清除所有标识后再试");
  }
});
$("#cityBtn").click(function () {
  let cityName = $("#cityName").val();
  if (cityName) {
    map.setCity(cityName, function () {
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
  localStorage.setItem("style", $(this).val());
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