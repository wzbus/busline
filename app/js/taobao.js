map.on("complete", function () {
  let list = [{
    name: "4路",
    color: "#5298FF"
  }, {
    name: "71路",
    color: "#FF8080"
  }, {
    name: "108路",
    color: "#80FF00"
  }, {
    name: "155路",
    color: "#FF8000"
  }, {
    name: "185路",
    color: "#8000FF"
  }, {
    name: "286路",
    color: "#FF0080"
  }];
  $("#mapStyle").val("whitesmoke");
  city = "杭州市";
  map.setCity(city, function () {
    map.setMapStyle('amap://styles/whitesmoke');
    map.setZoomAndCenter(12, [120.140, 30.233]);
    lineSearch.setCity(city);
    stationSearch.setCity(city);
    for (line of list) {
      addLine(line.name, line.color);
      readyAdd.push(line.name);
    }
  });
});