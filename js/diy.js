window.onload = function () {
  document.oncontextmenu = function () {
    return false;
  }
};
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
    urlTemplate: 'http://online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&scaler=1&p=1',
    subdomains: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    attribution: '&copy; <a target="_blank" href="http://map.baidu.com">Baidu</a>'
  })
});
let drawTool = new maptalks.DrawTool({
  mode: 'LineString',
  once: true
}).addTo(map).disable();
map.on('contextmenu', function () {
  if (drawTool.isEnabled() && !drawTool.getCurrentGeometry()) {
    drawTool.disable();
    map.resetCursor();
  }
});
const coordOptions = {
  position: {
    bottom: 0,
    right: 0
  },
  style: {
    padding: '0 5px',
    backgroundColor: 'rgba(255,255,255,0.7)',
    fontSize: '13px'
  }
}
class Coordinate extends maptalks.control.Control {
  buildOn (map) {
    let dom = document.createElement('div');
    Object.assign(dom.style, this.options.style);
    return dom;
  }
  onAdd () {
    this._map.on('mousemove', function (event) {
      this._controlDom.innerText = event.coordinate.x.toFixed(5) + " , " + event.coordinate.y.toFixed(5);
    }, this);
  }
}
Coordinate.mergeOptions(coordOptions);
new Coordinate().addTo(map);
new maptalks.control.Scale({
  position: 'bottom-left',
  maxWidth: 100,
  metric: true,
  imperial: false
}).addTo(map);

new Vue({
  el: '#app',
  data () {
    return {
      list: [{
        icon: '\ue617',
        des: '添加折线',
        fx: 'LineString',
        fy: 'pl',
        fz: {
          lineColor: '#5298FF',
          lineWidth: 3,
          lineJoin: 'round',
          lineCap: 'round',
          lineOpacity: 0.8
        }
      }, {
        icon: '\ue619',
        des: '添加多边形',
        fx: 'Polygon',
        fy: 'pg',
        fz: {
          polygonFill: '#5298FF',
          polygonOpacity: 0.5,
          lineColor: '#5298FF',
          lineWidth: 1,
          lineJoin: 'round',
          lineCap: 'round',
          lineOpacity: 1
        }
      }, {
        icon: '\ue604',
        des: '添加图标',
        fx: 'Point',
        fy: 'po',
        fz: {
          markerType: 'ellipse',
          markerFill: "#ffffff",
          markerLineColor: '#5298FF',
          markerLineWidth: 2,
          markerWidth: 8,
          markerHeight: 8,
          markerOpacity: 1
        }
      }, {
        icon: '\ue632',
        des: '添加文字',
        fx: 'Point',
        fy: 'pt',
        fz: {
          textFill: '#5298FF',
          textName: '文字',
          textSize: 16,
        }
      }],
      origin: 'baidu',
      style: 'none',
      layer: '',
      layers: [],
      mode: '',
      cur: '',
      smooth: 'false',
      shape: 'circle',
      showSet: '',
      showLayers: false,
      plSymbol: {},
      pgSymbol: {},
      poSymbol: {},
      ptSymbol: {},
      udo: 0,
      rdo: 0
    }
  },
  methods: {
    setMap () {
      if (this.origin === 'baidu') {
        map.setSpatialReference({
          projection: 'baidu'
        }).setBaseLayer(new maptalks.TileLayer('base', {
          urlTemplate: 'http://online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&scaler=1&p=1',
          subdomains: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
          attribution: '&copy; <a target="_blank" href="http://map.baidu.com">Baidu</a>',
          cssFilter: this.style
        }));
      } else if (this.origin === 'tianditu') {
        map.setSpatialReference({
          projection: 'EPSG:4326'
        }).setBaseLayer(new maptalks.TileLayer('base', {
          tileSystem: [1, -1, -180, 90],
          urlTemplate: 'http://t{s}.tianditu.com/DataServer?T=vec_c&x={x}&y={y}&l={z}&tk=de0dc270a51aaca3dd4e64d4f8c81ff6',
          subdomains: ['1', '2', '3', '4', '5'],
          attribution: '&copy; <a target="_blank" href="http://www.tianditu.cn">Tianditu</a>',
          cssFilter: this.style
        })).addLayer(new maptalks.TileLayer('road', {
          urlTemplate: 'http://t{s}.tianditu.com/DataServer?T=cva_c&x={x}&y={y}&l={z}&tk=de0dc270a51aaca3dd4e64d4f8c81ff6',
          subdomains: ['1', '2', '3', '4', '5'],
          opacity: 1
        }));
      }
    },
    draw (m, n, s) {
      this.mode = n;
      drawTool.setMode(m).setSymbol(s).enable();
      map.setCursor('crosshair');
      if (this.cur && drawTool.isEnabled()) {
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
          markerFile: null,
          markerType: 'ellipse',
          markerFill: "#ffffff",
          markerLineColor: '#5298FF',
          markerLineWidth: 2,
          markerWidth: 8,
          markerHeight: 8,
          markerOpacity: 1
        }
      } else {
        this.poSymbol = {
          markerFile: 'pic/bubble_icon.png',
          markerWidth: 20,
          markerHeight: 35,
          markerOpacity: 1
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
        let temp = this.layers[i - 1];
        this.$set(this.layers, i - 1, this.layers[i]);
        this.$set(this.layers, i, temp);
        let arr = [];
        for (let i in this.layers) {
          arr.push(this.layers[i].name);
        }
        map.sortLayers([...arr].reverse());
      }
    },
    downLayer (i) {
      if (i < this.layers.length - 1) {
        let temp = this.layers[i + 1];
        this.$set(this.layers, i + 1, this.layers[i]);
        this.$set(this.layers, i, temp);
        let arr = [];
        for (let i in this.layers) {
          arr.push(this.layers[i].name);
        }
        map.sortLayers([...arr].reverse());
      }
    },
    hideLayer (i) {
      map.getLayer(this.layers[i].name).hide();
      this.layers[i].isShow = false;
    },
    showLayer (i) {
      map.getLayer(this.layers[i].name).show();
      this.layers[i].isShow = true;
    },
    removeLayer (i) {
      if (confirm("此操作会删除图层，是否继续？")) {
        map.removeLayer(this.layers[i].name);
        this.layers.splice(i, 1);
      } else {
        return false;
      }
    },
    openSet () {
      if (this.showSet != 'dt') {
        this.showSet = 'dt';
        this.showLayers = true;
      } else {
        this.showSet = '';
        this.showLayers = false;
      }
    },
    save () {
      map.toDataURL({
        mimeType: 'image/jpeg',
        save: true,
        fileName: 'map'
      });
    },
    share () {
      let mapJson = this.map.toJSON();
      console.log(mapJson);
    }
  },
  watch: {
    plSymbol: {
      handler (val) {
        this.cur.updateSymbol(val);
        this.list[0].fz = val;
      },
      deep: true
    },
    pgSymbol: {
      handler (val) {
        this.cur.updateSymbol(val);
        this.list[1].fz = val;
      },
      deep: true
    },
    poSymbol: {
      handler (val) {
        this.cur.updateSymbol(val);
        this.list[2].fz = val;
      },
      deep: true
    },
    ptSymbol: {
      handler (val) {
        this.cur.updateSymbol(val);
        this.list[3].fz = val;
      },
      deep: true
    }
  },
  mounted () {
    const that = this;
    let i = 0;
    drawTool.on('drawend', function (param) {
      i++;
      that.layers.unshift({
        name: '图层' + i,
        isShow: true
      });
      new maptalks.VectorLayer('图层' + i).addTo(map).bringToFront().addGeometry(param.geometry);
      map.resetCursor();
      that.cur = param.geometry;
      param.geometry.setProperties({ 'mode': that.mode });
      param.geometry.on('click', function () {
        if (!drawTool.isEnabled()) {
          if (that.cur) {
            that.cur.endEdit();
          }
          that.cur = this;
          switch (this.getProperties().mode) {
            case 'pl':
              this.startEdit({ centerHandleSymbol: 'none' });
              that.showSet = 'pl';
              that.plSymbol = this.getSymbol();
              break;
            case 'pg':
              this.startEdit();
              that.showSet = 'pg';
              that.pgSymbol = this.getSymbol();
              break;
            case 'po':
              this.startEdit({ vertexHandleSymbol: 'none' });
              that.showSet = 'po';
              that.poSymbol = this.getSymbol();
              break;
            case 'pt':
              this.startEdit({ centerHandleSymbol: 'none' });
              that.showSet = 'pt';
              that.ptSymbol = this.getSymbol();
              break;
            default:
              break;
          }
        }
      });
    });
  }
});