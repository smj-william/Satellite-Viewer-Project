import React, { Component } from "react";
import axios from "axios";
import { Spin } from "antd";
import { feature } from "topojson-client";
import { geoKavrayskiy7 } from "d3-geo-projection";
import { geoGraticule, geoPath } from "d3-geo";
import { select as d3Select } from "d3-selection";
import { schemeCategory10 } from "d3-scale-chromatic";
import * as d3Scale from "d3-scale";
import { timeFormat as d3TimeFormat } from "d3-time-format";

import {
  WORLD_MAP_URL,
  SATELLITE_POSITION_URL,
  SAT_API_KEY
} from "../constants";

//定义宽高
const width = 960;
const height = 600;

class WorldMap extends Component {
  constructor() {
    super();
    this.state = {
      isLoading: false,
      isDrawing: false
    };
    this.map = null;
    this.color = d3Scale.scaleOrdinal(schemeCategory10);
    this.refMap = React.createRef();
    this.refTrack = React.createRef();
  }

  //拉取并分析世界地图数据
  componentDidMount() {
    axios
      .get(WORLD_MAP_URL) //get request
      .then(res => {
        const { data } = res; //拿回数据
        const land = feature(data, data.objects.countries).features;//画地图精度是国家
        this.generateMap(land);//用拿到的land信息去生成
      })
      .catch(e => {
        console.log("err in fetch map data ", e.message);
        ////网断了或者其他error 简单log一下

      });
  }

  //did update: component 只要rerender，did update就执行
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.satData !== this.props.satData) { //每次传入不一样的时候，才做事儿
        //每次传入的是用户所选的卫星
      const {
        latitude,
        longitude,
        elevation,
        altitude,
        duration
      } = this.props.observerData; //从obsearverData里面拿到上面的经纬度高度信息
      const endTime = duration * 60; //为了让卫星显示起来没那么慢，隔一分钟拿个点，才看得出效果

      this.setState({
        isLoading: true
      });

      //循环发api
      //map就是类似一种循环，
      const urls = this.props.satData.map(sat => {
        const { satid } = sat;
        const url = `/api/${SATELLITE_POSITION_URL}/${satid}/${latitude}/${longitude}/${elevation}/${endTime}/&apiKey=${SAT_API_KEY}`;

        return axios.get(url); //axios是发送请求
      });

      //里面全成功，才then，拿到个res数组
      Promise.all(urls)//把上面拿着的一堆api，合成一个大的单独的obj
        .then(res => {
          const arr = res.map(sat => sat.data);
          this.setState({ 
            isLoading: false,
            isDrawing: true
          });

          if (!prevState.isDrawing) {
            this.track(arr);//如果之前的画完了，就开启check
          } else {//如果没画完，提示用户
            const oHint = document.getElementsByClassName("hint")[0];
            oHint.innerHTML =
              "Please wait for these satellite animation to finish before selection new ones!";
          }
        })
        .catch(e => {
          console.log("err in fetch satellite position -> ", e.message);
        });
    }
  }

  //did update成功后，里面call这个函数
  track = data => {
    if (!data[0].hasOwnProperty("positions")) { //万一回来数据不对，直接error
      throw new Error("no position data");
      return;
    }

    //拿到具体多少个position 和 duration
    const len = data[0].positions.length;
    const { duration } = this.props.observerData;
    const { context2 } = this.map;

    //函数一跑起来，立马生成当前时间
    let now = new Date();

    let i = 0; //计数器

    //画一个 等一秒， 用setInterval（do， time）
    let timer = setInterval(() => {
      let ct = new Date(); //每秒生成当前时间

      let timePassed = i === 0 ? 0 : ct - now;//知道画到第几秒
      let time = new Date(now.getTime() + 60 * timePassed);//算出前三行结束的时间

      context2.clearRect(0, 0, width, height);//先擦除上次的点

      context2.font = "bold 14px sans-serif";//选择作画字体
      context2.fillStyle = "#333";
      context2.textAlign = "center";
      context2.fillText(d3TimeFormat(time), width / 2, 10); //画字，就是时间

      if (i >= len) {//i记录的是秒数，大于最长的len 就clear
        clearInterval(timer);
        this.setState({ isDrawing: false });
        const oHint = document.getElementsByClassName("hint")[0];
        oHint.innerHTML = "";
        return;
      }

      //画每一个卫星
      data.forEach(sat => {
        const { info, positions } = sat;
        this.drawSat(info, positions[i]);
      });

      i += 60; //每秒拿一个
    }, 1000); //每一秒 1000ms，做一个
  };

  //画卫星函数
  drawSat = (sat, pos) => {
    const { satlongitude, satlatitude } = pos; //拿到经纬度

    if (!satlongitude || !satlatitude) return; //无经纬度就不画了

    const { satname } = sat; //卫星名字
    const nameWithNumber = satname.match(/\d+/g).join("");

    const { projection, context2 } = this.map;
    const xy = projection([satlongitude, satlatitude]);//projection作用在sat上，返回在地图上的位置

    context2.fillStyle = this.color(nameWithNumber);
    context2.beginPath();
    context2.arc(xy[0], xy[1], 4, 0, 2 * Math.PI); //画小圆圈代表卫星
    context2.fill();

    //写卫星名字
    context2.font = "bold 11px sans-serif";
    context2.textAlign = "center";
    context2.fillText(nameWithNumber, xy[0], xy[1] + 14);
  };

  render() {
    const { isLoading } = this.state;
    return (
      <div className="map-box">
        {isLoading ? (
          <div className="spinner">
            <Spin tip="Loading..." size="large" />
          </div>
        ) : null}
        <canvas className="map" ref={this.refMap} />
        <canvas className="track" ref={this.refTrack} />
        <div className="hint" />
      </div>
    );
  }

  generateMap = land => {
      //定义变量 projection，并设置几个参数，对应放到2d面上出来的projection 是怎么样
    const projection = geoKavrayskiy7() //我们选择这种projection平铺方式
      .scale(170)
      .translate([width / 2, height / 2])
      .precision(0.1);

    const graticule = geoGraticule();

    //用D3select 来选择并调整宽高
    const canvas = d3Select(this.refMap.current)
      .attr("width", width)
      .attr("height", height);

    const canvas2 = d3Select(this.refTrack.current)
      .attr("width", width)
      .attr("height", height);

    //配置画图的笔
    const context = canvas.node().getContext("2d");
    const context2 = canvas2.node().getContext("2d");

    //规划路径
    let path = geoPath()
      .projection(projection)
      .context(context);

    //每个country调试画图
    land.forEach(ele => {
      context.fillStyle = "#B3DDEF";
      context.strokeStyle = "#000";
      context.globalAlpha = 0.7;
      context.beginPath();//规划路径
      path(ele);//D3的函数，国家信息传入
      context.fill();
      context.stroke();

      context.strokeStyle = "rgba(220, 220, 220, 0.1)";
      context.beginPath();
      path(graticule());//经纬度信息传入
      context.lineWidth = 0.1;
      context.stroke();

      context.beginPath();
      context.lineWidth = 0.5;
      path(graticule.outline());//画地球图外边界限
      context.stroke();
    });

    this.map = {
      projection: projection,
      graticule: graticule,
      context: context,
      context2: context2
    };
  };
}

export default WorldMap;

