"use strict";window.onload=function(){document.onkeydown=function(){var e=window.event||arguments[0];
  if(e.keyCode==123){return false}else{if(e.ctrlKey&&e.shiftKey&&e.keyCode==73){return false
  }else{if(e.ctrlKey&&e.keyCode==85){return false}}}};document.oncontextmenu=function(){return false
  }};var map=new BMap.Map("map");map.centerAndZoom("温州",13);map.enableScrollWheelZoom();
  map.enableKeyboard();map.enableInertialDragging();map.disableDoubleClickZoom();map.addControl(new BMap.CityListControl({anchor:BMAP_ANCHOR_TOP_LEFT}));
  var cr=new BMap.CopyrightControl({anchor:BMAP_ANCHOR_BOTTOM_LEFT,offset:new BMap.Size(472,2)});
  map.addControl(cr);cr.addCopyright({id:1,content:"&copy;温州公交吧 | 中华全知道"});var readyAdd=[],addPoint=[];
  var inputLine,lineOpacity,polyline,diyLine,diyStaion;var enableEditing=false;var stationIcon=new BMap.Icon("station_icon.png",new BMap.Size(12,12));
  var getPolylineOptions=function getPolylineOptions(){return{strokeColor:$("#strokeColor").val(),strokeWeight:$("#strokeWeight").val(),strokeOpacity:$("#strokeOpacity").val(),strokeStyle:$("#strokeStyle").val(),enableEditing:enableEditing}
  };var bus=new BMap.BusLineSearch(map,{onGetBusListComplete:function onGetBusListComplete(result){var busListItem=$("#busListItem").val();
  var fstLine=result.getBusListItem(busListItem);bus.getBusLine(fstLine)},onGetBusLineComplete:function onGetBusLineComplete(busline){polyline=new BMap.Polyline(busline.getPath(),getPolylineOptions());
  var lineName=busline.name.substr(0,busline.name.indexOf("("));map.addOverlay(polyline);
  if($("#strokeStation").val()=="true"){for(var i=0;i<busline.getNumBusStations();i++){var busStation=busline.getBusStation(i);
  var marker=new BMap.Marker(busStation.position,{icon:stationIcon});map.addOverlay(marker);
  marker.enableDragging();marker.setTitle(lineName+":"+busStation.name);marker.addEventListener("click",function(e){var opts={width:250,height:80,title:e.target.getTitle().substr(e.target.getTitle().indexOf(":")+1)};
  var content=busline.name;var infoWindow=new BMap.InfoWindow(content,opts);var point=new BMap.Point(e.target.getPosition().lng,e.target.getPosition().lat);
  map.openInfoWindow(infoWindow,point)})}}polyline.addEventListener("dblclick",function(e){var allOverlay=map.getOverlays();
  for(var i=0;i<allOverlay.length;i++){if(allOverlay[i].toString()=="[object Marker]"){if(allOverlay[i].getTitle().substr(0,allOverlay[i].getTitle().indexOf(":"))==lineName){allOverlay[i].enableMassClear()
  }else{allOverlay[i].disableMassClear()}}else{allOverlay[i].disableMassClear()}}e.target.enableMassClear();
  map.clearOverlays();readyAdd.pop(lineName)});polyline.addEventListener("mouseover",function(e){lineOpacity=e.target.getStrokeOpacity();
  e.target.setStrokeOpacity("1")});polyline.addEventListener("mouseout",function(e){e.target.setStrokeOpacity(lineOpacity)
  })}});function addLine(line){if($.inArray(line,readyAdd)==-1){bus.getBusList(line);
  readyAdd.push(line);$("#editBtn").removeClass("disable")}else{alert("该路线已添加")}}function clear(){map.clearOverlays();
  readyAdd=[];addPoint=[];$("#brtBtn").attr("disabled",false).removeClass("disable");
  $("#editBtn").addClass("disable").text("启用路径编辑")}$("#busList").bind("input propertychange",function(){inputLine=$("#busList").val()
  });$("#busList").focus(function(){inputLine=$("#busList").val();$(this).val("")});
  $("#busList").blur(function(){$(this).val(inputLine)});$("#addBtn").click(function(){var line=$("#busList").val().replace("路","");
  addLine(line)});$("#searchBtn").click(function(){clear();var local=new BMap.LocalSearch(map,{pageCapacity:1,renderOptions:{map:map,autoViewport:false},onSearchComplete:function(){var address=local.getResults().getPoi(0).address;
  var passBus=address.split(";");for(var i=0;i<passBus.length;i++){addLine(passBus[i])
  }}});var station=$("#stationList").val()+"-公交站,";local.search(station,{forceLocal:"ture"})
  });$("#brtBtn").click(function(){var brtlist=["B1","B2","B3","B4","B101","B102","B103","B104","B105","B106","B107","B108","B109","B111","B112","B113"];
  for(var i=0;i<brtlist.length;i++){if($.inArray(brtlist[i],readyAdd)==-1){readyAdd.push(brtlist[i]);
  bus.getBusList(brtlist[i])}}$(this).attr("disabled",true).addClass("disable")});$("#editBtn").click(function(){if(polyline){if($(this).hasClass("disable")==false){polyline.enableEditing();
  $(this).addClass("disable").text("停用路径编辑")}else{polyline.disableEditing();$(this).removeClass("disable").text("启用路径编辑")
  }}});$("#clearBtn").click(function(){clear()});$("#drawBtn").click(function(){diyLine=true;
  map.setDefaultCursor("crosshair");map.addEventListener("dblclick",function(){map.setDefaultCursor("default");
  polyline=new BMap.Polyline(addPoint,getPolylineOptions());for(var i=0;i<map.getOverlays().length;
  i++){map.clearOverlays()}map.addOverlay(polyline);addPoint=[];diyLine=false;$("#editBtn").removeClass("disable")
  });map.addEventListener("click",function(e){if(diyLine){var point=new BMap.Point(e.point.lng,e.point.lat);
  addPoint.push(point);var polyline=new BMap.Polyline(addPoint,getPolylineOptions());
  map.addOverlay(polyline);polyline.enableMassClear()}})});$("#stationBtn").click(function(){diyStation=true;
  map.addEventListener("click",function(e){if(diyStation){map.setDefaultCursor("pointer");
  var point=new BMap.Point(e.point.lng,e.point.lat);var marker=new BMap.Marker(point,{icon:stationIcon});
  map.addOverlay(marker)}});map.addEventListener("dblclick",function(){diyStation=false
  })});$(".set").click(function(){diyLine=diyStaion=false;map.setDefaultCursor("default");
  if($(this).next().is(":hidden")){$(this).find(".icon").text("-");$(this).siblings(".set").find(".icon").text("+")
  }else{$(this).find(".icon").text("+")}$(this).siblings(".set").next().hide();$(this).next().slideToggle()
  });