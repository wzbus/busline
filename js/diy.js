let mapCenter = [120.70, 28.00];
let url = location.search;
if (url) {
  let x = url.indexOf('lng=');
  let y = url.indexOf('lat=');
  if (x && y) {
    let lng = url.substring(x + 4, y - 1);
    let lat = url.substring(y + 4);
    mapCenter = [lng, lat];
  }
}
let map = new maptalks.Map('map', {
  center: mapCenter,
  zoom: 14,
  minZoom: 1,
  maxZoom: 19,
  doubleClickZoom: false,
  spatialReference: {
    projection: 'baidu'
  },
  baseLayer: new maptalks.TileLayer('base', {
    'urlTemplate': 'http://online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&scaler=1&p=1',
    'subdomains': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    'attribution': '&copy; <a target="_blank" href="http://map.baidu.com">Baidu</a>'
  })
}).on('mousemove', function (param) {
  let xy = document.getElementById('xy');
  xy.innerHTML = param.coordinate.x.toFixed(5) + ',' + param.coordinate.y.toFixed(5);
});
let metric = new maptalks.control.Scale({
  'position': 'bottom-left',
  'maxWidth': 100,
  'metric': true,
  'imperial': false
});
map.addControl(metric);
new Vue({
  el: '#app',
  data () {
    return {
      origin: 'baidu',
      style: 'none',
      layer: '',
      layers: [],
      drawTool: '',
      mode: '',
      cur: '',
      smooth: 'false',
      shape: 'circle',
      showSet: '',
      showLayers: false,
      plDefSymbol: {
        'lineColor': '#5298FF',
        'lineWidth': 3,
        'lineJoin': 'round',
        'lineCap': 'round',
        'lineOpacity': 0.8
      },
      pgDefSymbol: {
        'polygonFill': '#5298FF',
        'polygonOpacity': 0.5,
        'lineColor': '#5298FF',
        'lineWidth': 1,
        'lineJoin': 'round',
        'lineCap': 'round',
        'lineOpacity': 1
      },
      poDefSymbol: {
        'markerType': 'ellipse',
        'markerFill': "#ffffff",
        'markerLineColor': '#5298FF',
        'markerLineWidth': 2,
        'markerWidth': 8,
        'markerHeight': 8,
        'markerOpacity': 1
      },
      ptDefSymbol: {
        'textFill': '#5298FF',
        'textName': '文字',
        'textSize': 16,
      },
      plSymbol: {},
      pgSymbol: {},
      poSymbol: {},
      ptSymbol: {}
    }
  },
  methods: {
    setMap () {
      if (this.origin === 'baidu') {
        map.setSpatialReference({
          projection: 'baidu'
        }).setBaseLayer(new maptalks.TileLayer('base', {
          'urlTemplate': 'http://online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&scaler=1&p=1',
          'subdomains': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
          'attribution': '&copy; <a target="_blank" href="http://map.baidu.com">Baidu</a>',
          'cssFilter': this.style
        }));
      } else if (this.origin === 'tianditu') {
        map.setSpatialReference({
          projection: 'EPSG:4326'
        }).setBaseLayer(new maptalks.TileLayer('base', {
          'tileSystem': [1, -1, -180, 90],
          'urlTemplate': 'http://t{s}.tianditu.com/DataServer?T=vec_c&x={x}&y={y}&l={z}&tk=de0dc270a51aaca3dd4e64d4f8c81ff6',
          'subdomains': ['1', '2', '3', '4', '5'],
          'attribution': '&copy; <a target="_blank" href="http://www.tianditu.cn">Tianditu</a>',
          'cssFilter': this.style
        })).addLayer(new maptalks.TileLayer('road', {
          'urlTemplate': 'http://t{s}.tianditu.com/DataServer?T=cva_c&x={x}&y={y}&l={z}&tk=de0dc270a51aaca3dd4e64d4f8c81ff6',
          'subdomains': ['1', '2', '3', '4', '5'],
          'opacity': 1
        }));
      }
    },
    draw (m, n, s) {
      this.mode = n;
      this.drawTool.setMode(m).setSymbol(s).enable();
      map.setCursor('crosshair');
      if (this.cur) {
        this.cur.endEdit();
      }
    },
    setSmooth () {
      if (this.smooth) {
        this.cur.endEdit().setOptions({ 'smoothness': 0.5 });
      } else {
        this.cur.endEdit().setOptions({ 'smoothness': 0 });
      }
    },
    setShape () {
      if (this.shape === 'circle') {
        this.poSymbol = {
          'markerType': 'ellipse',
          'markerFill': "#ffffff",
          'markerLineColor': '#5298FF',
          'markerLineWidth': 2,
          'markerWidth': 8,
          'markerHeight': 8,
          'markerOpacity': 1
        }
      } else {
        this.poSymbol = {
          'markerFile': 'pic/bubble_icon.png',
          'markerWidth': 20,
          'markerHeight': 35,
          'markerOpacity': 1
        }
      }
    },
    undo () {
      this.cur.undoEdit();
    },
    redo () {
      this.cur.redoEdit();
    },
    closeSet () {
      this.cur.endEdit();
      this.showSet = false;
    },
    closeLayers () {
      this.showLayers = false;
    },
    upLayer (i) {
      if (i > 0) {
        this.showLayers = false;
        let temp = this.layers[i - 1];
        this.layers[i - 1] = this.layers[i];
        this.layers[i] = temp;
        map.sortLayers([...this.layers].reverse());
        this.showLayers = true;
      }
    },
    downLayer (i) {
      if (i < this.layers.length - 1) {
        this.showLayers = false;
        let temp = this.layers[i + 1];
        this.layers[i + 1] = this.layers[i];
        this.layers[i] = temp;
        map.sortLayers([...this.layers].reverse());
        this.showLayers = true;
      }
    },
    showLayer (n) {
      if (map.getLayer(n).isVisible()) {
        map.getLayer(n).hide();
      } else {
        map.getLayer(n).show();
      }
    },
    removeLayer (n, i) {
      if (confirm("此操作会删除图层，是否继续？")) {
        map.removeLayer(n);
        this.layers.splice(i, 1);
      } else {
        return false;
      }
    },
    openSet () {
      this.showSet = 'dt';
      this.showLayers = true;
    },
    share () {
      alert('暂不可用');
      // let mapJson = this.map.toJSON();
      // console.log(mapJson);
    }
  },
  watch: {
    plSymbol: {
      handler (val) {
        this.cur.updateSymbol(val);
        this.plDefSymbol = val;
      },
      deep: true
    },
    pgSymbol: {
      handler (val) {
        this.cur.updateSymbol(val);
        this.pgDefSymbol = val;
      },
      deep: true
    },
    poSymbol: {
      handler (val) {
        this.cur.updateSymbol(val);
        this.poDefSymbol = val;
      },
      deep: true
    },
    ptSymbol: {
      handler (val) {
        this.cur.updateSymbol(val);
        this.ptDefSymbol = val;
      },
      deep: true
    }
  },
  mounted () {
    let that = this;
    this.drawTool = new maptalks.DrawTool({
      mode: 'LineString',
      once: true,
      autoPanAtEdge: true
    }).addTo(map).disable();
    let i = 0;
    this.drawTool.on('drawend', function (param) {
      i++;
      that.layers.unshift('图层' + i);
      new maptalks.VectorLayer('图层' + i).addTo(map).bringToFront().addGeometry(param.geometry);
      map.resetCursor();
      that.cur = param.geometry;
      param.geometry.setProperties({ 'mode': that.mode });
      param.geometry.on('dblclick', function () {
        if (that.cur) {
          that.cur.endEdit();
        }
        that.cur = this;
        switch (this.getProperties().mode) {
          case 'pl':
            this.startEdit({ 'centerHandleSymbol': 'none' });
            that.showSet = 'pl';
            that.plSymbol = this.getSymbol();
            break;
          case 'pg':
            this.startEdit();
            that.showSet = 'pg';
            that.pgSymbol = this.getSymbol();
            break;
          case 'po':
            this.startEdit({ 'vertexHandleSymbol': 'none' });
            that.showSet = 'po';
            that.poSymbol = this.getSymbol();
            break;
          case 'pt':
            this.startEdit({ 'centerHandleSymbol': 'none' });
            that.showSet = 'pt';
            that.ptSymbol = this.getSymbol();
            break;
          default:
            break;
        }
      });
    });
  }
});